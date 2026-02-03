from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product", "quantity", "price_at_purchase")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "buyer", "total_price", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("buyer__email",)
    readonly_fields = ("created_at",)
    inlines = [OrderItemInline]
    ordering = ("-created_at",)
