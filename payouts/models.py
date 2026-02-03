from django.conf import settings
from django.db import models


class Payout(models.Model):
    class Status(models.TextChoices):
        REQUESTED = "requested", "Requested"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="payouts",
        db_index=True,
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.REQUESTED,
    )

    class Meta:
        db_table = "payouts"
        indexes = [
            models.Index(fields=["user"], name="idx_payout_user"),
        ]

    def __str__(self):
        return f"Payout {self.pk} user={self.user_id} {self.amount} {self.status}"
