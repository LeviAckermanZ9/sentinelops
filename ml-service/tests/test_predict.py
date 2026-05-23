"""
Tests for the prediction endpoints.

These tests mock the ML model to avoid downloading the actual
DistilBERT model during CI/CD runs. Integration tests with the
real model should be run separately (e.g., in docker-compose.test.yml).
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.model import sentiment_model


@pytest.fixture
def client():
    """Create a test client."""
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c


@pytest.fixture
def mock_model_loaded():
    """Mock the sentiment model as loaded with predictable outputs."""
    with patch.object(sentiment_model, "_pipeline") as mock_pipeline:
        # Make is_loaded return True
        mock_pipeline.__bool__ = lambda self: True
        type(sentiment_model)._pipeline = property(lambda self: mock_pipeline)

        # Mock single prediction
        mock_pipeline.return_value = [{"label": "POSITIVE", "score": 0.9998}]
        mock_pipeline.__call__ = MagicMock(
            return_value=[{"label": "POSITIVE", "score": 0.9998}]
        )

        # Patch is_loaded and predict directly
        with patch.object(
            type(sentiment_model), "is_loaded", new_callable=lambda: property(lambda self: True)
        ):
            with patch.object(
                sentiment_model,
                "predict",
                return_value={
                    "label": "POSITIVE",
                    "score": 0.9998,
                    "inference_time_ms": 15.42,
                },
            ):
                with patch.object(
                    sentiment_model,
                    "predict_batch",
                    return_value=[
                        {"label": "POSITIVE", "score": 0.9998, "inference_time_ms": 12.5},
                        {"label": "NEGATIVE", "score": 0.9876, "inference_time_ms": 12.5},
                    ],
                ):
                    yield


class TestSinglePrediction:
    """Tests for POST /predict."""

    def test_predict_success(self, client, mock_model_loaded):
        """Prediction should return label and score for valid text."""
        response = client.post(
            "/predict",
            json={"text": "This movie was absolutely fantastic!"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["label"] == "POSITIVE"
        assert data["score"] == 0.9998
        assert data["text"] == "This movie was absolutely fantastic!"
        assert "inference_time_ms" in data
        assert "model_version" in data

    def test_predict_empty_text_rejected(self, client, mock_model_loaded):
        """Empty text should be rejected with 422."""
        response = client.post("/predict", json={"text": ""})
        assert response.status_code == 422

    def test_predict_missing_text_field(self, client, mock_model_loaded):
        """Request without text field should be rejected with 422."""
        response = client.post("/predict", json={})
        assert response.status_code == 422

    def test_predict_model_not_loaded(self, client):
        """Should return 503 when model is not loaded."""
        sentiment_model.unload()
        response = client.post(
            "/predict",
            json={"text": "Test text"},
        )
        assert response.status_code == 503

    def test_predict_returns_correct_content_type(self, client, mock_model_loaded):
        """Prediction endpoint should return JSON."""
        response = client.post(
            "/predict",
            json={"text": "Test text"},
        )
        assert "application/json" in response.headers["content-type"]


class TestBatchPrediction:
    """Tests for POST /predict/batch."""

    def test_batch_predict_success(self, client, mock_model_loaded):
        """Batch prediction should handle multiple texts."""
        response = client.post(
            "/predict/batch",
            json={"texts": ["Great movie!", "Terrible experience."]},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 2
        assert len(data["predictions"]) == 2
        assert "total_inference_time_ms" in data

    def test_batch_predict_empty_list_rejected(self, client, mock_model_loaded):
        """Empty text list should be rejected with 422."""
        response = client.post("/predict/batch", json={"texts": []})
        assert response.status_code == 422

    def test_batch_predict_model_not_loaded(self, client):
        """Should return 503 when model is not loaded."""
        sentiment_model.unload()
        response = client.post(
            "/predict/batch",
            json={"texts": ["Test text"]},
        )
        assert response.status_code == 503


class TestModelInfo:
    """Tests for GET /model/info."""

    def test_model_info_returns_metadata(self, client):
        """Model info should return model name and supported labels."""
        response = client.get("/model/info")
        assert response.status_code == 200
        data = response.json()
        assert "model_name" in data
        assert "model_loaded" in data
        assert "supported_labels" in data
        assert "POSITIVE" in data["supported_labels"]
        assert "NEGATIVE" in data["supported_labels"]
