#!/bin/bash
# Production startup script for Natural Speech Backend

set -e

echo "Starting Natural Speech Backend in production mode..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "Warning: .env file not found. Using default configuration."
fi

# Create temp directory if it doesn't exist
mkdir -p /tmp/natural_speech

# Check if database needs initialization
if [ ! -f natural_speech.db ]; then
    echo "Initializing database..."
    python -c "from database import init_db; init_db()"
fi

# Start with Gunicorn
echo "Starting Gunicorn with Uvicorn workers..."
exec gunicorn main:app \
    --config gunicorn_config.py \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers ${WORKERS:-4} \
    --worker-class uvicorn.workers.UvicornWorker \
    --timeout 300 \
    --access-logfile - \
    --error-logfile - \
    --log-level ${LOG_LEVEL:-info}

