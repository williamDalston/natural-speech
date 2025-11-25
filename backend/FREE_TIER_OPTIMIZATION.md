# Free Tier Optimization Guide

This guide helps optimize the Natural Speech backend for free hosting tiers.

## Resource Constraints

Free tiers typically have:
- **RAM**: 256-512 MB
- **CPU**: 0.5-1 shared CPU
- **Storage**: Limited
- **Timeouts**: 60-300 seconds
- **Bandwidth**: Limited

## Optimizations Applied

### 1. Reduced Workers

**Before**: 4 workers (default)
**After**: 1 worker (configurable via `WORKERS` env var)

```dockerfile
CMD ["sh", "-c", "gunicorn main:app -w ${WORKERS:-1} ..."]
```

**Why**: Each worker uses ~100-200MB RAM. 4 workers would use 400-800MB, exceeding free tier limits.

### 2. Optimized Dockerfile

- Multi-stage build reduces final image size
- Only installs runtime dependencies
- Cleans up package manager cache

### 3. Environment Variables

Set in deployment:
```bash
WORKERS=1              # Use 1 worker for free tier
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO        # Reduce logging overhead
```

## Memory Optimization

### Model Loading

- Models are loaded once at startup
- Kokoro model: ~50-100 MB
- SadTalker models: ~200-300 MB
- Total: ~300-400 MB (fits in 512 MB free tier)

### If Memory Issues Occur

1. **Use Lazy Loading**
   - Only load models when first requested
   - Implement in `tts_service.py` and `avatar_service.py`

2. **Use Smaller Models**
   - Consider quantized models
   - Or separate TTS and Avatar services

3. **Clean Up Temporary Files**
   - Already implemented with `CleanupScheduler`
   - Monitor `/tmp` directory size

## CPU Optimization

### Processing Limits

- **TTS Generation**: ~1-3 seconds per request
- **Avatar Generation**: ~30-120 seconds per request

**For Free Tier**:
- Limit concurrent requests
- Use async endpoints for long operations
- Implement request queuing

### Rate Limiting

Already configured:
```bash
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=60
```

Adjust based on CPU capacity.

## Storage Optimization

### Temporary Files

- Cleaned up automatically
- Stored in `/tmp` (ephemeral)
- Don't rely on persistent storage

### Model Files

- Stored in repository (built into Docker image)
- Consider using external storage if image too large
- Current size: ~200-500 MB (acceptable)

## Timeout Handling

### Request Timeouts

- Render: 60 seconds (free tier)
- Fly.io: 60 seconds (default)
- PythonAnywhere: 100 seconds

### Solution: Async Endpoints

Use `/api/avatar/async` instead of `/api/avatar`:

1. Submit job: `POST /api/avatar/async`
2. Get job ID immediately
3. Poll status: `GET /api/jobs/{job_id}`
4. Download result: `GET /api/jobs/{job_id}/download`

This avoids request timeout issues.

## Performance Monitoring

### Metrics Endpoint

Check resource usage:
```
GET /api/metrics
```

Returns:
- Request counts
- Response times
- Success/failure rates

### Logs

Monitor logs for:
- Memory errors
- Timeout errors
- CPU spikes

## Recommended Settings

### Render (Free Tier)

```yaml
WORKERS=1
ENVIRONMENT=production
DEBUG=false
PORT=10000
LOG_LEVEL=INFO
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=30  # Lower for free tier
```

### Fly.io (Free Tier)

```toml
[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

Environment:
```bash
WORKERS=1
```

## Upgrade Considerations

### When to Upgrade

Upgrade if:
- Frequent out-of-memory errors
- Requests timing out regularly
- Need always-on (no cold starts)
- High traffic

### Upgrade Options

1. **Render Starter** ($7/month)
   - Always-on
   - Same resources (512 MB RAM)
   - Good for eliminating cold starts

2. **Render Standard** ($25/month)
   - 2 GB RAM, 1 CPU
   - Always-on
   - Much better performance

3. **Fly.io Paid**
   - Scale resources as needed
   - Pay per usage

## Monitoring Free Tier Usage

### Key Metrics to Watch

1. **Memory Usage**
   - Should stay under 400 MB
   - Monitor via logs

2. **Response Times**
   - TTS: < 5 seconds
   - Avatar: Use async endpoint

3. **Error Rates**
   - 429 (Rate Limit): Normal under load
   - 503 (Out of Memory): Need optimization
   - 500 (Timeouts): Use async endpoints

## Best Practices

1. ✅ Use async endpoints for long operations
2. ✅ Implement proper error handling
3. ✅ Monitor resource usage
4. ✅ Clean up temporary files
5. ✅ Use caching where possible
6. ✅ Rate limit to prevent abuse
7. ❌ Don't use synchronous endpoints for long tasks
8. ❌ Don't ignore memory warnings
9. ❌ Don't disable health checks

## Troubleshooting

### Out of Memory

**Symptoms**: Service crashes, 503 errors

**Solutions**:
- Reduce `WORKERS=1` (already done)
- Check for memory leaks
- Use async endpoints
- Optimize model loading

### Cold Starts (Render)

**Symptoms**: First request takes 30-60 seconds

**Solutions**:
- Accept it (free tier limitation)
- Use cron to ping `/api/health`
- Upgrade to paid plan

### Request Timeouts

**Symptoms**: Requests fail after 60 seconds

**Solutions**:
- Use `/api/avatar/async` endpoint
- Poll job status instead
- Upgrade to plan with longer timeouts

## Summary

The backend is optimized for free tier hosting:

✅ 1 worker (reduces memory usage)
✅ Async endpoints for long operations
✅ Automatic cleanup of temporary files
✅ Rate limiting to prevent abuse
✅ Health checks for monitoring
✅ Efficient Dockerfile

With these optimizations, the backend should work well on:
- Render (free tier) - with cold start limitations
- Fly.io (free tier) - always-on, better performance
- Other free Python hosting platforms

