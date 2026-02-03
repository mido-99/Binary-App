from django.conf import settings
from django.db import models


class TreeNode(models.Model):
    """
    Binary tree placement. parent and lane are immutable after insert.
    """
    class Lane(models.TextChoices):
        L = "L", "Left"
        R = "R", "Right"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tree_node",
        unique=True,
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children",
    )
    lane = models.CharField(max_length=1, choices=Lane.choices)
    depth = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "tree_nodes"
        constraints = [
            models.UniqueConstraint(
                fields=["parent", "lane"],
                name="tree_unique_parent_lane",
            ),
        ]
        indexes = [
            models.Index(fields=["parent"], name="idx_tree_parent"),
            models.Index(fields=["depth"], name="idx_tree_depth"),
        ]

    def __str__(self):
        return f"{self.user_id} @ {self.lane} depth={self.depth}"


class PairingCounter(models.Model):
    """
    Lane-based pairing state per user. Updated only in SERIALIZABLE transactions.
    released_pairs = min(left_count, right_count) at last release.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="pairing_counter",
        primary_key=True,
    )
    left_count = models.PositiveIntegerField(default=0)
    right_count = models.PositiveIntegerField(default=0)
    released_pairs = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "pairing_counters"

    def __str__(self):
        return f"user={self.user_id} L={self.left_count} R={self.right_count} pairs={self.released_pairs}"
