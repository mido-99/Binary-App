"""
Seed the referral binary tree so the dashboard shows nodes.

- If no tree root exists: makes the given user (or first user) the root.
- Adds extra placeholder users as L/R children so the tree is visible.

Usage:
  python manage.py seed_referral_tree
  python manage.py seed_referral_tree --email your@email.com

Idempotent: does not duplicate nodes for users already in the tree.
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from tree.models import TreeNode, PairingCounter
from users.models import User


def ensure_user(email: str, password: str = "demo1234"):
    user, created = User.objects.get_or_create(
        email__iexact=email,
        defaults={"username": email, "is_active": True},
    )
    if created:
        user.email = email
        user.set_password(password)
        user.save(update_fields=["email"])
    return user


def ensure_tree_node(user: User, parent: TreeNode | None, lane: str, depth: int) -> TreeNode:
    node, created = TreeNode.objects.get_or_create(
        user=user,
        defaults={"parent": parent, "lane": lane, "depth": depth},
    )
    return node


def ensure_pairing_counter(user: User) -> PairingCounter:
    counter, _ = PairingCounter.objects.get_or_create(
        user=user,
        defaults={"left_count": 0, "right_count": 0, "released_pairs": 0},
    )
    return counter


class Command(BaseCommand):
    help = "Seed the referral tree with a root and placeholder users so the dashboard tree view works."

    def add_arguments(self, parser):
        parser.add_argument(
            "--email",
            type=str,
            default=None,
            help="Email of the user who should be the root (you). Default: first user in DB.",
        )
        parser.add_argument(
            "--password",
            type=str,
            default="demo1234",
            help="Password for any newly created placeholder users (default: demo1234).",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        email = (options.get("email") or "").strip().lower()
        password = options.get("password") or "demo1234"

        # Resolve root user: explicit email or first user, or create one
        if email:
            try:
                root_user = User.objects.get(email__iexact=email)
            except User.DoesNotExist:
                root_user = ensure_user(email, password)
                self.stdout.write(f"Using specified email as root: {root_user.email}")
        else:
            root_user = User.objects.order_by("id").first()
            if not root_user:
                root_user = ensure_user("root@example.com", password)
                self.stdout.write("No users in DB; created root@example.com as root (password: demo1234).")
            else:
                self.stdout.write(f"Using first user as root: {root_user.email}")

        # Ensure root has a tree node (only one node with parent=None in our seed)
        existing_root = TreeNode.objects.filter(parent__isnull=True).first()
        if existing_root:
            # Already have a root; ensure our chosen user is in the tree (as root or under it)
            try:
                root_node = root_user.tree_node
                self.stdout.write(self.style.SUCCESS(f"User {root_user.email} already in tree (node id={root_node.id})."))
            except TreeNode.DoesNotExist:
                # Root exists but is another user; add our user as a child of that root
                # Prefer right lane if free
                for lane in ("R", "L"):
                    if not TreeNode.objects.filter(parent=existing_root, lane=lane).exists():
                        root_node = ensure_tree_node(root_user, existing_root, lane, existing_root.depth + 1)
                        ensure_pairing_counter(root_user)
                        self.stdout.write(self.style.SUCCESS(f"Added {root_user.email} to tree under existing root (lane={lane})."))
                        break
                else:
                    self.stdout.write(self.style.WARNING("Existing root has both L and R children; no new root added."))
                    return
        else:
            root_node = ensure_tree_node(root_user, None, "L", 0)
            ensure_pairing_counter(root_user)
            self.stdout.write(self.style.SUCCESS(f"Created root node for {root_user.email}."))

        # Placeholder users to fill L and R under root so the tree is visible
        placeholders = [
            ("tree-left@example.com", "L"),
            ("tree-right@example.com", "R"),
        ]
        for child_email, lane in placeholders:
            if TreeNode.objects.filter(parent=root_node, lane=lane).exists():
                continue
            child_user = ensure_user(child_email, password)
            ensure_tree_node(child_user, root_node, lane, root_node.depth + 1)
            ensure_pairing_counter(child_user)
            self.stdout.write(f"  Added {child_email} under root (lane={lane}).")

        # Second level: 2 under left, 2 under right
        left_child = TreeNode.objects.filter(parent=root_node, lane="L").first()
        right_child = TreeNode.objects.filter(parent=root_node, lane="R").first()
        second_level: list[tuple[str, TreeNode, str]] = []
        if left_child:
            for lane, addr in [("L", "tree-ll@example.com"), ("R", "tree-lr@example.com")]:
                if not TreeNode.objects.filter(parent=left_child, lane=lane).exists():
                    second_level.append((addr, left_child, lane))
        if right_child:
            for lane, addr in [("L", "tree-rl@example.com"), ("R", "tree-rr@example.com")]:
                if not TreeNode.objects.filter(parent=right_child, lane=lane).exists():
                    second_level.append((addr, right_child, lane))

        for child_email, parent_node, lane in second_level:
            child_user = ensure_user(child_email, password)
            ensure_tree_node(child_user, parent_node, lane, parent_node.depth + 1)
            ensure_pairing_counter(child_user)
            self.stdout.write(f"  Added {child_email} (depth={parent_node.depth + 1}, lane={lane}).")

        # Levels 3–5: recursively add children under every node at depth 2 (then their descendants)
        def add_children_under(parent: TreeNode, prefix: str, max_depth: int) -> None:
            depth = parent.depth + 1
            if depth > max_depth:
                return
            for lane, suffix in [("L", "l"), ("R", "r")]:
                if TreeNode.objects.filter(parent=parent, lane=lane).exists():
                    continue
                child_email = f"tree-{prefix}{suffix}@example.com"
                child_user = ensure_user(child_email, password)
                ensure_tree_node(child_user, parent, lane, depth)
                ensure_pairing_counter(child_user)
                self.stdout.write(f"  Added {child_email} (depth={depth}, lane={lane}).")
                child_node = child_user.tree_node
                add_children_under(child_node, prefix + suffix, max_depth)

        # All nodes at depth 2 (under root's L and R children)
        depth_2_nodes = list(TreeNode.objects.filter(depth=2).select_related("user"))
        for child_tn in depth_2_nodes:
            prefix = child_tn.user.email.split("@")[0].replace("tree-", "") if child_tn.user else "xx"
            add_children_under(child_tn, prefix, 5)

        # Update PairingCounter so "below" counts can be non-zero for demo (optional)
        try:
            root_counter = root_user.pairing_counter
            if root_counter.left_count == 0 and root_counter.right_count == 0:
                root_counter.left_count = TreeNode.objects.filter(parent=root_node, lane="L").count() or 1
                root_counter.right_count = TreeNode.objects.filter(parent=root_node, lane="R").count() or 1
                root_counter.save(update_fields=["left_count", "right_count"])
                self.stdout.write("  Updated root pairing counts for display.")
        except PairingCounter.DoesNotExist:
            pass

        self.stdout.write(self.style.SUCCESS("Seed complete. Log in as the root user and open the dashboard to see the tree."))
