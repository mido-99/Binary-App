from django.contrib import admin
from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("id", "store", "base_price", "markup_price", "is_active")
    list_filter = ("is_active",)
    search_fields = ("store__name",)
