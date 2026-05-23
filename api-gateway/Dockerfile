# ============================================================
# SentinelOps API Gateway — Dockerfile
# ============================================================

FROM nginx:1.25-alpine

LABEL project="sentinelops"
LABEL service="api-gateway"

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom configuration
COPY nginx.conf /etc/nginx/conf.d/sentinelops.conf

# Expose HTTP and HTTPS ports
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
