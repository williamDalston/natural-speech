# Render Deployment Fix - Gunicorn Error

## 🐛 Problem

```
gunicorn: error: unrecognized arguments: false
```

This error occurs when Render tries to pass `false` as an argument to gunicorn.

## ✅ Solution

### Step 1: Check Render Dashboard Settings

1. Go to your Render service dashboard
2. Click on **Settings** tab
3. Scroll to **Start Command** section
4. **IMPORTANT**: Make sure the **Start Command** field is **EMPTY** or **BLANK**
5. Docker handles the startup via the Dockerfile CMD, so no start command is needed

### Step 2: Verify Environment Variables

In Render dashboard → Environment tab, ensure these are set correctly:

```
ENVIRONMENT=production
DEBUG=false
HOST=0.0.0.0
PORT=10000
WORKERS=1
LOG_LEVEL=info
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=60
```

**Note**: `DEBUG=false` should be the string `"false"`, not a boolean.

### Step 3: Update Dockerfile (Optional - More Robust)

The Dockerfile CMD is already correct, but we can make it more explicit:

```dockerfile
CMD ["sh", "-c", "exec gunicorn main:app --workers ${WORKERS:-1} --worker-class uvicorn.workers.UvicornWorker --bind ${HOST:-0.0.0.0}:${PORT:-8000} --timeout 300 --access-logfile - --error-logfile - --log-level ${LOG_LEVEL:-info}"]
```

### Step 4: Redeploy

After fixing the Start Command:
1. Go to **Manual Deploy** → **Deploy latest commit**
2. Or push a new commit to trigger auto-deploy

---

## 🔍 Common Causes

### Cause 1: Start Command Set in Dashboard
**Problem**: Render dashboard has a start command like `gunicorn main:app false`  
**Fix**: Clear the Start Command field completely

### Cause 2: Environment Variable in Start Command
**Problem**: Start command references `$DEBUG` which is `false`  
**Fix**: Remove start command, let Dockerfile handle it

### Cause 3: Build Command Issues
**Problem**: Build command might be interfering  
**Fix**: Leave Build Command empty (Docker handles it)

---

## ✅ Correct Render Configuration

### Service Settings
- **Name**: `natural-speech-backend`
- **Region**: Your preferred region
- **Branch**: `main`
- **Root Directory**: `backend` (if using render.yaml, this is auto-set)
- **Runtime**: `Docker`
- **Build Command**: (EMPTY - Docker handles it)
- **Start Command**: (EMPTY - Dockerfile CMD handles it) ⚠️ **THIS IS KEY**

### Environment Variables
```
ENVIRONMENT=production
DEBUG=false
HOST=0.0.0.0
PORT=10000
WORKERS=1
LOG_LEVEL=info
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=60
TEMP_DIR=/tmp/natural_speech
```

### Health Check
- **Health Check Path**: `/api/health`

---

## 🚀 Quick Fix Steps

1. **Go to Render Dashboard**
   - Navigate to your service
   - Click **Settings**

2. **Clear Start Command**
   - Find **Start Command** field
   - **Delete everything** (make it blank)
   - Click **Save Changes**

3. **Verify Build Command**
   - Find **Build Command** field
   - Should be **empty**
   - If not, clear it and save

4. **Redeploy**
   - Go to **Manual Deploy**
   - Click **Deploy latest commit**

---

## 📝 Verification

After redeploy, check the logs. You should see:

```
✅ Starting Gunicorn with Uvicorn workers...
✅ Natural Speech API starting up...
✅ Your service is live
```

**NOT**:
```
❌ gunicorn: error: unrecognized arguments: false
```

---

## 🔧 Alternative: Use render.yaml

If you're using `render.yaml`, make sure it doesn't specify a start command:

```yaml
services:
  - type: web
    name: natural-speech-backend
    runtime: docker
    dockerfilePath: ./backend/Dockerfile
    dockerContext: ./backend
    # NO startCommand here - Dockerfile handles it
```

---

## 💡 Why This Happens

Render allows you to set a "Start Command" in the dashboard. If this is set incorrectly (like `gunicorn main:app $DEBUG`), it overrides the Dockerfile CMD and can cause issues.

**Best Practice**: When using Docker, always leave Start Command empty and let the Dockerfile CMD handle startup.

---

## ✅ Summary

**The Fix**: Clear the **Start Command** field in Render dashboard Settings.

**Why**: Dockerfile already has the correct CMD, so Render shouldn't override it.

**Result**: Service should start correctly with gunicorn.

---

**After fixing, redeploy and the error should be gone!** 🎉

