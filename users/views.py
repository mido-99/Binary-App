from django.contrib.auth import authenticate, login
from django.shortcuts import redirect, render
from django.views.decorators.http import require_GET, require_http_methods

from .models import User


@require_http_methods(["GET", "POST"])
def login_view(request):
    """
    Site login (isolated from admin). If credentials not in DB: show "No user found, sign up instead."
    """
    if request.user.is_authenticated:
        return redirect("storefront:home")

    next_url = request.GET.get("next", "").strip() or request.POST.get("next", "").strip()
    if not next_url or not next_url.startswith("/"):
        next_url = "/"

    if request.method != "POST":
        return render(request, "auth/login.html", {"next": next_url})

    email = (request.POST.get("email") or "").strip().lower()
    password = request.POST.get("password") or ""

    if not email:
        return render(
            request,
            "auth/login.html",
            {"next": next_url, "error": "Please enter your email.", "email": email},
        )

    user_exists = User.objects.filter(email__iexact=email).exists()
    if not user_exists:
        return render(
            request,
            "auth/login.html",
            {
                "next": next_url,
                "error": "No user found with this email. Sign up instead.",
                "email": email,
            },
        )

    user = authenticate(request, username=email, password=password)
    if user is None:
        return render(
            request,
            "auth/login.html",
            {
                "next": next_url,
                "error": "Invalid password.",
                "email": email,
            },
        )

    if not user.is_active:
        return render(
            request,
            "auth/login.html",
            {"next": next_url, "error": "This account is inactive.", "email": email},
        )

    login(request, user)
    return redirect(next_url)


@require_http_methods(["GET", "POST"])
def signup_view(request):
    """
    Site signup. Creates user with email + password; later can add referral code / 3rd party.
    """
    if request.user.is_authenticated:
        return redirect("storefront:home")

    if request.method != "POST":
        return render(request, "auth/signup.html")

    email = (request.POST.get("email") or "").strip().lower()
    password = request.POST.get("password") or ""
    password_confirm = request.POST.get("password_confirm") or ""

    if not email:
        return render(
            request,
            "auth/signup.html",
            {"error": "Please enter your email.", "email": email},
        )

    if User.objects.filter(email__iexact=email).exists():
        return render(
            request,
            "auth/signup.html",
            {"error": "An account with this email already exists. Log in instead.", "email": email},
        )

    if not password or len(password) < 8:
        return render(
            request,
            "auth/signup.html",
            {"error": "Password must be at least 8 characters.", "email": email},
        )

    if password != password_confirm:
        return render(
            request,
            "auth/signup.html",
            {"error": "Passwords do not match.", "email": email},
        )

    user = User.objects.create_user(username=email, email=email, password=password)
    login(request, user)
    return redirect("storefront:home")
