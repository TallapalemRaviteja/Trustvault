# Multi-stage Unified Dockerfile for TrustVault (Frontend + Backend in One Service)

# Stage 1: Build React TypeScript Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

COPY frontend/ ./
RUN npm run build

# Stage 2: Build Python Backend Environment
FROM python:3.12-slim AS backend-builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 3: Final Production Container
FROM python:3.12-slim

# Create unprivileged application user
RUN groupadd -g 10001 trustvault && \
    useradd -u 10001 -g trustvault -s /bin/false -m trustvault

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend dependencies
COPY --from=backend-builder /root/.local /home/trustvault/.local

# Copy frontend built assets
COPY --from=frontend-builder --chown=trustvault:trustvault /app/frontend/dist /app/frontend/dist

# Copy backend application source
COPY --chown=trustvault:trustvault backend/ /app

ENV PATH=/home/trustvault/.local/bin:$PATH \
    PYTHONPATH=/app \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    ENVIRONMENT=production \
    PORT=8000

# Prepare private storage directory owned by unprivileged user
RUN mkdir -p /app/private_storage && \
    chown -R trustvault:trustvault /app/private_storage /app

USER trustvault

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:${PORT}/api/system/health || exit 1

# Start Uvicorn bound to Render dynamic $PORT or default 8000
CMD sh -c "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"
