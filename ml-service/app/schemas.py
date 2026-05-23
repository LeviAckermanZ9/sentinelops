"""
SentinelOps ML Service — Pydantic Schemas

Request/response models for the sentiment analysis API.
"""

from pydantic import BaseModel, Field
from typing import List, Optional


# ---------------------------------------------------------------------------
# Prediction
# ---------------------------------------------------------------------------

class PredictRequest(BaseModel):
    """Single text prediction request."""
    text: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="Text to analyze for sentiment",
        examples=["This movie was absolutely fantastic!"],
    )


class PredictResponse(BaseModel):
    """Single text prediction response."""
    text: str = Field(description="Original input text")
    label: str = Field(description="Predicted sentiment label (POSITIVE / NEGATIVE)")
    score: float = Field(description="Confidence score (0.0 to 1.0)")
    inference_time_ms: float = Field(description="Inference time in milliseconds")
    model_version: str = Field(description="Model identifier")


class BatchPredictRequest(BaseModel):
    """Batch prediction request (up to 32 texts)."""
    texts: List[str] = Field(
        ...,
        min_length=1,
        max_length=32,
        description="List of texts to analyze (max 32)",
    )


class BatchPredictResponse(BaseModel):
    """Batch prediction response."""
    predictions: List[PredictResponse]
    total_inference_time_ms: float = Field(description="Total inference time for the batch")
    count: int = Field(description="Number of predictions returned")


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    """Liveness health check response."""
    status: str = Field(default="ok", description="Service status")
    service: str = Field(default="ml-service", description="Service name")
    version: str = Field(default="1.0.0", description="Service version")


class ReadinessResponse(BaseModel):
    """Readiness health check response (includes model status)."""
    status: str = Field(description="Service status (ready / not_ready)")
    model_loaded: bool = Field(description="Whether the ML model is loaded")
    model_name: Optional[str] = Field(default=None, description="Loaded model name")
    uptime_seconds: float = Field(description="Service uptime in seconds")


# ---------------------------------------------------------------------------
# Model Info
# ---------------------------------------------------------------------------

class ModelInfoResponse(BaseModel):
    """Model metadata response."""
    model_name: str = Field(description="HuggingFace model identifier")
    model_loaded: bool = Field(description="Whether the model is currently loaded")
    load_time_seconds: Optional[float] = Field(default=None, description="Time taken to load the model")
    supported_labels: List[str] = Field(description="Possible prediction labels")


# ---------------------------------------------------------------------------
# Errors
# ---------------------------------------------------------------------------

class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str = Field(description="Error type")
    message: str = Field(description="Human-readable error message")
    detail: Optional[str] = Field(default=None, description="Additional error details")
