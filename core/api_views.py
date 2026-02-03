"""
REST API for the React SPA. Session-based auth (cookie); no JWT for simplicity.
"""
import json
from decimal import Decimal

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db.models import Q, Sum
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_http_methods

from bonuses.models import BonusEvent
from products.models import Product
from tree.models import PairingCounter, TreeNode
from users.models import User


def _product_list_item(p):
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
    }
    if p.discount_percent is not None:
        out["discount_percent"] = str(p.discount_percent)
    if p.sale_price is not None:
        out["sale_price"] = str(p.sale_price)
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
def api_products(request):
    qs = Product.objects.filter(is_active=True).select_related("store").order_by("-id")
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
    products = [_product_list_item(p) for p in qs]
    return JsonResponse({"products": products, "categories": list(Product.Category.choices)})


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
    payload = _product_list_item(p)
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
    return JsonResponse(payload)


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
