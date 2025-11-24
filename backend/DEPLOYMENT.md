# Natural Speech Backend - Deployment Guide

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Manual Deployment

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your settings
```

3. **Start with Gunicorn:**
```bash
./start_production.sh
```

## Environment Variables

Key environment variables (see `.env.example` for full list):

- `ENVIRONMENT`: `production` or `development`
- `DEBUG`: `True` or `False`
- `CORS_ORIGINS`: Comma-separated list of allowed origins
- `RATE_LIMIT_ENABLED`: Enable/disable rate limiting
- `RATE_LIMIT_PER_MINUTE`: Requests per minute limit
- `MAX_UPLOAD_SIZE`: Maximum file upload size in bytes
- `DATABASE_URL`: Database connection string

## Production Checklist

- [ ] Set `ENVIRONMENT=production`
- [ ] Set `DEBUG=False`
- [ ] Configure `CORS_ORIGINS` with specific domains (not `*`)
- [ ] Enable rate limiting
- [ ] Configure SSL/TLS certificates
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Set resource limits in Docker
- [ ] Configure firewall rules
- [ ] Test health check endpoints

## Monitoring

- Health check: `GET /api/health`
- Status: `GET /api/status`
- System metrics: `GET /api/system/metrics` (if enabled)
- Application metrics: `GET /api/metrics`

## Troubleshooting

See `README_PRODUCTION.md` for detailed troubleshooting guide.

