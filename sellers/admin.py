from django.contrib import admin
from .models import Seller, Store


@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "seller_ref", "created_at")
    search_fields = ("name",)
    readonly_fields = ("created_at",)


@admin.register(Seller)
class SellerAdmin(admin.ModelAdmin):
    list_display = ("id", "owner", "store", "created_at")
    list_filter = ("created_at",)
    search_fields = ("owner__email",)
    readonly_fields = ("created_at",)
