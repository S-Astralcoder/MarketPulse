import unittest
from fastapi.testclient import TestClient
from src.app import app


class DashboardTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_dashboard_served(self):
        response = self.client.get("/dashboard.html")
        self.assertEqual(response.status_code, 200)
        self.assertIn("Trending", response.text)
        self.assertIn("stock-card-template", response.text)
        self.assertIn('data-node-id="40:2"', response.text)

    def test_dashboard_css_served(self):
        response = self.client.get("/css/dashboard.css")
        self.assertEqual(response.status_code, 200)
        self.assertIn("tabular-nums", response.text)
        self.assertIn("JetBrains Mono", response.text)

    def test_dashboard_js_served(self):
        response = self.client.get("/js/dashboard.js")
        self.assertEqual(response.status_code, 200)
        self.assertIn("renderStockCardFromTemplate", response.text)
        self.assertIn("trackedTickers", response.text)

    def test_tracked_alerts_elements(self):
        response = self.client.get("/dashboard.html")
        self.assertEqual(response.status_code, 200)
        self.assertIn('id="alertsToggle"', response.text)
        self.assertIn('id="alertCount"', response.text)
        self.assertIn('id="cardContextMenu"', response.text)
        self.assertIn('id="contextTrackBtn"', response.text)
        self.assertIn('id="bookmarkedCardsGrid"', response.text)

    def test_landing_page_links_to_dashboard(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("/dashboard.html", response.text)


if __name__ == "__main__":
    unittest.main()
