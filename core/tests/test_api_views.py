"""Minimal API tests. Expand per TESTING.md."""
from django.test import TestCase, Client


class ApiStoresTest(TestCase):
    def test_stores_list_returns_200_and_stores_key(self):
        client = Client()
        resp = client.get("/api/stores/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("stores", data)
        self.assertIsInstance(data["stores"], list)


class ApiAuthMeTest(TestCase):
    def test_me_unauthorized_returns_401(self):
        client = Client()
        resp = client.get("/api/auth/me/")
        self.assertEqual(resp.status_code, 401)
        data = resp.json()
        self.assertIn("user", data)
