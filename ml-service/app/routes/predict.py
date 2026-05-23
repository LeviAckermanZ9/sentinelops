"""
SentinelOps ML Service — Prediction Routes

Endpoints for single and batch sentiment analysis inference.

    - POST /predict       → Single text prediction
    - POST /predict/batch → Batch prediction (up to 32 texts)
    - GET  /model/info    → Model metadata

All prediction endpoints use sync `def` (not `async def`) because
inference is CPU-bound. FastAPI runs sync endpoints in a threadpool,
preventing the async event loop from being blocked.
"""

import logging

from fastapi import APIRouter, HTTPException

from app.model import sentiment_model
from app.schemas import (
    PredictRequest,
    PredictResponse,
    BatchPredictRequest,
    BatchPredictResponse,
    ModelInfoResponse,
    ErrorResponse,
)
from app.metrics import (
    PREDICTION_REQUESTS,
    PREDICTION_LATENCY,
    PREDICTION_ERRORS,
    ACTIVE_PREDICTIONS,
    PREDICTION_LABELS,
)

logger = logging.getLogger("sentinelops.predict")

router = APIRouter(tags=["Prediction"])


# ---------------------------------------------------------------------------
# POST /predict — Single text inference
# ---------------------------------------------------------------------------
@router.post(
    "/predict",
    response_model=PredictResponse,
    responses={
        503: {"model": ErrorResponse, "description": "Model not loaded"},
        500: {"model": ErrorResponse, "description": "Inference error"},
    },
    summary="Analyze sentiment of a single text",
    description="Runs sentiment analysis on the provided text and returns the predicted label (POSITIVE/NEGATIVE) with a confidence score.",
)
def predict(request: PredictRequest):
    """Run sentiment inference on a single text."""
    if not sentiment_model.is_loaded:
        PREDICTION_REQUESTS.labels(endpoint="/predict", status="error").inc()
        PREDICTION_ERRORS.labels(error_type="model_not_loaded").inc()
        raise HTTPException(
            status_code=503,
            detail="Model is not loaded yet. Please try again shortly.",
        )

    ACTIVE_PREDICTIONS.inc()
    try:
        with PREDICTION_LATENCY.labels(endpoint="/predict").time():
            result = sentiment_model.predict(request.text)

        PREDICTION_REQUESTS.labels(endpoint="/predict", status="success").inc()
        PREDICTION_LABELS.labels(label=result["label"]).inc()

        return PredictResponse(
            text=request.text,
            label=result["label"],
            score=result["score"],
            inference_time_ms=result["inference_time_ms"],
            model_version=sentiment_model.model_name,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Prediction failed: %s", str(e), exc_info=True)
        PREDICTION_REQUESTS.labels(endpoint="/predict", status="error").inc()
        PREDICTION_ERRORS.labels(error_type="inference_error").inc()
        raise HTTPException(
            status_code=500,
            detail=f"Inference failed: {str(e)}",
        )
    finally:
        ACTIVE_PREDICTIONS.dec()


# ---------------------------------------------------------------------------
# POST /predict/batch — Batch inference
# ---------------------------------------------------------------------------
@router.post(
    "/predict/batch",
    response_model=BatchPredictResponse,
    responses={
        503: {"model": ErrorResponse, "description": "Model not loaded"},
        500: {"model": ErrorResponse, "description": "Inference error"},
    },
    summary="Analyze sentiment of multiple texts",
    description="Runs sentiment analysis on up to 32 texts in a single request. More efficient than calling /predict repeatedly.",
)
def predict_batch(request: BatchPredictRequest):
    """Run sentiment inference on a batch of texts."""
    if not sentiment_model.is_loaded:
        PREDICTION_REQUESTS.labels(endpoint="/predict/batch", status="error").inc()
        PREDICTION_ERRORS.labels(error_type="model_not_loaded").inc()
        raise HTTPException(
            status_code=503,
            detail="Model is not loaded yet. Please try again shortly.",
        )

    ACTIVE_PREDICTIONS.inc()
    try:
        with PREDICTION_LATENCY.labels(endpoint="/predict/batch").time():
            results = sentiment_model.predict_batch(request.texts)

        total_ms = sum(r["inference_time_ms"] for r in results)

        predictions = []
        for text, result in zip(request.texts, results):
            PREDICTION_LABELS.labels(label=result["label"]).inc()
            predictions.append(
                PredictResponse(
                    text=text,
                    label=result["label"],
                    score=result["score"],
                    inference_time_ms=result["inference_time_ms"],
                    model_version=sentiment_model.model_name,
                )
            )

        PREDICTION_REQUESTS.labels(endpoint="/predict/batch", status="success").inc()

        return BatchPredictResponse(
            predictions=predictions,
            total_inference_time_ms=total_ms,
            count=len(predictions),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Batch prediction failed: %s", str(e), exc_info=True)
        PREDICTION_REQUESTS.labels(endpoint="/predict/batch", status="error").inc()
        PREDICTION_ERRORS.labels(error_type="inference_error").inc()
        raise HTTPException(
            status_code=500,
            detail=f"Batch inference failed: {str(e)}",
        )
    finally:
        ACTIVE_PREDICTIONS.dec()


# ---------------------------------------------------------------------------
# GET /model/info — Model metadata
# ---------------------------------------------------------------------------
@router.get(
    "/model/info",
    response_model=ModelInfoResponse,
    summary="Get model metadata",
    description="Returns information about the currently loaded model, including its name, load status, and supported labels.",
)
def model_info():
    """Return metadata about the loaded model."""
    return ModelInfoResponse(**sentiment_model.get_info())
