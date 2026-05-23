"""
Tests for the /health and /health/ready endpoints.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.model import sentiment_model


@pytest.fixture
def client():
    """Create a test client without triggering the lifespan (model load)."""
    # We test with the model NOT loaded to verify readiness behavior
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c


class TestLiveness:
    """Tests for GET /health (liveness probe)."""

    def test_liveness_returns_ok(self, client):
        """Liveness probe should always return 200."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "ml-service"
        assert data["version"] == "1.0.0"

    def test_liveness_returns_correct_content_type(self, client):
        """Liveness endpoint should return JSON."""
        response = client.get("/health")
        assert "application/json" in response.headers["content-type"]


class TestReadiness:
    """Tests for GET /health/ready (readiness probe)."""

    def test_readiness_when_model_not_loaded(self, client):
        """Readiness should return 503 when model is not loaded."""
        # Ensure model is not loaded for this test
        sentiment_model.unload()
        response = client.get("/health/ready")
        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "not_ready"
        assert data["model_loaded"] is False

    def test_readiness_includes_uptime(self, client):
        """Readiness response should include uptime_seconds."""
        response = client.get("/health/ready")
        data = response.json()
        assert "uptime_seconds" in data
        assert isinstance(data["uptime_seconds"], (int, float))
        assert data["uptime_seconds"] >= 0
