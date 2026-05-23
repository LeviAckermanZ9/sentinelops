"""
SentinelOps ML Service — Prometheus Metrics Definitions

Defines all custom Prometheus metrics for the sentiment analysis service.
These metrics are scraped by Prometheus and visualized in Grafana.

Metrics exposed:
    - prediction_requests_total     (Counter)  — Total prediction requests by endpoint and status
    - prediction_latency_seconds    (Histogram) — Inference latency distribution
    - prediction_errors_total       (Counter)  — Total prediction errors by type
    - model_load_time_seconds       (Gauge)    — Time taken to load the ML model
    - active_predictions            (Gauge)    — Currently in-flight prediction requests
    - prediction_label_total        (Counter)  — Prediction results by sentiment label
"""

from prometheus_client import Counter, Histogram, Gauge

# ---------------------------------------------------------------------------
# Request Metrics
# ---------------------------------------------------------------------------

PREDICTION_REQUESTS = Counter(
    name="prediction_requests_total",
    documentation="Total number of prediction requests received",
    labelnames=["endpoint", "status"],
)

PREDICTION_LATENCY = Histogram(
    name="prediction_latency_seconds",
    documentation="Time spent on model inference in seconds",
    labelnames=["endpoint"],
    buckets=(0.01, 0.025, 0.05, 0.075, 0.1, 0.15, 0.2, 0.3, 0.5, 0.75, 1.0, 2.5, 5.0),
)

PREDICTION_ERRORS = Counter(
    name="prediction_errors_total",
    documentation="Total number of prediction errors",
    labelnames=["error_type"],
)

# ---------------------------------------------------------------------------
# Model Metrics
# ---------------------------------------------------------------------------

MODEL_LOAD_TIME = Gauge(
    name="model_load_time_seconds",
    documentation="Time taken to load the ML model at startup",
)

ACTIVE_PREDICTIONS = Gauge(
    name="active_predictions",
    documentation="Number of currently in-flight prediction requests",
)

# ---------------------------------------------------------------------------
# Business Metrics
# ---------------------------------------------------------------------------

PREDICTION_LABELS = Counter(
    name="prediction_label_total",
    documentation="Total predictions grouped by sentiment label",
    labelnames=["label"],
)
