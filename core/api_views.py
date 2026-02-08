"""
REST API for the React SPA. Session-based auth (cookie); no JWT for simplicity.
"""
import json
from decimal import Decimal
from urllib.parse import quote

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db.models import Q, Sum
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_http_methods, require_POST

from bonuses.models import BonusEvent
from orders.models import Order, OrderItem
from products.models import Product
from sellers.models import Seller, Store
from tree.models import PairingCounter, TreeNode
from users.models import User, ShippingAddress, Wishlist


def _product_list_item(p, request=None):
    """Shared payload for list and detail (list uses brief description)."""
    out = {
        "id": p.id,
        "name": p.name,
        "description": p.description or "",
        "category": p.category,
        "category_display": p.get_category_display(),
        "base_price": str(p.base_price),
        "markup_price": str(p.markup_price),
        "store_name": p.store.name,
        "store_id": p.store_id,
    }
    if p.discount_percent is not None:
        out["discount_percent"] = str(p.discount_percent)
    if p.sale_price is not None:
        out["sale_price"] = str(p.sale_price)
    if getattr(p, "image", None) and p.image:
        # Path under MEDIA_URL; quote so filenames with spaces work (e.g. "black headphone.jpg").
        media_path = (settings.MEDIA_URL.rstrip("/") + "/" + p.image.lstrip("/")).replace("//", "/")
        path_encoded = "/" + quote(media_path.lstrip("/"), safe="/")
        out["image_url"] = request.build_absolute_uri(path_encoded) if request else path_encoded
    seller_ref = getattr(getattr(p, "store", None), "seller_ref", None)
    if seller_ref and getattr(seller_ref, "owner_id", None):
        out["seller_id"] = seller_ref.owner_id
    return out


def _parse_json(request):
    try:
        return json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        return {}


@require_http_methods(["POST"])
def api_login(request):
    data = _parse_json(request)
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    if not email:
        return JsonResponse({"error": "Please enter your email."}, status=400)
    if not User.objects.filter(email__iexact=email).exists():
        return JsonResponse({"error": "No user found with this email. Sign up instead."}, status=400)
    user = authenticate(request, username=email, password=password)
    if user is None:
        return JsonResponse({"error": "Invalid password."}, status=400)
    if not user.is_active:
        return JsonResponse({"error": "This account is inactive."}, status=400)
    login(request, user)
    return JsonResponse({"user": {"email": user.email, "id": user.pk}})


@require_http_methods(["POST"])
def api_register(request):
    data = _parse_json(request)
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    password_confirm = data.get("password_confirm") or data.get("password_confirm") or ""
    if not email:
        return JsonResponse({"error": "Please enter your email."}, status=400)
    if User.objects.filter(email__iexact=email).exists():
        return JsonResponse({"error": "An account with this email already exists. Log in instead."}, status=400)
    if len(password) < 8:
        return JsonResponse({"error": "Password must be at least 8 characters."}, status=400)
    if password != password_confirm:
        return JsonResponse({"error": "Passwords do not match."}, status=400)
    user = User.objects.create_user(username=email, email=email, password=password)
    login(request, user)
    return JsonResponse({"user": {"email": user.email, "id": user.pk}})


@require_GET
@ensure_csrf_cookie
def api_me(request):
    if not request.user.is_authenticated:
        return JsonResponse({"user": None}, status=401)
    return JsonResponse({"user": {"email": request.user.email, "id": request.user.pk}})


@require_http_methods(["POST"])
@login_required
def api_logout(request):
    logout(request)
    return JsonResponse({}, status=204)


@require_GET
def api_stores(request):
    """List all stores with id and name for filters/navigation."""
    stores = Store.objects.all().order_by("name")
    return JsonResponse({
        "stores": [{"id": s.id, "name": s.name} for s in stores],
    })


@require_GET
def api_sellers(request):
    """List all sellers with id and email for filters/navigation."""
    sellers = Seller.objects.select_related("owner").all().order_by("owner__email")
    return JsonResponse({
        "sellers": [
            {"id": s.owner_id, "email": s.owner.email or f"Seller {s.id}"}
            for s in sellers
        ],
    })


@require_GET
def api_store_detail(request, store_id):
    """Store details for store profile page."""
    try:
        store = Store.objects.select_related("seller_ref", "seller_ref__owner").get(id=store_id)
    except Store.DoesNotExist:
        return JsonResponse({"error": "Store not found."}, status=404)
    product_count = Product.objects.filter(store=store, is_active=True).count()
    payload = {
        "id": store.id,
        "name": store.name,
        "description": store.description or "",
        "created_at": store.created_at.isoformat(),
        "product_count": product_count,
    }
    if store.seller_ref and store.seller_ref.owner_id:
        payload["seller"] = {"id": store.seller_ref.owner_id, "email": store.seller_ref.owner.email}
    else:
        payload["seller"] = None
    return JsonResponse(payload)


@require_GET
def api_store_products(request, store_id):
    """Products for a store (same query params as main products list)."""
    try:
        Store.objects.get(id=store_id)
    except Store.DoesNotExist:
        return JsonResponse({"error": "Store not found."}, status=404)
    qs = (
        Product.objects.filter(store_id=store_id, is_active=True)
        .select_related("store")
        .order_by("-id")
    )
    category = (request.GET.get("category") or "").strip()
    if category and category in dict(Product.Category.choices):
        qs = qs.filter(category=category)
    search = (request.GET.get("q") or "").strip()
    if search:
        qs = qs.filter(Q(name__icontains=search) | Q(description__icontains=search))
    sort = request.GET.get("sort", "newest")
    if sort == "price_asc":
        qs = qs.order_by("markup_price")
    elif sort == "price_desc":
        qs = qs.order_by("-markup_price")
    elif sort == "name":
        qs = qs.order_by("name")
    elif sort == "name_desc":
        qs = qs.order_by("-name")
    total_count = qs.count()
    page_size = min(100, max(1, int(request.GET.get("page_size", 24))))
    page = max(1, int(request.GET.get("page", 1)))
    offset = (page - 1) * page_size
    qs = qs[offset : offset + page_size]
    products = [_product_list_item(p, request) for p in qs]
    return JsonResponse({
        "products": products,
        "total_count": total_count,
        "page": page,
        "page_size": page_size,
    })


@require_GET
def api_seller_detail(request, seller_id):
    """Seller details for seller profile page."""
    try:
        seller = Seller.objects.select_related("owner").get(owner_id=seller_id)
    except Seller.DoesNotExist:
        return JsonResponse({"error": "Seller not found."}, status=404)
    store_count = Store.objects.filter(seller_ref=seller).count()
    product_count = Product.objects.filter(store__seller_ref=seller, is_active=True).count()
    return JsonResponse({
        "id": seller.owner_id,
        "email": seller.owner.email or f"Seller {seller.id}",
        "created_at": seller.created_at.isoformat(),
        "store_count": store_count,
        "product_count": product_count,
    })


@require_GET
def api_seller_stores(request, seller_id):
    """Stores owned by a seller."""
    try:
        seller = Seller.objects.get(owner_id=seller_id)
    except Seller.DoesNotExist:
        return JsonResponse({"error": "Seller not found."}, status=404)
    stores = Store.objects.filter(seller_ref=seller).order_by("name")
    return JsonResponse({
        "stores": [
            {
                "id": s.id,
                "name": s.name,
                "description": s.description or "",
                "product_count": Product.objects.filter(store=s, is_active=True).count(),
            }
            for s in stores
        ],
    })


def _effective_price(p):
    """Price used for display and filtering (sale_price if set, else markup_price)."""
    return p.sale_price if p.sale_price is not None else p.markup_price


@require_GET
def api_products(request):
    qs = (
        Product.objects.filter(is_active=True)
        .select_related("store", "store__seller_ref", "store__seller_ref__owner")
        .order_by("-id")
    )
    category = (request.GET.get("category") or "").strip()
    if category and category in dict(Product.Category.choices):
        qs = qs.filter(category=category)
    categories_param = request.GET.get("categories", "")
    if categories_param:
        cat_list = [c.strip() for c in categories_param.split(",") if c.strip() and c.strip() in dict(Product.Category.choices)]
        if cat_list:
            qs = qs.filter(category__in=cat_list)
    search = (request.GET.get("q") or "").strip()
    if search:
        qs = qs.filter(Q(name__icontains=search) | Q(description__icontains=search))
    min_price = request.GET.get("min_price")
    if min_price is not None and min_price != "":
        try:
            qs = qs.filter(markup_price__gte=float(min_price))
        except (TypeError, ValueError):
            pass
    max_price = request.GET.get("max_price")
    if max_price is not None and max_price != "":
        try:
            qs = qs.filter(markup_price__lte=float(max_price))
        except (TypeError, ValueError):
            pass
    stores_param = request.GET.get("stores", "")
    if stores_param:
        try:
            store_ids = [int(x.strip()) for x in stores_param.split(",") if x.strip()]
            if store_ids:
                qs = qs.filter(store_id__in=store_ids)
        except ValueError:
            pass
    sellers_param = request.GET.get("sellers", "")
    if sellers_param:
        try:
            seller_ids = [int(x.strip()) for x in sellers_param.split(",") if x.strip()]
            if seller_ids:
                qs = qs.filter(store__seller_ref__owner_id__in=seller_ids)
        except ValueError:
            pass
    on_sale = request.GET.get("on_sale", "").lower() in ("1", "true", "yes")
    if on_sale:
        qs = qs.filter(sale_price__isnull=False)
    sort = request.GET.get("sort", "newest")
    if sort == "price_asc":
        qs = qs.order_by("markup_price")
    elif sort == "price_desc":
        qs = qs.order_by("-markup_price")
    elif sort == "name":
        qs = qs.order_by("name")
    elif sort == "name_desc":
        qs = qs.order_by("-name")
    total_count = qs.count()
    page_size = min(100, max(1, int(request.GET.get("page_size", 24))))
    page = max(1, int(request.GET.get("page", 1)))
    offset = (page - 1) * page_size
    qs = qs[offset : offset + page_size]
    products = [_product_list_item(p, request) for p in qs]
    return JsonResponse({
        "products": products,
        "categories": list(Product.Category.choices),
        "total_count": total_count,
        "page": page,
        "page_size": page_size,
    })


def _get_cart(request):
    """Get cart from session: list of {product_id, quantity}."""
    if "cart" not in request.session:
        request.session["cart"] = []
    return request.session["cart"]


def _cart_item_payload(product_id, quantity, product, request=None):
    """Single cart item for API response (includes image_url, store_id, seller_id for preview and links)."""
    price = str(product.sale_price) if product.sale_price is not None else str(product.markup_price)
    product_payload = {
        "id": product.id,
        "name": product.name,
        "markup_price": str(product.markup_price),
        "sale_price": str(product.sale_price) if product.sale_price is not None else None,
        "store_name": product.store.name,
        "store_id": product.store_id,
    }
    if getattr(product, "image", None) and product.image:
        media_path = (settings.MEDIA_URL.rstrip("/") + "/" + product.image.lstrip("/")).replace("//", "/")
        path_encoded = "/" + quote(media_path.lstrip("/"), safe="/")
        product_payload["image_url"] = request.build_absolute_uri(path_encoded) if request else path_encoded
    seller_ref = getattr(product.store, "seller_ref", None)
    if seller_ref and getattr(seller_ref, "owner_id", None):
        product_payload["seller_id"] = seller_ref.owner_id
    return {
        "id": f"cart-{product_id}",
        "product_id": product_id,
        "product": product_payload,
        "quantity": quantity,
        "price": price,
    }


@require_GET
@ensure_csrf_cookie
def api_cart_list(request):
    """Return current cart with product details."""
    cart = _get_cart(request)
    if not cart:
        return JsonResponse({"items": [], "subtotal": "0.00", "item_count": 0})
    product_ids = [item["product_id"] for item in cart]
    products = {
        p.id: p
        for p in Product.objects.filter(id__in=product_ids, is_active=True).select_related("store", "store__seller_ref")
    }
    items = []
    subtotal = Decimal("0")
    for entry in cart:
        pid, qty = entry.get("product_id"), entry.get("quantity", 1)
        if pid not in products or qty < 1:
            continue
        p = products[pid]
        price = p.sale_price if p.sale_price is not None else p.markup_price
        items.append(_cart_item_payload(pid, qty, p, request))
        subtotal += price * qty
    return JsonResponse({
        "items": items,
        "subtotal": str(subtotal.quantize(Decimal("0.01"))),
        "item_count": sum(i["quantity"] for i in items),
    })


@require_http_methods(["POST"])
@ensure_csrf_cookie
def api_cart_add(request):
    """Add or merge item into cart. Body: product_id, quantity (optional, default 1)."""
    data = _parse_json(request)
    product_id = data.get("product_id")
    quantity = data.get("quantity", 1)
    if product_id is None:
        return JsonResponse({"error": "product_id required."}, status=400)
    try:
        product_id = int(product_id)
        quantity = max(1, int(quantity))
    except (TypeError, ValueError):
        return JsonResponse({"error": "Invalid product_id or quantity."}, status=400)
    if not Product.objects.filter(id=product_id, is_active=True).exists():
        return JsonResponse({"error": "Product not found."}, status=404)
    cart = _get_cart(request)
    for entry in cart:
        if entry.get("product_id") == product_id:
            entry["quantity"] = entry.get("quantity", 1) + quantity
            request.session.modified = True
            return JsonResponse({"ok": True})
    cart.append({"product_id": product_id, "quantity": quantity})
    request.session.modified = True
    return JsonResponse({"ok": True})


@require_http_methods(["POST"])
@ensure_csrf_cookie
def api_cart_update(request):
    """Set quantity for a product. Body: product_id, quantity."""
    data = _parse_json(request)
    product_id = data.get("product_id")
    quantity = data.get("quantity")
    if product_id is None:
        return JsonResponse({"error": "product_id required."}, status=400)
    try:
        product_id = int(product_id)
        quantity = int(quantity)
    except (TypeError, ValueError):
        return JsonResponse({"error": "Invalid product_id or quantity."}, status=400)
    cart = _get_cart(request)
    if quantity < 1:
        cart[:] = [e for e in cart if e.get("product_id") != product_id]
        request.session.modified = True
        return JsonResponse({"ok": True})
    for entry in cart:
        if entry.get("product_id") == product_id:
            entry["quantity"] = quantity
            request.session.modified = True
            return JsonResponse({"ok": True})
    cart.append({"product_id": product_id, "quantity": quantity})
    request.session.modified = True
    return JsonResponse({"ok": True})


@require_http_methods(["DELETE", "POST"])
@ensure_csrf_cookie
def api_cart_remove(request, product_id):
    """Remove one product from cart."""
    cart = _get_cart(request)
    cart[:] = [e for e in cart if e.get("product_id") != product_id]
    request.session.modified = True
    return JsonResponse({"ok": True})


@require_http_methods(["POST", "DELETE"])
@ensure_csrf_cookie
def api_cart_clear(request):
    """Clear cart."""
    request.session["cart"] = []
    request.session.modified = True
    return JsonResponse({"ok": True})


def _address_payload(addr):
    return {
        "id": addr.id,
        "full_name": addr.full_name,
        "address_line1": addr.address_line1,
        "address_line2": addr.address_line2 or "",
        "city": addr.city,
        "state": addr.state,
        "zip_code": addr.zip_code,
        "country": addr.country,
        "phone": addr.phone or "",
        "is_default": addr.is_default,
    }


@require_http_methods(["PATCH", "PUT"])
@login_required
@ensure_csrf_cookie
def api_user_update(request):
    """Update current user profile. Body: email (optional)."""
    data = _parse_json(request)
    user = request.user
    if "email" in data:
        email = (data.get("email") or "").strip().lower()
        if not email:
            return JsonResponse({"error": "Email cannot be empty."}, status=400)
        if User.objects.filter(email__iexact=email).exclude(pk=user.pk).exists():
            return JsonResponse({"error": "An account with this email already exists."}, status=400)
        user.email = email
        user.username = email
        user.save(update_fields=["email", "username"])
    return JsonResponse({"user": {"id": user.pk, "email": user.email}})


@require_http_methods(["POST"])
@login_required
@ensure_csrf_cookie
def api_change_password(request):
    """Change password. Body: current_password, new_password."""
    data = _parse_json(request)
    current = data.get("current_password") or ""
    new_pass = data.get("new_password") or ""
    if not current:
        return JsonResponse({"error": "Current password is required."}, status=400)
    if not new_pass or len(new_pass) < 8:
        return JsonResponse({"error": "New password must be at least 8 characters."}, status=400)
    user = request.user
    if not user.check_password(current):
        return JsonResponse({"error": "Current password is incorrect."}, status=400)
    user.set_password(new_pass)
    user.save(update_fields=["password"])
    return JsonResponse({"ok": True})


@require_GET
@login_required
@ensure_csrf_cookie
def api_address_list(request):
    """List current user's shipping addresses."""
    addrs = ShippingAddress.objects.filter(user=request.user).order_by("-is_default", "id")
    return JsonResponse({"addresses": [_address_payload(a) for a in addrs]})


@require_http_methods(["POST"])
@login_required
@ensure_csrf_cookie
def api_address_create(request):
    """Create a shipping address. Body: full_name, address_line1, address_line2?, city, state, zip_code, country, phone?, is_default?."""
    data = _parse_json(request)
    required = ["full_name", "address_line1", "city", "state", "zip_code", "country"]
    for k in required:
        if not data.get(k):
            return JsonResponse({"error": f"Missing or empty: {k}."}, status=400)
    if data.get("is_default"):
        ShippingAddress.objects.filter(user=request.user).update(is_default=False)
    addr = ShippingAddress.objects.create(
        user=request.user,
        full_name=data["full_name"].strip(),
        address_line1=data["address_line1"].strip(),
        address_line2=(data.get("address_line2") or "").strip(),
        city=data["city"].strip(),
        state=data["state"].strip(),
        zip_code=data["zip_code"].strip(),
        country=data["country"].strip(),
        phone=(data.get("phone") or "").strip(),
        is_default=bool(data.get("is_default")),
    )
    return JsonResponse(_address_payload(addr), status=201)


@require_http_methods(["PATCH", "PUT"])
@login_required
@ensure_csrf_cookie
def api_address_update(request, addr_id):
    """Update a shipping address."""
    try:
        addr = ShippingAddress.objects.get(id=addr_id, user=request.user)
    except ShippingAddress.DoesNotExist:
        return JsonResponse({"error": "Address not found."}, status=404)
    data = _parse_json(request)
    if data.get("is_default"):
        ShippingAddress.objects.filter(user=request.user).update(is_default=False)
    for field in ["full_name", "address_line1", "address_line2", "city", "state", "zip_code", "country", "phone"]:
        if field in data:
            setattr(addr, field, (data.get(field) or "").strip())
    if "is_default" in data:
        addr.is_default = bool(data["is_default"])
    addr.save()
    return JsonResponse(_address_payload(addr))


@require_http_methods(["DELETE", "POST"])
@login_required
@ensure_csrf_cookie
def api_address_delete(request, addr_id):
    """Delete a shipping address."""
    deleted, _ = ShippingAddress.objects.filter(id=addr_id, user=request.user).delete()
    if not deleted:
        return JsonResponse({"error": "Address not found."}, status=404)
    return JsonResponse({"ok": True})


@require_http_methods(["POST"])
@login_required
@ensure_csrf_cookie
def api_order_create(request):
    """Create order from cart. Body: shipping_address_id (or inline address), payment_method. Clears session cart."""
    data = _parse_json(request)
    cart = _get_cart(request)
    if not cart:
        return JsonResponse({"error": "Cart is empty."}, status=400)
    product_ids = [e["product_id"] for e in cart]
    products = {
        p.id: p
        for p in Product.objects.filter(id__in=product_ids, is_active=True).select_related("store")
    }
    total = Decimal("0")
    order_items_data = []
    for entry in cart:
        pid, qty = entry.get("product_id"), entry.get("quantity", 1)
        if pid not in products or qty < 1:
            continue
        p = products[pid]
        price = p.sale_price if p.sale_price is not None else p.markup_price
        total += price * qty
        order_items_data.append({"product": p, "quantity": qty, "price": price})
    if not order_items_data:
        return JsonResponse({"error": "No valid cart items."}, status=400)
    shipping_full_name = ""
    shipping_address_line1 = ""
    shipping_address_line2 = ""
    shipping_city = ""
    shipping_state = ""
    shipping_zip_code = ""
    shipping_country = ""
    shipping_phone = ""
    addr_id = data.get("shipping_address_id")
    if addr_id:
        try:
            addr = ShippingAddress.objects.get(id=addr_id, user=request.user)
            shipping_full_name = addr.full_name
            shipping_address_line1 = addr.address_line1
            shipping_address_line2 = addr.address_line2 or ""
            shipping_city = addr.city
            shipping_state = addr.state
            shipping_zip_code = addr.zip_code
            shipping_country = addr.country
            shipping_phone = addr.phone or ""
        except ShippingAddress.DoesNotExist:
            return JsonResponse({"error": "Address not found."}, status=400)
    else:
        for k in ["full_name", "address_line1", "city", "state", "zip_code", "country"]:
            if not data.get(k):
                return JsonResponse({"error": f"Missing shipping: {k}."}, status=400)
        shipping_full_name = data.get("full_name", "").strip()
        shipping_address_line1 = data.get("address_line1", "").strip()
        shipping_address_line2 = (data.get("address_line2") or "").strip()
        shipping_city = data.get("city", "").strip()
        shipping_state = data.get("state", "").strip()
        shipping_zip_code = data.get("zip_code", "").strip()
        shipping_country = data.get("country", "").strip()
        shipping_phone = (data.get("phone") or "").strip()
    payment_method = (data.get("payment_method") or "card").strip() or "card"
    order = Order.objects.create(
        buyer=request.user,
        total_price=total.quantize(Decimal("0.01")),
        status=Order.Status.PENDING,
        shipping_full_name=shipping_full_name,
        shipping_address_line1=shipping_address_line1,
        shipping_address_line2=shipping_address_line2,
        shipping_city=shipping_city,
        shipping_state=shipping_state,
        shipping_zip_code=shipping_zip_code,
        shipping_country=shipping_country,
        shipping_phone=shipping_phone,
        payment_method=payment_method,
    )
    for item in order_items_data:
        OrderItem.objects.create(
            order=order,
            product=item["product"],
            quantity=item["quantity"],
            price_at_purchase=item["price"],
        )
    request.session["cart"] = []
    request.session.modified = True
    return JsonResponse({
        "order_id": order.id,
        "order_number": str(order.id),
        "total": str(order.total_price),
    }, status=201)


def _order_list_item(order):
    """Summary for order list."""
    return {
        "id": order.id,
        "order_number": str(order.id),
        "total_price": str(order.total_price),
        "status": order.status,
        "created_at": order.created_at.isoformat(),
        "item_count": order.items.count(),
    }


@require_GET
@login_required
def api_orders_list(request):
    """List current user's orders with optional status filter and sort."""
    qs = Order.objects.filter(buyer=request.user).prefetch_related("items").order_by("-created_at")
    status_filter = (request.GET.get("status") or "").strip()
    if status_filter and status_filter in dict(Order.Status.choices):
        qs = qs.filter(status=status_filter)
    sort = request.GET.get("sort", "date_desc")
    if sort == "date_asc":
        qs = qs.order_by("created_at")
    total_count = qs.count()
    page_size = min(50, max(1, int(request.GET.get("page_size", 10))))
    page = max(1, int(request.GET.get("page", 1)))
    offset = (page - 1) * page_size
    qs = qs[offset : offset + page_size]
    orders = [_order_list_item(o) for o in qs]
    return JsonResponse({
        "orders": orders,
        "total_count": total_count,
        "page": page,
        "page_size": page_size,
    })


@require_http_methods(["GET", "POST"])
@login_required
@ensure_csrf_cookie
def api_orders(request):
    if request.method == "GET":
        return api_orders_list(request)
    return api_order_create(request)


@require_GET
@login_required
def api_order_detail(request, order_id):
    """Get single order with items and shipping."""
    try:
        order = Order.objects.get(id=order_id, buyer=request.user)
    except Order.DoesNotExist:
        return JsonResponse({"error": "Order not found."}, status=404)
    items = [
        {
            "id": oi.id,
            "product_id": oi.product_id,
            "product_name": oi.product.name,
            "quantity": oi.quantity,
            "price_at_purchase": str(oi.price_at_purchase),
        }
        for oi in order.items.select_related("product").all()
    ]
    return JsonResponse({
        "id": order.id,
        "order_number": str(order.id),
        "total_price": str(order.total_price),
        "status": order.status,
        "created_at": order.created_at.isoformat(),
        "shipping_full_name": order.shipping_full_name,
        "shipping_address_line1": order.shipping_address_line1,
        "shipping_address_line2": order.shipping_address_line2 or "",
        "shipping_city": order.shipping_city,
        "shipping_state": order.shipping_state,
        "shipping_zip_code": order.shipping_zip_code,
        "shipping_country": order.shipping_country,
        "shipping_phone": order.shipping_phone or "",
        "payment_method": order.payment_method or "",
        "items": items,
    })


@require_http_methods(["PATCH", "POST"])
@login_required
@ensure_csrf_cookie
def api_order_cancel(request, order_id):
    """Cancel an order (only if status is pending)."""
    try:
        order = Order.objects.get(id=order_id, buyer=request.user)
    except Order.DoesNotExist:
        return JsonResponse({"error": "Order not found."}, status=404)
    if order.status != Order.Status.PENDING:
        return JsonResponse({"error": "Only pending orders can be cancelled."}, status=400)
    order.status = Order.Status.CANCELLED
    order.save(update_fields=["status"])
    return JsonResponse({"ok": True, "status": order.status})


@require_GET
def api_product_detail(request, pk):
    """Full product for item detail page: description, prices, discounts, store, seller."""
    qs = (
        Product.objects.filter(pk=pk, is_active=True)
        .select_related("store", "store__seller_ref", "store__seller_ref__owner")
    )
    try:
        p = qs.get()
    except Product.DoesNotExist:
        return JsonResponse({"error": "Product not found."}, status=404)
    payload = _product_list_item(p, request)
    payload["full_description"] = p.full_description or p.description or ""
    seller = getattr(p.store, "seller_ref", None)
    payload["store"] = {
        "id": p.store.id,
        "name": p.store.name,
    }
    payload["seller"] = None
    if seller and getattr(seller, "owner", None):
        payload["seller"] = {
            "id": seller.owner_id,
            "email": seller.owner.email,
        }
    related = (
        Product.objects.filter(category=p.category, is_active=True)
        .exclude(pk=p.pk)
        .select_related("store")[:6]
    )
    payload["related_products"] = [_product_list_item(r, request) for r in related]
    return JsonResponse(payload)


@require_GET
def api_product_related(request, pk):
    """Related products (same category, exclude self)."""
    try:
        p = Product.objects.filter(pk=pk, is_active=True).values_list("category", flat=True).get()
    except Product.DoesNotExist:
        return JsonResponse({"error": "Product not found."}, status=404)
    related = (
        Product.objects.filter(category=p, is_active=True)
        .exclude(pk=pk)
        .select_related("store")[:6]
    )
    return JsonResponse({
        "products": [_product_list_item(r, request) for r in related],
    })


@require_GET
@login_required
def api_wishlist_list(request):
    """List current user's wishlist with product details."""
    items = (
        Wishlist.objects.filter(user=request.user)
        .select_related("product", "product__store", "product__store__seller_ref")
        .order_by("-created_at")
    )
    products = [_product_list_item(w.product, request) for w in items]
    return JsonResponse({"products": products})


@require_http_methods(["POST"])
@login_required
@ensure_csrf_cookie
def api_wishlist_add(request, product_id):
    """Add product to wishlist."""
    if not Product.objects.filter(id=product_id, is_active=True).exists():
        return JsonResponse({"error": "Product not found."}, status=404)
    Wishlist.objects.get_or_create(user=request.user, product_id=product_id)
    return JsonResponse({"ok": True})


@require_http_methods(["DELETE", "POST"])
@login_required
@ensure_csrf_cookie
def api_wishlist_remove(request, product_id):
    """Remove product from wishlist."""
    deleted, _ = Wishlist.objects.filter(user=request.user, product_id=product_id).delete()
    return JsonResponse({"ok": True, "removed": deleted})


@require_GET
@login_required
def api_dashboard(request):
    user = request.user
    try:
        node = user.tree_node
        total_referrals = TreeNode.objects.filter(parent=node).count()
    except TreeNode.DoesNotExist:
        total_referrals = 0
    counter, _ = PairingCounter.objects.get_or_create(
        user=user, defaults={"left_count": 0, "right_count": 0, "released_pairs": 0}
    )
    bonus_qs = BonusEvent.objects.filter(user=user)
    direct = bonus_qs.filter(bonus_type=BonusEvent.BonusType.DIRECT).aggregate(s=Sum("amount"))["s"] or Decimal("0")
    hierarchy = bonus_qs.filter(bonus_type=BonusEvent.BonusType.HIERARCHY).aggregate(s=Sum("amount"))["s"] or Decimal("0")
    released = bonus_qs.filter(status=BonusEvent.Status.RELEASED).aggregate(s=Sum("amount"))["s"] or Decimal("0")
    pending = bonus_qs.filter(status=BonusEvent.Status.PENDING).aggregate(s=Sum("amount"))["s"] or Decimal("0")
    return JsonResponse({
        "stats": {
            "total_referrals": total_referrals,
            "left_count": counter.left_count,
            "right_count": counter.right_count,
            "direct_bonus": f"{direct:.2f}",
            "hierarchy_bonus": f"{hierarchy:.2f}",
            "released_bonus": f"{released:.2f}",
            "pending_bonus": f"{pending:.2f}",
        }
    })


@require_GET
@login_required
def api_tree_data(request):
    user = request.user
    try:
        root = user.tree_node
    except TreeNode.DoesNotExist:
        return JsonResponse({"nodes": [], "edges": []})
    nodes_list = [root]
    stack = [root]
    while stack:
        n = stack.pop()
        for c in TreeNode.objects.filter(parent=n).select_related("user"):
            nodes_list.append(c)
            stack.append(c)
    nodes = [
        {"id": n.id, "label": n.user.email or f"User {n.user_id}", "lane": n.lane, "depth": n.depth, "is_current_user": n.user_id == user.id}
        for n in nodes_list
    ]
    edges = [{"from": n.parent_id, "to": n.id} for n in nodes_list if n.parent_id is not None]
    return JsonResponse({"nodes": nodes, "edges": edges})


@require_GET
@login_required
def api_bonus_events(request):
    events = (
        BonusEvent.objects.filter(user=request.user)
        .select_related("order")
        .order_by("-created_at")[:20]
    )
    list_ = [
        {
            "id": e.id,
            "bonus_type": e.bonus_type,
            "amount": str(e.amount),
            "status": e.status,
            "order_id": e.order_id,
            "depth": e.depth,
            "created_at": e.created_at.isoformat(),
        }
        for e in events
    ]
    return JsonResponse({"events": list_})
