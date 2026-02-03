from decimal import Decimal

from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required
from django.db.models import Sum
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.views.decorators.http import require_GET

from bonuses.models import BonusEvent
from tree.models import PairingCounter, TreeNode


@login_required
def dashboard_view(request):
    """
    High-level referral dashboard. Stats from tree and bonus_events only (subtree / user).
    """
    user = request.user
    try:
        node = user.tree_node
        total_referrals = TreeNode.objects.filter(parent=node).count()
    except TreeNode.DoesNotExist:
        total_referrals = 0
    counter, _ = PairingCounter.objects.get_or_create(
        user=user,
        defaults={"left_count": 0, "right_count": 0, "released_pairs": 0},
    )
    left_count, right_count = counter.left_count, counter.right_count

    bonus_qs = BonusEvent.objects.filter(user=user)
    direct = bonus_qs.filter(bonus_type=BonusEvent.BonusType.DIRECT).aggregate(s=Sum("amount"))["s"] or Decimal("0")
    hierarchy = bonus_qs.filter(bonus_type=BonusEvent.BonusType.HIERARCHY).aggregate(s=Sum("amount"))["s"] or Decimal("0")
    released = bonus_qs.filter(status=BonusEvent.Status.RELEASED).aggregate(s=Sum("amount"))["s"] or Decimal("0")
    pending = bonus_qs.filter(status=BonusEvent.Status.PENDING).aggregate(s=Sum("amount"))["s"] or Decimal("0")

    stats = {
        "total_referrals": total_referrals,
        "left_count": left_count,
        "right_count": right_count,
        "direct_bonus": f"{direct:.2f}",
        "hierarchy_bonus": f"{hierarchy:.2f}",
        "released_bonus": f"{released:.2f}",
        "pending_bonus": f"{pending:.2f}",
    }
    return render(request, "dashboard/dashboard.html", {"stats": stats})


@login_required
def tree_fragment(request):
    """
    HTMX fragment for the binary tree (own subtree). Lane counts from PairingCounter.
    """
    counter, _ = PairingCounter.objects.get_or_create(
        user=request.user,
        defaults={"left_count": 0, "right_count": 0, "released_pairs": 0},
    )
    lane = {
        "left": {"pending": counter.left_count},
        "right": {"pending": counter.right_count},
    }
    return render(request, "dashboard/_tree_fragment.html", {"lane": lane})


@login_required
def bonus_events_fragment(request):
    """
    HTMX fragment for the most recent bonus ledger events (user's bonus_events).
    """
    events = (
        BonusEvent.objects.filter(user=request.user)
        .select_related("order")
        .order_by("-created_at")[:20]
    )
    return render(request, "dashboard/_bonus_events_fragment.html", {"events": events})


@login_required
@require_GET
def tree_data_json(request):
    """
    JSON endpoint for the current user's subtree: nodes and edges for interactive graph.
    """
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
        {
            "id": n.id,
            "label": n.user.email or f"User {n.user_id}",
            "lane": n.lane,
            "depth": n.depth,
            "is_current_user": n.user_id == user.id,
        }
        for n in nodes_list
    ]
    edges = [{"from": n.parent_id, "to": n.id} for n in nodes_list if n.parent_id is not None]
    return JsonResponse({"nodes": nodes, "edges": edges})


def logout_view(request):
    """Log out and redirect to site login (isolated from admin)."""
    logout(request)
    return redirect("users:login")

