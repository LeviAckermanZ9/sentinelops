# ============================================================
# SentinelOps Auth Service — Multi-Stage Dockerfile
# ============================================================

# ---------------------------------------------------------------------------
# Stage 1 — Install dependencies
# ---------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /build

# Copy package files for layer caching
COPY package.json ./

# Install production dependencies only
RUN npm install --omit=dev && npm cache clean --force

# ---------------------------------------------------------------------------
# Stage 2 — Production image
# ---------------------------------------------------------------------------
FROM node:20-alpine AS production

LABEL project="sentinelops"
LABEL service="auth-service"

WORKDIR /app

# Create non-root user
RUN addgroup -S sentinelops && adduser -S sentinelops -G sentinelops

# Copy node_modules from builder
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/package.json ./

# Copy source code
COPY --chown=sentinelops:sentinelops src/ ./src/

# Create logs directory
RUN mkdir -p logs && chown sentinelops:sentinelops logs

# Switch to non-root user
USER sentinelops

# Environment defaults
ENV NODE_ENV=production
ENV PORT=3001

# Expose the service port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start the application
CMD ["node", "src/index.js"]
