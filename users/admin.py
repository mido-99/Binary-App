from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("email", "referred_by", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("email",)
    ordering = ("-created_at",)
    readonly_fields = ("referred_by", "created_at")
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Referral (read-only)", {"fields": ("referred_by",)}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser")}),
        ("Important dates", {"fields": ("last_login", "created_at")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("email", "password1", "password2")}),
    )
