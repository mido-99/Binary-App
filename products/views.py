from django.db.models import Q
from django.shortcuts import render

from .models import Product


def storefront_home(request):
    """
    Store homepage: product grid with category filter, sort, and search.
    """
    qs = Product.objects.filter(is_active=True).select_related("store")

    category = request.GET.get("category", "").strip()
    if category and category in dict(Product.Category.choices):
        qs = qs.filter(category=category)

    search = request.GET.get("q", "").strip()
    if search:
        qs = qs.filter(
            Q(name__icontains=search) | Q(description__icontains=search)
        )

    sort = request.GET.get("sort", "newest")
    if sort == "price_asc":
        qs = qs.order_by("markup_price")
    elif sort == "price_desc":
        qs = qs.order_by("-markup_price")
    elif sort == "name":
        qs = qs.order_by("name")
    else:
        qs = qs.order_by("-id")

    return render(
        request,
        "storefront/home.html",
        {
            "products": qs,
            "categories": Product.Category.choices,
            "current_category": category,
            "current_sort": sort,
            "search_query": search,
        },
    )
