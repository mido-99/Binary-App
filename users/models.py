from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Buyer account. referred_by is immutable once set (enforced in save/clean).
    """
    email = models.EmailField("email address", unique=True, db_index=True)
    referred_by = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="referrals",
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]  # username kept for admin compatibility, can be same as email

    class Meta:
        db_table = "users"
        indexes = [
            models.Index(fields=["referred_by"], name="idx_users_referred_by"),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(referred_by__isnull=True) | ~models.Q(referred_by_id=models.F("id")),
                name="users_referred_by_not_self",
            ),
        ]

    def __str__(self):
        return self.email
