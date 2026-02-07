"""
Create demo users, sellers, stores, and products for preview/debug.
Run: python manage.py load_demo_data
Idempotent: skips creating if demo data already present (by store names).
Use --force to replace with fresh data (includes full_description, discounts).
"""
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from products.models import Product
from sellers.models import Seller, Store
from users.models import User


def _product(
    name,
    category,
    base,
    markup,
    description,
    full_description=None,
    discount_percent=None,
    sale_price=None,
    image=None,
):
    d = {
        "name": name,
        "category": category,
        "base": base,
        "markup": markup,
        "description": description,
        "full_description": full_description or description,
        "discount_percent": discount_percent,
        "sale_price": sale_price,
        "image": image or "",
    }
    return d


DEMO_STORES = [
    {
        "store_name": "Demo Tech Shop",
        "owner_email": "demo-tech@example.com",
        "products": [
            _product(
                "Wireless Earbuds Pro",
                Product.Category.ELECTRONICS,
                "49.99",
                "64.99",
                "Noise-cancelling wireless earbuds with 24h battery.",
                full_description="Premium wireless earbuds with active noise cancellation, 24-hour total battery life with case, and IPX5 water resistance. Includes three ear tip sizes and a compact charging case with USB-C. Perfect for commuting and travel.",
                discount_percent="15",
                sale_price="55.24",
                image="products/black headphone.jpg",
            ),
            _product(
                "USB-C Hub 7-in-1",
                Product.Category.ELECTRONICS,
                "32.00",
                "42.00",
                "HDMI, USB 3.0, SD card reader, power delivery.",
                full_description="Expand your laptop with HDMI 4K@60Hz, 3x USB 3.0 ports, SD/microSD card reader, and 100W USB-C power delivery pass-through. Aluminum body, plug-and-play. Compatible with MacBook, Windows, and Chromebook.",
                discount_percent=None,
                sale_price=None,
                image="products/grey mouse.jpg",
            ),
            _product(
                "Mechanical Keyboard",
                Product.Category.ELECTRONICS,
                "89.00",
                "109.00",
                "RGB backlit, Cherry MX-style switches.",
                full_description="Full-size mechanical keyboard with hot-swappable switches (Gateron-style), per-key RGB backlighting, and doubleshot PBT keycaps. N-key rollover, USB-C detachable cable. Available in linear, tactile, and clicky switch options.",
                discount_percent="10",
                sale_price="98.10",
                image="products/Electronics.jpg",
            ),
        ],
    },
    {
        "store_name": "Urban Fashion Co",
        "owner_email": "demo-fashion@example.com",
        "products": [
            _product(
                "Organic Cotton Tee",
                Product.Category.FASHION,
                "18.00",
                "26.00",
                "Unisex fit, multiple colors.",
                full_description="100% organic cotton crew neck tee. Unisex fit, pre-shrunk. Available in Black, White, Navy, Olive, and Heather Grey. Made in a certified sustainable facility. Machine wash cold, tumble dry low.",
                discount_percent="20",
                sale_price="20.80",
                image="products/red sneakers.jpg",
            ),
            _product(
                "Canvas Backpack",
                Product.Category.FASHION,
                "45.00",
                "59.00",
                "Laptop sleeve, water-resistant.",
                full_description="Durable canvas backpack with padded 15\" laptop sleeve, front organizer pocket, and side bottle pockets. Water-resistant coating. Adjustable straps and top carry handle. Dimensions: 18\" H x 12\" W x 6\" D.",
                discount_percent=None,
                sale_price=None,
                image="products/grey-green backpack.jpg",
            ),
            _product(
                "Minimalist Watch",
                Product.Category.FASHION,
                "65.00",
                "85.00",
                "Stainless steel, leather strap.",
                full_description="Quartz movement, stainless steel case (36mm), genuine leather strap. Mineral crystal, 3 ATM water resistance. Slim profile, suitable for everyday wear. Interchangeable strap design.",
                discount_percent="12",
                sale_price="74.80",
                image="products/black watch.jpg",
            ),
        ],
    },
    {
        "store_name": "Home & Living Demo",
        "owner_email": "demo-home@example.com",
        "products": [
            _product(
                "Desk Lamp LED",
                Product.Category.HOME,
                "28.00",
                "38.00",
                "Adjustable brightness, USB port.",
                full_description="LED desk lamp with 5 brightness levels and 3 color temperatures (warm, neutral, cool). Flexible gooseneck, built-in USB-A charging port. Energy-efficient, flicker-free. Base clamp or stand options.",
                discount_percent="15",
                sale_price="32.30",
                image="products/chair.jpg",
            ),
            _product(
                "Throw Blanket",
                Product.Category.HOME,
                "35.00",
                "48.00",
                "Soft fleece, machine washable.",
                full_description="Ultra-soft fleece throw blanket, 50\" x 60\". Machine washable, fade-resistant. Perfect for couch, bed, or travel. Available in Grey, Cream, Navy, and Burgundy.",
                discount_percent=None,
                sale_price=None,
                image="products/plant pot.jpg",
            ),
            _product(
                "Storage Baskets Set",
                Product.Category.HOME,
                "22.00",
                "32.00",
                "Set of 3, natural weave.",
                full_description="Set of 3 hand-woven storage baskets in natural fiber. Sizes: small (6\" H), medium (8\" H), large (10\" H). Use in bathroom, kitchen, nursery, or office. Lightweight and sturdy.",
                discount_percent="10",
                sale_price="28.80",
                image="products/plant pot.jpg",
            ),
        ],
    },
    {
        "store_name": "Outdoor Gear",
        "owner_email": "demo-outdoor@example.com",
        "products": [
            _product(
                "Camping Headlamp",
                Product.Category.SPORTS,
                "19.00",
                "27.00",
                "Waterproof, rechargeable.",
                full_description="IPX5 waterproof headlamp with 3 modes (high, low, red). Rechargeable via USB (included). Up to 40 hours on low. Adjustable head strap, tilting head. Weights 2.5 oz.",
                discount_percent="25",
                sale_price="20.25",
                image="products/green water bottle.jpg",
            ),
            _product(
                "Yoga Mat",
                Product.Category.SPORTS,
                "24.00",
                "34.00",
                "Non-slip, 6mm thick.",
                full_description="Extra-thick 6mm yoga mat with non-slip surface. NBR foam, latex-free. Size 72\" x 24\". Includes carrying strap. Ideal for yoga, pilates, and floor exercises. Easy to clean.",
                discount_percent=None,
                sale_price=None,
                image="products/green water bottle.jpg",
            ),
            _product(
                "Water Bottle 1L",
                Product.Category.SPORTS,
                "15.00",
                "22.00",
                "BPA-free, insulated.",
                full_description="Double-wall vacuum insulated 1L water bottle. Keeps cold 24h, hot 12h. BPA-free stainless steel. Leak-proof lid, fits most cup holders. Dishwasher safe (lid top rack).",
                discount_percent="18",
                sale_price="18.04",
                image="products/green water bottle.jpg",
            ),
        ],
    },
]


class Command(BaseCommand):
    help = "Load demo stores, sellers, and products for preview/debug (full item data for detail pages)."

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
            updated = 0
            for data in DEMO_STORES:
                store = Store.objects.filter(name=data["store_name"]).first()
                if not store:
                    continue
                for p in data["products"]:
                    if not p.get("image"):
                        continue
                    prod = Product.objects.filter(store=store, name=p["name"]).first()
                    if prod and not prod.image:
                        prod.image = p["image"]
                        prod.save(update_fields=["image"])
                        updated += 1
            if updated:
                self.stdout.write(self.style.SUCCESS(f"Backfilled images for {updated} existing products."))
            else:
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
                defaults = {
                    "category": p["category"],
                    "description": p.get("description", ""),
                    "full_description": p.get("full_description", "") or p.get("description", ""),
                    "base_price": Decimal(p["base"]),
                    "markup_price": Decimal(p["markup"]),
                    "is_active": True,
                    "image": p.get("image", ""),
                }
                if p.get("discount_percent") is not None:
                    defaults["discount_percent"] = Decimal(str(p["discount_percent"]))
                if p.get("sale_price") is not None:
                    defaults["sale_price"] = Decimal(str(p["sale_price"]))
                prod, p_created = Product.objects.get_or_create(
                    store=store_created,
                    name=p["name"],
                    defaults=defaults,
                )
                if p_created:
                    created_products += 1
                elif p.get("image") and not prod.image:
                    prod.image = p["image"]
                    prod.save(update_fields=["image"])

        self.stdout.write(
            self.style.SUCCESS(
                f"Demo data loaded: {created_users} users, {created_stores} stores, {created_products} products. "
                "Demo seller passwords: demo1234"
            )
        )
