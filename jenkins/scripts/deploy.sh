#!/bin/bash
# ============================================================
# SentinelOps — Kubernetes Deploy Script
# Updates container images and waits for rollout
# ============================================================
set -e

IMAGE_TAG="${1:-latest}"
REGISTRY="${2:-sentinelops}"
NAMESPACE="${3:-sentinelops}"
TIMEOUT="${4:-300s}"

echo "=========================================="
echo "  SentinelOps — Deploying to Kubernetes"
echo "  Tag: ${IMAGE_TAG}"
echo "  Namespace: ${NAMESPACE}"
echo "=========================================="

# Apply namespace (idempotent)
kubectl apply -f kubernetes/namespaces/

# Update image for each deployment
services=("ml-service" "auth-service" "api-gateway" "frontend")
containers=("ml-service" "auth-service" "nginx" "frontend")

for i in "${!services[@]}"; do
  SERVICE="${services[$i]}"
  CONTAINER="${containers[$i]}"
  IMAGE="${REGISTRY}/${SERVICE}:${IMAGE_TAG}"

  echo ""
  echo "🚀 Deploying ${SERVICE} → ${IMAGE}"
  kubectl set image deployment/${SERVICE} \
    ${CONTAINER}=${IMAGE} \
    -n ${NAMESPACE} 2>/dev/null || \
    kubectl apply -f kubernetes/${SERVICE}/ -n ${NAMESPACE}
done

# Apply monitoring manifests
echo ""
echo "📊 Applying monitoring manifests..."
kubectl apply -f kubernetes/monitoring/prometheus/ -n ${NAMESPACE} 2>/dev/null || true
kubectl apply -f kubernetes/monitoring/grafana/ -n ${NAMESPACE} 2>/dev/null || true

# Wait for rollouts
echo ""
echo "⏳ Waiting for rollouts to complete (timeout: ${TIMEOUT})..."
for service in "${services[@]}"; do
  echo "   Waiting for ${service}..."
  kubectl rollout status deployment/${service} -n ${NAMESPACE} --timeout=${TIMEOUT}
done

echo ""
echo "✅ All deployments rolled out successfully!"
echo ""
kubectl get pods -n ${NAMESPACE} -o wide
