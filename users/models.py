from django.conf import settings
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


class ShippingAddress(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="shipping_addresses",
        db_index=True,
    )
    full_name = models.CharField(max_length=255)
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100)
    phone = models.CharField(max_length=50, blank=True)
    is_default = models.BooleanField(default=False)

    class Meta:
        db_table = "users_shipping_addresses"
        indexes = [models.Index(fields=["user"], name="idx_shipping_user")]

    def __str__(self):
        return f"{self.full_name}, {self.city}"


class Wishlist(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wishlist_items",
        db_index=True,
    )
    product = models.ForeignKey(
        "products.Product",
        on_delete=models.CASCADE,
        related_name="wishlist_entries",
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "users_wishlist"
        constraints = [
            models.UniqueConstraint(fields=["user", "product"], name="users_wishlist_user_product_unique"),
        ]
        indexes = [models.Index(fields=["user"], name="idx_wishlist_user")]

    def __str__(self):
        return f"Wishlist {self.user_id} product={self.product_id}"
