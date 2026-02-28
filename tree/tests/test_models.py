"""Tests for tree models."""
from django.test import TestCase
from django.contrib.auth import get_user_model

from tree.models import TreeNode, PairingCounter

User = get_user_model()


class TreeNodeTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="root@test.example",
            email="root@test.example",
            password="testpass123",
        )

    def test_create_root_node(self):
        root = TreeNode.objects.create(
            user=self.user,
            parent=None,
            lane="L",
            depth=0,
        )
        self.assertIsNone(root.parent_id)
        self.assertEqual(root.lane, "L")
        self.assertEqual(root.depth, 0)
        self.assertEqual(root.user_id, self.user.id)

    def test_create_child_nodes(self):
        root = TreeNode.objects.create(
            user=self.user,
            parent=None,
            lane="L",
            depth=0,
        )
        child_l = TreeNode.objects.create(
            user=User.objects.create_user(username="l@test.example", email="l@test.example", password="x"),
            parent=root,
            lane="L",
            depth=1,
        )
        child_r = TreeNode.objects.create(
            user=User.objects.create_user(username="r@test.example", email="r@test.example", password="x"),
            parent=root,
            lane="R",
            depth=1,
        )
        self.assertEqual(child_l.parent_id, root.id)
        self.assertEqual(child_r.parent_id, root.id)
        self.assertEqual(list(root.children.order_by("lane").values_list("lane", flat=True)), ["L", "R"])


class PairingCounterTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="pair@test.example",
            email="pair@test.example",
            password="testpass123",
        )

    def test_get_or_create_defaults(self):
        counter, created = PairingCounter.objects.get_or_create(
            user=self.user,
            defaults={"left_count": 0, "right_count": 0, "released_pairs": 0},
        )
        self.assertTrue(created)
        self.assertEqual(counter.left_count, 0)
        self.assertEqual(counter.right_count, 0)
        self.assertEqual(counter.released_pairs, 0)
