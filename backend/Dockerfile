# Multi-stage Dockerfile for Natural Speech Backend
# Stage 1: Build stage
FROM python:3.10-slim as builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Stage 2: Runtime stage
FROM python:3.10-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libmagic1 \
    ffmpeg \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder
COPY --from=builder /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY . .

# Make healthcheck executable
RUN chmod +x healthcheck.py

# Create necessary directories
RUN mkdir -p /tmp/natural_speech /app/SadTalker/results

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV ENVIRONMENT=production
ENV TEMP_DIR=/tmp/natural_speech

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python healthcheck.py || exit 1

# Run with Gunicorn in production
# Use 1 worker by default for free tier hosting (512MB RAM limit)
# Can be overridden with WORKERS environment variable
# Note: Each worker loads models into memory, so 1 worker is recommended for free tier
# Using explicit exec to ensure proper signal handling
CMD exec gunicorn main:app \
    --workers ${WORKERS:-1} \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind ${HOST:-0.0.0.0}:${PORT:-8000} \
    --timeout 300 \
    --access-logfile - \
    --error-logfile - \
    --log-level ${LOG_LEVEL:-info}

