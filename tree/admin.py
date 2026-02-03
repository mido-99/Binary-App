from django.contrib import admin

from .models import PairingCounter, TreeNode


@admin.register(TreeNode)
class TreeNodeAdmin(admin.ModelAdmin):
    list_display = ("user", "parent", "lane", "depth", "created_at")
    list_filter = ("lane", "depth")
    search_fields = ("user__email",)
    readonly_fields = ("user", "parent", "lane", "depth", "created_at")
    ordering = ("-created_at",)


@admin.register(PairingCounter)
class PairingCounterAdmin(admin.ModelAdmin):
    list_display = ("user", "left_count", "right_count", "released_pairs", "updated_at")
    search_fields = ("user__email",)
    readonly_fields = ("user", "left_count", "right_count", "released_pairs", "updated_at")
