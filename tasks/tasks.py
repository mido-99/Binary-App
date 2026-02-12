"""
Celery tasks for purchase processing and bonus calculation.
All bonus logic runs here (never in HTTP request). Idempotent and append-only.
"""
from decimal import Decimal

from celery import shared_task
from django.db import transaction
from django.contrib.auth import get_user_model

from tree.models import PairingCounter
from bonuses.models import BonusEvent
from orders.models import Order
from tasks.models import BackgroundTask

User = get_user_model()

# Fixed amount for one released pair (demo/placeholder until real rules).
RELEASE_PAIR_BONUS_AMOUNT = Decimal("10.00")


def _get_system_order():
    """Get or create a single system order used for demo/adjustment bonus events."""
    system_user, created = User.objects.get_or_create(
        email="system@internal",
        defaults={"username": "system"},
    )
    if created:
        system_user.set_unusable_password()
        system_user.save(update_fields=["password"])
    order = Order.objects.filter(buyer=system_user).first()
    if not order:
        order = Order.objects.create(
            buyer=system_user,
            total_price=Decimal("0"),
            status=Order.Status.PAID,
            shipping_full_name="",
            shipping_address_line1="",
            shipping_address_line2="",
            shipping_city="",
            shipping_state="",
            shipping_zip_code="",
            shipping_country="",
            shipping_phone="",
            payment_method="system",
        )
    return order


@shared_task(bind=True)
def process_purchase(self, order_id: int):
    """
    Process a paid order: traverse hierarchy, create bonus events, update pairing counters.
    Idempotent; safe to retry.
    """
    # Placeholder: will traverse buyer's ancestors, create DIRECT/HIERARCHY bonus_events,
    # increment pairing counters, and release pairs when min(L,R) increases.
    return {"order_id": order_id, "status": "queued"}


@shared_task(bind=True)
def release_pairs_for_user(self, user_id: int):
    """
    Release one pair's worth of bonuses for user when min(left_count, right_count) increased.
    Idempotent: only releases one pair per call if min(L, R) > released_pairs.
    Creates a BonusEvent (RELEASED) and increments PairingCounter.released_pairs.
    """
    task_id = None
    try:
        bt = BackgroundTask.objects.create(
            task_name="release_pairs_for_user",
            related_object_id=str(user_id),
            status="running",
        )
        task_id = bt.pk
    except Exception:
        pass  # Optional audit; don't fail the task

    try:
        with transaction.atomic():
            user = User.objects.filter(pk=user_id).first()
            if not user:
                result = {"user_id": user_id, "status": "skipped", "reason": "user_not_found"}
                if task_id:
                    BackgroundTask.objects.filter(pk=task_id).update(status="skipped")
                return result

            counter = (
                PairingCounter.objects.select_for_update()
                .get_or_create(user=user, defaults={"left_count": 0, "right_count": 0, "released_pairs": 0})[0]
            )
            min_lr = min(counter.left_count, counter.right_count)
            if min_lr <= counter.released_pairs:
                result = {"user_id": user_id, "status": "no_op", "released_pairs": counter.released_pairs}
                if task_id:
                    BackgroundTask.objects.filter(pk=task_id).update(status="completed")
                return result

            counter.released_pairs += 1
            counter.save(update_fields=["released_pairs", "updated_at"])

            system_order = _get_system_order()
            BonusEvent.objects.create(
                user=user,
                order=system_order,
                bonus_type=BonusEvent.BonusType.HIERARCHY,
                amount=RELEASE_PAIR_BONUS_AMOUNT,
                status=BonusEvent.Status.RELEASED,
                depth=0,
            )
        result = {"user_id": user_id, "status": "released", "released_pairs": counter.released_pairs}
        if task_id:
            BackgroundTask.objects.filter(pk=task_id).update(status="completed")
        return result
    except Exception as e:
        if task_id:
            BackgroundTask.objects.filter(pk=task_id).update(status="failed")
        raise
