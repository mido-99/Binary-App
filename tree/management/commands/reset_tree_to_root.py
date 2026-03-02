from django.core.management.base import BaseCommand
from django.db import transaction

from tree.models import TreeNode, PairingCounter
from users.models import User


class Command(BaseCommand):
    help = "Remove all tree nodes except the root, so you can rebuild the binary tree manually."

    def add_arguments(self, parser):
        parser.add_argument(
            "--email",
            type=str,
            default=None,
            help="Email of the user that should remain as the root. If omitted, keeps the current root (parent is NULL).",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        email = (options.get("email") or "").strip().lower()

        root_node = None
        if email:
            try:
                user = User.objects.get(email__iexact=email)
            except User.DoesNotExist:
                self.stderr.write(self.style.ERROR(f"No user found with email {email!r}."))
                return
            try:
                root_node = user.tree_node
            except TreeNode.DoesNotExist:
                self.stderr.write(self.style.ERROR(f"User {email!r} is not in the tree."))
                return
        else:
            root_node = TreeNode.objects.filter(parent__isnull=True).first()
            if not root_node:
                self.stderr.write(self.style.ERROR("No root TreeNode found (parent IS NULL). Nothing to reset."))
                return

        # Delete all nodes except the chosen root node.
        deleted_nodes, _ = TreeNode.objects.exclude(id=root_node.id).delete()

        # Optionally clean up PairingCounter for users no longer in the tree.
        PairingCounter.objects.exclude(user_id=root_node.user_id).delete()

        self.stdout.write(
            self.style.SUCCESS(
                f"Reset complete. Kept root node id={root_node.id} for user={root_node.user.email}; "
                f"deleted {deleted_nodes} other tree nodes."
            )
        )

