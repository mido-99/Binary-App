"""
Celery tasks for purchase processing and bonus calculation.
All bonus logic runs here (never in HTTP request). Idempotent and append-only.
"""
from celery import shared_task


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
    """
    return {"user_id": user_id, "status": "queued"}
