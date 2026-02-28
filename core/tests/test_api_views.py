"""API tests for core.api_views. See TESTING.md for full plan."""
import json
from unittest.mock import patch

from django.test import TestCase, Client
from django.contrib.auth import get_user_model

from tree.models import TreeNode, PairingCounter

User = get_user_model()


def _post_json(client, path, data):
    return client.post(path, data=json.dumps(data), content_type="application/json")


class ApiStoresTest(TestCase):
    def test_stores_list_returns_200_and_stores_key(self):
        client = Client()
        resp = client.get("/api/stores/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("stores", data)
        self.assertIsInstance(data["stores"], list)


def create_user(email, password="testpass123", **kwargs):
    return User.objects.create_user(username=email, email=email, password=password, **kwargs)


class ApiAuthTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = create_user("auth@test.example")

    def test_me_unauthorized_returns_401(self):
        resp = self.client.get("/api/auth/me/")
        self.assertEqual(resp.status_code, 401)
        data = resp.json()
        self.assertIn("user", data)

    def test_me_authenticated_returns_user(self):
        self.client.force_login(self.user)
        resp = self.client.get("/api/auth/me/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["user"]["email"], self.user.email)
        self.assertEqual(data["user"]["id"], self.user.pk)

    def test_login_success(self):
        resp = _post_json(
            self.client,
            "/api/auth/login/",
            {"email": "auth@test.example", "password": "testpass123"},
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["user"]["email"], "auth@test.example")
        self.assertEqual(data["user"]["id"], self.user.pk)

    def test_login_missing_email_returns_400(self):
        resp = _post_json(self.client, "/api/auth/login/", {"password": "testpass123"})
        self.assertEqual(resp.status_code, 400)
        self.assertIn("error", resp.json())

    def test_login_unknown_email_returns_400(self):
        resp = _post_json(
            self.client,
            "/api/auth/login/",
            {"email": "unknown@test.example", "password": "testpass123"},
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("error", resp.json())

    def test_login_wrong_password_returns_400(self):
        resp = _post_json(
            self.client,
            "/api/auth/login/",
            {"email": "auth@test.example", "password": "wrong"},
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("error", resp.json())

    def test_register_success(self):
        resp = _post_json(
            self.client,
            "/api/auth/register/",
            {
                "email": "new@test.example",
                "password": "newpass123",
                "password_confirm": "newpass123",
            },
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["user"]["email"], "new@test.example")
        self.assertTrue(User.objects.filter(email="new@test.example").exists())

    def test_register_duplicate_email_returns_400(self):
        resp = _post_json(
            self.client,
            "/api/auth/register/",
            {
                "email": "auth@test.example",
                "password": "newpass123",
                "password_confirm": "newpass123",
            },
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("error", resp.json())

    def test_register_short_password_returns_400(self):
        resp = _post_json(
            self.client,
            "/api/auth/register/",
            {
                "email": "other@test.example",
                "password": "short",
                "password_confirm": "short",
            },
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("error", resp.json())

    def test_register_password_mismatch_returns_400(self):
        resp = _post_json(
            self.client,
            "/api/auth/register/",
            {
                "email": "other@test.example",
                "password": "validpass123",
                "password_confirm": "otherpass123",
            },
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("error", resp.json())

    def test_logout_returns_204(self):
        self.client.force_login(self.user)
        resp = self.client.post("/api/auth/logout/")
        self.assertEqual(resp.status_code, 204)


class ApiDashboardTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = create_user("dashboard@test.example")

    def test_dashboard_requires_auth(self):
        resp = self.client.get("/api/dashboard/")
        self.assertEqual(resp.status_code, 302)

    def test_dashboard_returns_stats_when_no_tree_node(self):
        self.client.force_login(self.user)
        resp = self.client.get("/api/dashboard/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("stats", data)
        stats = data["stats"]
        self.assertIn("total_referrals", stats)
        self.assertIn("left_count", stats)
        self.assertIn("right_count", stats)
        self.assertIn("direct_bonus", stats)
        self.assertIn("released_bonus", stats)
        self.assertIn("pending_bonus", stats)

    def test_dashboard_returns_stats_with_tree_node(self):
        self.client.force_login(self.user)
        root = TreeNode.objects.create(
            user=self.user,
            parent=None,
            lane="L",
            depth=0,
        )
        PairingCounter.objects.get_or_create(
            user=self.user,
            defaults={"left_count": 0, "right_count": 0, "released_pairs": 0},
        )
        resp = self.client.get("/api/dashboard/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["stats"]["total_referrals"], "0")


class ApiTreeDataTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = create_user("tree@test.example")

    def test_tree_requires_auth(self):
        resp = self.client.get("/api/dashboard/tree/")
        self.assertEqual(resp.status_code, 302)

    def test_tree_empty_when_user_has_no_tree_node(self):
        self.client.force_login(self.user)
        resp = self.client.get("/api/dashboard/tree/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["nodes"], [])
        self.assertEqual(data["edges"], [])

    def test_tree_returns_nodes_and_edges_with_root(self):
        self.client.force_login(self.user)
        root = TreeNode.objects.create(
            user=self.user,
            parent=None,
            lane="L",
            depth=0,
        )
        resp = self.client.get("/api/dashboard/tree/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(len(data["nodes"]), 1)
        self.assertEqual(data["nodes"][0]["id"], root.id)
        self.assertEqual(data["nodes"][0]["lane"], "L")
        self.assertEqual(data["nodes"][0]["side"], "L")
        self.assertIn("left_users_below", data["nodes"][0])
        self.assertIn("right_users_below", data["nodes"][0])
        self.assertEqual(data["edges"], [])


class ApiBonusEventsTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = create_user("bonus@test.example")

    def test_bonus_events_requires_auth(self):
        resp = self.client.get("/api/dashboard/bonus-events/")
        self.assertEqual(resp.status_code, 302)

    def test_bonus_events_returns_pagination_shape(self):
        self.client.force_login(self.user)
        resp = self.client.get("/api/dashboard/bonus-events/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("events", data)
        self.assertIn("total_count", data)
        self.assertIn("page", data)
        self.assertIn("page_size", data)
        self.assertIsInstance(data["events"], list)

    def test_bonus_events_page_param(self):
        self.client.force_login(self.user)
        resp = self.client.get("/api/dashboard/bonus-events/?page=2&page_size=10")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["page"], 2)
        self.assertEqual(data["page_size"], 10)


class ApiDashboardRecomputeTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = create_user("recompute@test.example")

    def test_recompute_requires_auth(self):
        resp = self.client.post("/api/dashboard/recompute/")
        self.assertEqual(resp.status_code, 302)

    @patch("core.api_views.release_pairs_for_user")
    def test_recompute_returns_ok_when_authenticated(self, mock_release):
        mock_release.delay.return_value = None
        self.client.force_login(self.user)
        self.client.get("/api/auth/me/")
        resp = self.client.post("/api/dashboard/recompute/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data.get("ok"))
        self.assertIn("message", data)
        mock_release.delay.assert_called_once_with(self.user.id)
