# Natural Speech Backend - Production Deployment Guide

## Overview
This guide covers deploying the Natural Speech backend in a production environment with security, monitoring, and scalability considerations.

## Prerequisites
- Python 3.10+
- Docker and Docker Compose (for containerized deployment)
- Nginx (for reverse proxy)
- SSL certificates (for HTTPS)

## Configuration

### Environment Variables
Create a `.env` file in the backend directory with the following variables:

```bash
# Application
ENVIRONMENT=production
DEBUG=False

# Server
HOST=0.0.0.0
PORT=8000
WORKERS=4

# CORS - IMPORTANT: Set specific origins in production
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CORS_ALLOW_CREDENTIALS=True

# Security
RATE_LIMIT_ENABLED=True
RATE_LIMIT_PER_MINUTE=60

# File Upload
MAX_UPLOAD_SIZE=10485760  # 10MB

# Database
DATABASE_URL=sqlite:///./natural_speech.db

# Logging
LOG_LEVEL=INFO
```

## Deployment Options

### Option 1: Docker Deployment (Recommended)

1. **Build and run with Docker Compose:**
```bash
docker-compose up -d
```

2. **View logs:**
```bash
docker-compose logs -f backend
```

3. **Stop services:**
```bash
docker-compose down
```

### Option 2: Direct Python Deployment

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Set environment variables:**
```bash
export ENVIRONMENT=production
export DEBUG=False
# ... other variables
```

3. **Start with Gunicorn:**
```bash
./start_production.sh
```

Or manually:
```bash
gunicorn main:app \
    --config gunicorn_config.py \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker
```

### Option 3: Systemd Service

Create `/etc/systemd/system/natural-speech.service`:

```ini
[Unit]
Description=Natural Speech API
After=network.target

[Service]
Type=notify
User=www-data
WorkingDirectory=/path/to/natural-speech/backend
Environment="PATH=/path/to/venv/bin"
ExecStart=/path/to/venv/bin/gunicorn main:app --config gunicorn_config.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable natural-speech
sudo systemctl start natural-speech
```

## Nginx Configuration

1. **Copy nginx configuration:**
```bash
sudo cp nginx/nginx.conf /etc/nginx/sites-available/natural-speech
sudo ln -s /etc/nginx/sites-available/natural-speech /etc/nginx/sites-enabled/
```

2. **Update server_name and SSL certificates:**
Edit `/etc/nginx/sites-available/natural-speech` and update:
- `server_name` with your domain
- SSL certificate paths
- Uncomment HTTPS server block

3. **Test and reload:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Security Checklist

- [ ] CORS origins set to specific domains (not `*`)
- [ ] Rate limiting enabled
- [ ] File upload size limits configured
- [ ] SSL/TLS certificates configured
- [ ] API key authentication (if needed)
- [ ] Database credentials secured
- [ ] Log files properly secured
- [ ] Firewall rules configured
- [ ] Regular security updates

## Monitoring

### Health Checks
- Basic: `GET /api/health`
- Detailed: `GET /api/status`

### Logs
- Application logs: Check stdout/stderr or configured log file
- Nginx logs: `/var/log/nginx/access.log` and `/var/log/nginx/error.log`
- Docker logs: `docker-compose logs -f`

### Metrics
- Uptime tracking via `/api/status`
- Request metrics via Nginx access logs
- Error rates via application logs

## Troubleshooting

### Service won't start
- Check logs: `docker-compose logs backend`
- Verify environment variables
- Check port availability: `netstat -tuln | grep 8000`
- Verify model files exist

### High memory usage
- Reduce `WORKERS` count
- Implement request queuing
- Add memory limits in Docker

### Slow avatar generation
- Increase timeout values in Nginx and Gunicorn
- Consider async processing (see Agent 3 tasks)
- Monitor system resources

### CORS errors
- Verify `CORS_ORIGINS` includes frontend domain
- Check Nginx headers configuration
- Ensure credentials match CORS settings

## Backup and Recovery

### Database Backup
```bash
# SQLite
cp natural_speech.db natural_speech.db.backup

# PostgreSQL
pg_dump natural_speech > backup.sql
```

### Model Files
Ensure model files (`kokoro-v0_19.onnx`, `voices.bin.npy`, SadTalker checkpoints) are backed up.

## Scaling

### Horizontal Scaling
- Use load balancer (Nginx, HAProxy)
- Multiple backend instances
- Shared database (PostgreSQL recommended)
- Shared file storage for temp files

### Vertical Scaling
- Increase `WORKERS` count
- Increase server resources
- Optimize model loading

## Support

For issues or questions, check:
- Application logs
- Health check endpoints
- System resource usage
- Network connectivity

