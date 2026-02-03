from django.contrib.auth.decorators import login_required
from django.shortcuts import render


@login_required
def dashboard_view(request):
    """
    High-level referral dashboard shell.
    Backend will later supply real stats based on MDC rules.
    """
    # Placeholder stats; will be wired to real aggregates later.
    stats = {
        "total_referrals": 0,
        "left_count": 0,
        "right_count": 0,
        "direct_bonus": "0.00",
        "hierarchy_bonus": "0.00",
        "released_bonus": "0.00",
        "pending_bonus": "0.00",
    }
    return render(request, "dashboard/dashboard.html", {"stats": stats})


@login_required
def tree_fragment(request):
    """
    HTMX fragment for the binary tree.
    Initially a visual shell only.
    """
    lane = {
        "left": {"pending": 0},
        "right": {"pending": 0},
    }
    return render(request, "dashboard/_tree_fragment.html", {"lane": lane})


@login_required
def bonus_events_fragment(request):
    """
    HTMX fragment for the most recent bonus ledger events.
    Initially empty; will be backed by bonuses app.
    """
    events = []
    return render(request, "dashboard/_bonus_events_fragment.html", {"events": events})

