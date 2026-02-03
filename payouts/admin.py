from django.contrib import admin
from .models import Payout


@admin.register(Payout)
class PayoutAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "amount", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("user__email",)
    readonly_fields = ("created_at",)
    ordering = ("-created_at",)
