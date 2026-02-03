from django.contrib import admin
from .models import BonusEvent


@admin.register(BonusEvent)
class BonusEventAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "order", "bonus_type", "amount", "lane", "depth", "status", "created_at")
    list_filter = ("bonus_type", "status", "lane")
    search_fields = ("user__email", "order__id")
    readonly_fields = ("user", "order", "bonus_type", "amount", "lane", "depth", "status", "created_at")
    ordering = ("-created_at",)
