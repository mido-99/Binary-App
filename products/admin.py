from django.contrib import admin
from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "store", "category", "base_price", "markup_price", "is_active")
    list_filter = ("is_active", "category")
    search_fields = ("name", "store__name", "description")
    prepopulated_fields = {"slug": ("name",)}
