# Multi-stage secure build for TrustVault Backend
FROM python:3.12-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Final minimal production image
FROM python:3.12-slim

# Create unprivileged application user
RUN groupadd -g 10001 trustvault && \
    useradd -u 10001 -g trustvault -s /bin/false -m trustvault

WORKDIR /app

# Install runtime PostgreSQL client library
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /root/.local /home/trustvault/.local
COPY --chown=trustvault:trustvault . /app

ENV PATH=/home/trustvault/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    ENVIRONMENT=production

# Private storage directory owned by unprivileged user
RUN mkdir -p /app/private_storage && \
    chown -R trustvault:trustvault /app/private_storage

USER trustvault

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/api/system/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
