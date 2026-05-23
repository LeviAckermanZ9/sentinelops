"""
SentinelOps ML Service — FastAPI Application Entrypoint

This is the main application file that:
    1. Loads the ML model at startup via the `lifespan` context manager
    2. Configures CORS middleware
    3. Mounts Prometheus instrumentation
    4. Includes all API routers (predict, health)

Usage:
    uvicorn app.main:app --host 0.0.0.0 --port 8000
"""

import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from app.model import sentiment_model
from app.routes import predict, health

# ---------------------------------------------------------------------------
# Logging Configuration
# ---------------------------------------------------------------------------
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger("sentinelops")


# ---------------------------------------------------------------------------
# Lifespan — Model loading at startup, cleanup at shutdown
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager (replaces deprecated @app.on_event).

    Startup:  Load the ML model into memory.
    Shutdown: Unload the model and release resources.
    """
    logger.info("🚀 SentinelOps ML Service starting up...")
    try:
        sentiment_model.load()
        logger.info("✅ Model loaded — service is ready for inference")
    except Exception as e:
        logger.error("❌ Failed to load model: %s", str(e))
        # Don't crash — readiness probe will report not_ready
        # This allows the pod to restart via K8s liveness probe

    yield  # Application runs here

    logger.info("🛑 SentinelOps ML Service shutting down...")
    sentiment_model.unload()
    logger.info("✅ Model unloaded — goodbye!")


# ---------------------------------------------------------------------------
# FastAPI Application
# ---------------------------------------------------------------------------
app = FastAPI(
    title="SentinelOps ML Service",
    description=(
        "Production-grade sentiment analysis API powered by DistilBERT. "
        "Part of the SentinelOps MLOps platform."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# CORS Middleware
# ---------------------------------------------------------------------------
ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Prometheus Instrumentation
# ---------------------------------------------------------------------------
# Automatically tracks HTTP request count, latency, and response size
# Excludes health and metrics endpoints to reduce noise
Instrumentator(
    should_group_status_codes=False,
    excluded_handlers=["/health.*", "/metrics", "/docs", "/redoc", "/openapi.json"],
).instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)


# ---------------------------------------------------------------------------
# Include Routers
# ---------------------------------------------------------------------------
app.include_router(health.router)
app.include_router(predict.router)


# ---------------------------------------------------------------------------
# Root Endpoint
# ---------------------------------------------------------------------------
@app.get("/", include_in_schema=False)
def root():
    """Root redirect to API docs."""
    return {
        "service": "SentinelOps ML Service",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }
