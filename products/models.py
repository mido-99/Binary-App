from django.db import models

from sellers.models import Store


class Product(models.Model):
    class Category(models.TextChoices):
        ELECTRONICS = "electronics", "Electronics"
        FASHION = "fashion", "Fashion"
        HOME = "home", "Home & Living"
        SPORTS = "sports", "Sports & Outdoors"
        BEAUTY = "beauty", "Beauty"
        OTHER = "other", "Other"

    store = models.ForeignKey(
        Store,
        on_delete=models.CASCADE,
        related_name="products",
        db_index=True,
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, blank=True)
    description = models.TextField(blank=True, help_text="Short/brief description for listing.")
    full_description = models.TextField(
        blank=True,
        help_text="Full description for item detail page (HTML or plain text).",
    )
    category = models.CharField(
        max_length=32,
        choices=Category.choices,
        default=Category.OTHER,
        db_index=True,
    )
    base_price = models.DecimalField(max_digits=12, decimal_places=2)
    markup_price = models.DecimalField(max_digits=12, decimal_places=2)
    discount_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Discount percentage (e.g. 15 for 15%% off).",
    )
    sale_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="If set, shown as current price (discounted).",
    )
    image = models.CharField(
        max_length=255,
        blank=True,
        help_text="Path under MEDIA_ROOT, e.g. products/Electronics.jpg",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "products"
        indexes = [
            models.Index(fields=["store"], name="idx_products_store"),
        ]

    def __str__(self):
        return f"Product {self.pk} (store={self.store_id})"
