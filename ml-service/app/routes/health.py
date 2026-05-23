"""
SentinelOps ML Service — Health Check Routes

Provides liveness and readiness probes for Kubernetes.
    - GET /health       → Liveness (is the process alive?)
    - GET /health/ready → Readiness (is the model loaded and ready to serve?)
"""

import time
import logging

from fastapi import APIRouter

from app.schemas import HealthResponse, ReadinessResponse
from app.model import sentiment_model

logger = logging.getLogger("sentinelops.health")

router = APIRouter(prefix="/health", tags=["Health"])

# Record the startup time for uptime calculation
_start_time = time.time()


@router.get(
    "",
    response_model=HealthResponse,
    summary="Liveness probe",
    description="Returns 200 if the service process is running. Used by Kubernetes liveness probe.",
)
def liveness():
    """Liveness check — always returns OK if the process is up."""
    return HealthResponse(
        status="ok",
        service="ml-service",
        version="1.0.0",
    )


@router.get(
    "/ready",
    response_model=ReadinessResponse,
    summary="Readiness probe",
    description="Returns 200 only if the ML model is loaded and ready for inference. Used by Kubernetes readiness probe.",
)
def readiness():
    """Readiness check — returns 200 only when the model is loaded."""
    model_loaded = sentiment_model.is_loaded
    uptime = round(time.time() - _start_time, 2)

    status = "ready" if model_loaded else "not_ready"
    status_code = 200 if model_loaded else 503

    response = ReadinessResponse(
        status=status,
        model_loaded=model_loaded,
        model_name=sentiment_model.model_name if model_loaded else None,
        uptime_seconds=uptime,
    )

    if not model_loaded:
        logger.warning("Readiness check failed: model not loaded")
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=status_code, content=response.model_dump())

    return response
