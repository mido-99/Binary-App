from django.contrib import admin
from .models import BackgroundTask


@admin.register(BackgroundTask)
class BackgroundTaskAdmin(admin.ModelAdmin):
    list_display = ("id", "task_name", "related_object_id", "status", "created_at")
    list_filter = ("status", "task_name")
    search_fields = ("task_name", "related_object_id")
    readonly_fields = ("created_at",)
    ordering = ("-created_at",)
