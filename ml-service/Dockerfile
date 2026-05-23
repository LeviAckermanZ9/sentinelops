# ============================================================
# SentinelOps ML Service — Multi-Stage Dockerfile
# ============================================================
# Stage 1: Install dependencies (cached layer)
# Stage 2: Production image with app code (slim, non-root)
# ============================================================

# ---------------------------------------------------------------------------
# Stage 1 — Dependency Installation
# ---------------------------------------------------------------------------
FROM python:3.11-slim AS builder

WORKDIR /build

# Install system dependencies for torch/transformers
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc g++ && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements first for layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ---------------------------------------------------------------------------
# Stage 2 — Production Image
# ---------------------------------------------------------------------------
FROM python:3.11-slim AS production

LABEL project="sentinelops"
LABEL service="ml-service"

WORKDIR /app

# Copy installed Python packages from builder
COPY --from=builder /install /usr/local

# Create non-root user for security
RUN groupadd -r sentinelops && \
    useradd -r -g sentinelops -d /app -s /sbin/nologin sentinelops && \
    mkdir -p /app/models && \
    chown -R sentinelops:sentinelops /app

# Copy application code
COPY --chown=sentinelops:sentinelops app/ ./app/

# Switch to non-root user
USER sentinelops

# Environment defaults
ENV MODEL_NAME=distilbert-base-uncased-finetuned-sst-2-english
ENV MODEL_CACHE_DIR=/app/models
ENV LOG_LEVEL=INFO
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Expose the service port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Run with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
