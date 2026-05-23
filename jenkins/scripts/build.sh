#!/bin/bash
# ============================================================
# SentinelOps — Docker Build Script
# Builds all service Docker images with Git SHA tag
# ============================================================
set -e

IMAGE_TAG="${1:-latest}"
REGISTRY="${2:-sentinelops}"

echo "=========================================="
echo "  SentinelOps — Building Docker Images"
echo "  Tag: ${IMAGE_TAG}"
echo "  Registry: ${REGISTRY}"
echo "=========================================="

services=("ml-service" "auth-service" "api-gateway" "frontend")

for service in "${services[@]}"; do
  echo ""
  echo "🔨 Building ${service}..."
  docker build \
    -t "${REGISTRY}/${service}:${IMAGE_TAG}" \
    -t "${REGISTRY}/${service}:latest" \
    --label "git.commit=${IMAGE_TAG}" \
    --label "build.date=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    "./${service}"
  echo "✅ ${service} built successfully"
done

echo ""
echo "✅ All images built!"
docker images | grep "${REGISTRY}"
