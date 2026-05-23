# ============================================================
# SentinelOps Frontend — Multi-Stage Dockerfile
# ============================================================
# Stage 1: Build the React app with Vite
# Stage 2: Serve with Nginx
# ============================================================

# ---------------------------------------------------------------------------
# Stage 1 — Build
# ---------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /build

COPY package.json ./
RUN npm install && npm cache clean --force

COPY . .
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2 — Serve
# ---------------------------------------------------------------------------
FROM nginx:1.25-alpine AS production

LABEL project="sentinelops"
LABEL service="frontend"

# Copy built assets
COPY --from=builder /build/dist /usr/share/nginx/html

# Copy nginx config for SPA routing
RUN echo 'server { \
    listen 5173; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { try_files $uri $uri/ /index.html; } \
    location /assets { expires 1y; add_header Cache-Control "public, immutable"; } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5173/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
