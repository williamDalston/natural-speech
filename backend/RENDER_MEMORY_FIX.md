# Render Memory Fix - Out of Memory Error

## Problem

Backend is running out of memory on Render free tier (512MB limit).

**Symptoms**:
- Service crashes with "Out of memory (used over 512Mi)"
- Multiple workers starting (4 workers instead of 1)
- Service restarts repeatedly

## Root Cause

1. **Too Many Workers**: Service was starting 4 workers, each loading models into memory
2. **Large Models**: Kokoro + SadTalker models use ~300-400MB RAM per worker
3. **Memory Math**: 4 workers × 400MB = 1.6GB (exceeds 512MB free tier)

## Solution Applied

### 1. Default to 1 Worker

**Files Changed**:
- `backend/Dockerfile` - Explicitly uses 1 worker by default
- `backend/gunicorn_config.py` - Default changed from CPU-based to 1
- `backend/config.py` - Default changed from 4 to 1

### 2. Verify Environment Variable

**In Render Dashboard**:
1. Go to your service
2. **Environment** tab
3. Verify `WORKERS=1` is set
4. If not, add it:
   - Key: `WORKERS`
   - Value: `1`

## After Fix

### Memory Usage (Expected)
- **1 Worker**: ~400-450MB (fits in 512MB free tier)
- **Base Python**: ~50MB
- **Models Loaded**: ~300-350MB
- **Buffer**: ~50-100MB remaining

### Performance
- ✅ Service stays running
- ✅ Handles requests (single worker)
- ⚠️ Slower under high load (but works!)
- ✅ No crashes

## Next Steps

1. **Commit and Push** the fixes
2. **Verify WORKERS=1** in Render environment variables
3. **Redeploy** or wait for auto-deploy
4. **Monitor** logs for memory usage
5. **Test** the service

## If Still OOM After Fix

### Option 1: Disable Preloading
Add to Dockerfile CMD:
```
--preload false
```
This reduces startup memory but slightly increases request latency.

### Option 2: Lazy Load Models
Only load models when first requested (requires code changes).

### Option 3: Upgrade Plan
- **Render Starter**: $7/month (same 512MB, but always-on)
- **Render Standard**: $25/month (2GB RAM, can use 2 workers)

## Verification

After redeploy, check logs for:
```
[INFO] Booting worker with pid: X
```

Should see **only 1 worker** starting, not 4.

## Memory Monitoring

Watch Render logs for:
- Memory usage messages
- Service stability
- Successful request handling

