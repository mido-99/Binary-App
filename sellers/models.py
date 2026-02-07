from django.conf import settings
from django.db import models


class Seller(models.Model):
    """Declared first so Store can reference it."""
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="seller_profiles",
        db_index=True,
    )
    store = models.OneToOneField(
        "Store",
        on_delete=models.CASCADE,
        related_name="seller",
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "sellers"
        indexes = [
            models.Index(fields=["owner"], name="idx_sellers_owner"),
        ]

    def __str__(self):
        return f"Seller {self.owner_id}"


class Store(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    seller_ref = models.OneToOneField(
        Seller,
        on_delete=models.CASCADE,
        related_name="store_ref",
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "stores"

    def __str__(self):
        return self.name
