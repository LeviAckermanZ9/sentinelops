#!/bin/bash
# ============================================================
# SentinelOps — Trivy Security Scan Script
# Scans all Docker images for vulnerabilities
# Fails on CRITICAL CVEs, reports HIGH
# ============================================================
set -e

IMAGE_TAG="${1:-latest}"
REGISTRY="${2:-sentinelops}"

echo "=========================================="
echo "  SentinelOps — Security Scan (Trivy)"
echo "=========================================="

services=("ml-service" "auth-service" "api-gateway" "frontend")
FAILED=0

for service in "${services[@]}"; do
  IMAGE="${REGISTRY}/${service}:${IMAGE_TAG}"
  echo ""
  echo "🔒 Scanning ${IMAGE}..."

  # Fail on CRITICAL vulnerabilities
  if ! trivy image --severity CRITICAL --exit-code 1 --no-progress "${IMAGE}"; then
    echo "❌ CRITICAL vulnerabilities found in ${service}!"
    FAILED=1
  fi

  # Report HIGH vulnerabilities (don't fail)
  trivy image --severity HIGH --exit-code 0 --no-progress --format table "${IMAGE}"

  # Generate JSON report for archiving
  trivy image --format json -o "trivy-report-${service}.json" "${IMAGE}" 2>/dev/null || true

  echo "✅ ${service} scan complete"
done

if [ $FAILED -eq 1 ]; then
  echo ""
  echo "❌ Security scan FAILED — CRITICAL vulnerabilities detected!"
  exit 1
fi

echo ""
echo "✅ All security scans passed!"
