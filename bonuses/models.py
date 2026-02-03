from django.conf import settings
from django.db import models

from orders.models import Order


class BonusEvent(models.Model):
    """
    Append-only bonus ledger. Never update amount; only status PENDING -> RELEASED.
    """
    class BonusType(models.TextChoices):
        DIRECT = "DIRECT", "Direct"
        HIERARCHY = "HIERARCHY", "Hierarchy"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        RELEASED = "RELEASED", "Released"

    class Lane(models.TextChoices):
        L = "L", "Left"
        R = "R", "Right"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bonus_events",
        db_index=True,
    )
    order = models.ForeignKey(
        Order,
        on_delete=models.PROTECT,
        related_name="bonus_events",
        db_index=True,
    )
    bonus_type = models.CharField(max_length=20, choices=BonusType.choices)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    lane = models.CharField(max_length=1, choices=Lane.choices, null=True, blank=True)
    depth = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "bonus_events"
        indexes = [
            models.Index(fields=["user"], name="idx_bonus_user"),
            models.Index(fields=["order"], name="idx_bonus_order"),
            models.Index(fields=["status"], name="idx_bonus_status"),
        ]

    def __str__(self):
        return f"BonusEvent {self.pk} user={self.user_id} {self.bonus_type} {self.amount} {self.status}"
