"""
Create demo users, sellers, stores, and products for preview/debug.
Run: python manage.py load_demo_data
Idempotent: skips creating if demo data already present (by store names).
"""
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from products.models import Product
from sellers.models import Seller, Store
from users.models import User


DEMO_STORES = [
    {
        "store_name": "Demo Tech Shop",
        "owner_email": "demo-tech@example.com",
        "products": [
            {"name": "Wireless Earbuds Pro", "category": Product.Category.ELECTRONICS, "base": "49.99", "markup": "64.99", "description": "Noise-cancelling wireless earbuds with 24h battery."},
            {"name": "USB-C Hub 7-in-1", "category": Product.Category.ELECTRONICS, "base": "32.00", "markup": "42.00", "description": "HDMI, USB 3.0, SD card reader, power delivery."},
            {"name": "Mechanical Keyboard", "category": Product.Category.ELECTRONICS, "base": "89.00", "markup": "109.00", "description": "RGB backlit, Cherry MX-style switches."},
        ],
    },
    {
        "store_name": "Urban Fashion Co",
        "owner_email": "demo-fashion@example.com",
        "products": [
            {"name": "Organic Cotton Tee", "category": Product.Category.FASHION, "base": "18.00", "markup": "26.00", "description": "Unisex fit, multiple colors."},
            {"name": "Canvas Backpack", "category": Product.Category.FASHION, "base": "45.00", "markup": "59.00", "description": "Laptop sleeve, water-resistant."},
            {"name": "Minimalist Watch", "category": Product.Category.FASHION, "base": "65.00", "markup": "85.00", "description": "Stainless steel, leather strap."},
        ],
    },
    {
        "store_name": "Home & Living Demo",
        "owner_email": "demo-home@example.com",
        "products": [
            {"name": "Desk Lamp LED", "category": Product.Category.HOME, "base": "28.00", "markup": "38.00", "description": "Adjustable brightness, USB port."},
            {"name": "Throw Blanket", "category": Product.Category.HOME, "base": "35.00", "markup": "48.00", "description": "Soft fleece, machine washable."},
            {"name": "Storage Baskets Set", "category": Product.Category.HOME, "base": "22.00", "markup": "32.00", "description": "Set of 3, natural weave."},
        ],
    },
    {
        "store_name": "Outdoor Gear",
        "owner_email": "demo-outdoor@example.com",
        "products": [
            {"name": "Camping Headlamp", "category": Product.Category.SPORTS, "base": "19.00", "markup": "27.00", "description": "Waterproof, rechargeable."},
            {"name": "Yoga Mat", "category": Product.Category.SPORTS, "base": "24.00", "markup": "34.00", "description": "Non-slip, 6mm thick."},
            {"name": "Water Bottle 1L", "category": Product.Category.SPORTS, "base": "15.00", "markup": "22.00", "description": "BPA-free, insulated."},
        ],
    },
]


class Command(BaseCommand):
    help = "Load demo stores, sellers, and products for preview/debug."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Recreate demo data even if stores already exist (deletes existing demo stores/products).",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        force = options["force"]
        existing = Store.objects.filter(name__in=[s["store_name"] for s in DEMO_STORES]).exists()
        if existing and not force:
            self.stdout.write(self.style.WARNING("Demo data already present. Use --force to replace."))
            return

        if existing and force:
            for s in DEMO_STORES:
                store = Store.objects.filter(name=s["store_name"]).first()
                if store:
                    Product.objects.filter(store=store).delete()
                    if getattr(store, "seller_ref", None):
                        seller = store.seller_ref
                        seller.store = None
                        seller.save()
                    store.delete()
            self.stdout.write("Removed existing demo stores.")

        created_users = 0
        created_stores = 0
        created_products = 0

        for data in DEMO_STORES:
            user, u_created = User.objects.get_or_create(
                email=data["owner_email"],
                defaults={"username": data["owner_email"], "is_active": True},
            )
            if u_created:
                user.set_password("demo1234")
                user.save()
                created_users += 1

            seller, _ = Seller.objects.get_or_create(owner=user, defaults={})
            store_created, store_new = Store.objects.get_or_create(
                name=data["store_name"],
                defaults={"seller_ref": seller},
            )
            if store_new:
                created_stores += 1
            seller.store = store_created
            seller.save(update_fields=["store"])
            if not store_created.seller_ref_id:
                store_created.seller_ref = seller
                store_created.save(update_fields=["seller_ref"])

            for p in data["products"]:
                _, p_created = Product.objects.get_or_create(
                    store=store_created,
                    name=p["name"],
                    defaults={
                        "category": p["category"],
                        "description": p.get("description", ""),
                        "base_price": Decimal(p["base"]),
                        "markup_price": Decimal(p["markup"]),
                        "is_active": True,
                    },
                )
                if p_created:
                    created_products += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Demo data loaded: {created_users} users, {created_stores} stores, {created_products} products. "
                "Demo seller passwords: demo1234"
            )
        )
