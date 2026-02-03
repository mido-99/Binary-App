from django.db import models


class BackgroundTask(models.Model):
    """Optional audit table for Celery task runs."""
    task_name = models.CharField(max_length=255)
    related_object_id = models.CharField(max_length=64, null=True, blank=True)
    status = models.CharField(max_length=64, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "background_tasks"

    def __str__(self):
        return f"{self.task_name} #{self.pk} {self.status}"
