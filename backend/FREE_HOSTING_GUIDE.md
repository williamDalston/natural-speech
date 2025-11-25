# Free Backend Hosting Options

This guide covers free hosting platforms for the Natural Speech FastAPI backend.

## Best Free Options

### 🏆 1. **Render** (Recommended)
**Why it's great**: Easy setup, good free tier, supports Docker
- **Free Tier**:
  - 512 MB RAM
  - 0.5 CPU
  - Spins down after 15 minutes of inactivity
  - Free SSL certificate
  - Custom domain support
- **Limitations**: Spins down after inactivity (first request may be slow)
- **Perfect for**: Development, testing, low-traffic production

**Setup**:
1. Connect GitHub repo to Render
2. Select "Web Service"
3. Render will auto-detect Dockerfile
4. Set environment variables
5. Deploy!

See [render.yaml](#render-configuration) for configuration.

---

### 🚀 2. **Fly.io**
**Why it's great**: Generous free tier, always-on, good performance
- **Free Tier**:
  - 3 shared-cpu-1x VMs (256MB RAM each)
  - 3GB persistent volumes
  - 160GB outbound data transfer
  - Always-on (no spin-down)
- **Limitations**: Limited to 3 apps on free tier
- **Perfect for**: Production apps that need to stay running

**Setup**:
1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Run: `fly launch`
3. Follow prompts
4. Deploy: `fly deploy`

See [fly.toml](#fly-io-configuration) for configuration.

---

### 🐍 3. **PythonAnywhere**
**Why it's great**: Designed specifically for Python apps
- **Free Tier**:
  - Always-on (no spin-down)
  - 512MB disk space
  - Custom domain support
  - Web app hosting
- **Limitations**: Limited disk space, no custom domain on free tier
- **Perfect for**: Small apps, learning, development

**Setup**:
1. Sign up at pythonanywhere.com
2. Create new Web app
3. Upload your code (or clone from GitHub)
4. Install dependencies in Bash console
5. Configure web app to run your FastAPI app

---

### 🔄 4. **Replit**
**Why it's great**: Easy to get started, integrated IDE
- **Free Tier**:
  - Always-on (with some limitations)
  - 0.5GB RAM
  - Public hosting
- **Limitations**: Resource limits, may pause during inactivity
- **Perfect for**: Quick prototypes, demos

**Setup**:
1. Import from GitHub
2. Configure run command
3. Enable "Always On" (may require upgrade for full features)

---

### ⚡ 5. **Cyclic** (Serverless)
**Why it's great**: Serverless, pay-per-use model
- **Free Tier**: 
  - Generous free tier
  - Auto-scaling
  - Pay only for what you use
- **Limitations**: Cold starts, may not work for long-running tasks
- **Perfect for**: API endpoints, lightweight backends

---

## Comparison Table

| Platform | Free Tier RAM | Always-On | Ease of Setup | Best For |
|----------|---------------|-----------|---------------|----------|
| **Render** | 512 MB | ❌ (spins down) | ⭐⭐⭐⭐⭐ | General use |
| **Fly.io** | 768 MB (3x 256MB) | ✅ | ⭐⭐⭐⭐ | Production |
| **PythonAnywhere** | Limited | ✅ | ⭐⭐⭐ | Python-focused |
| **Replit** | 0.5 GB | ⚠️ | ⭐⭐⭐⭐⭐ | Quick demos |
| **Cyclic** | Serverless | ✅ | ⭐⭐⭐⭐ | Serverless APIs |

---

## Recommended Setup: Render

Render is the easiest and most straightforward option for this backend. See [DEPLOY_RENDER.md](./DEPLOY_RENDER.md) for detailed step-by-step instructions.

**Quick Summary**:
1. Sign up at render.com
2. Connect GitHub repo
3. Create Web Service (Docker)
4. Set environment variables
5. Deploy!

**Optimizations for Free Tier**:
- Uses 1 worker instead of 4 (reduces memory from ~800MB to ~400MB)
- Configured for Render's free tier limits
- See [FREE_TIER_OPTIMIZATION.md](./FREE_TIER_OPTIMIZATION.md) for details

### Quick Start

1. **Push code to GitHub** (if not already)
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push
   ```

2. **Connect to Render**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub
   - Click "New +" → "Web Service"
   - Select your repository

3. **Configure Service**
   - **Name**: `natural-speech-backend`
   - **Environment**: `Docker`
   - **Region**: Choose closest to you
   - **Branch**: `main` or your deployment branch

4. **Set Environment Variables**
   ```
   ENVIRONMENT=production
   DEBUG=false
   HOST=0.0.0.0
   PORT=10000
   CORS_ORIGINS=https://your-frontend.vercel.app,https://your-frontend.netlify.app
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy automatically
   - Wait for deployment to complete (first build takes 5-10 minutes)

6. **Get Your URL**
   - Your backend will be at: `https://natural-speech-backend.onrender.com`
   - Update your frontend's `VITE_API_BASE_URL` to this URL

---

## Configuration Files

### Render Configuration

Create `render.yaml` in your repository root:

```yaml
services:
  - type: web
    name: natural-speech-backend
    runtime: docker
    dockerfilePath: ./backend/Dockerfile
    dockerContext: ./backend
    plan: free
    healthCheckPath: /api/health
    envVars:
      - key: ENVIRONMENT
        value: production
      - key: DEBUG
        value: "false"
      - key: HOST
        value: 0.0.0.0
      - key: PORT
        value: 10000
      - key: CORS_ORIGINS
        sync: false  # Set manually in dashboard
```

### Fly.io Configuration

Create `fly.toml` in backend directory:

```toml
app = "natural-speech-backend"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = 8000
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1
  processes = ["app"]

[[services]]
  protocol = "tcp"
  internal_port = 8000
  processes = ["app"]

  [[services.ports]]
    port = 80
    handlers = ["http"]
    force_https = true

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

---

## Environment Variables

Set these in your hosting platform's dashboard:

### Required
```
ENVIRONMENT=production
DEBUG=false
HOST=0.0.0.0
PORT=8000  # Or port assigned by platform
```

### Optional (with defaults)
```
CORS_ORIGINS=https://your-frontend-url.com
LOG_LEVEL=INFO
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=60
TEMP_DIR=/tmp
```

### Paths (usually auto-detected)
```
MODEL_PATH=kokoro-v0_19.onnx
VOICES_PATH=voices.bin
SADTALKER_PATH=SadTalker
```

---

## Important Notes

### ⚠️ Free Tier Limitations

1. **Cold Starts**: Render spins down after inactivity (15 min)
   - First request may take 30-60 seconds
   - Consider upgrading to paid plan for always-on

2. **Resource Limits**: 
   - Limited RAM may affect model loading
   - Large models may cause memory issues
   - Consider model optimization

3. **File Storage**:
   - Temporary files are cleaned up
   - Don't rely on persistent file storage on free tier
   - Use external storage (S3, etc.) for production

4. **Build Time**:
   - First build can take 10-15 minutes (downloading dependencies)
   - Subsequent builds are faster with caching

---

## Troubleshooting

### Build Fails

**Issue**: Out of memory during build
**Solution**: Optimize Dockerfile, use multi-stage builds

**Issue**: Dependencies too large
**Solution**: Use `--no-cache` sparingly, optimize requirements.txt

### App Crashes

**Issue**: Out of memory at runtime
**Solution**: 
- Reduce model size if possible
- Optimize batch processing
- Upgrade to paid plan

**Issue**: Timeout errors
**Solution**: 
- Optimize avatar generation
- Use async endpoints
- Increase timeout limits

### Cold Start Issues

**Issue**: Slow first request on Render
**Solution**:
- Use health check endpoint to keep warm
- Upgrade to paid plan for always-on
- Consider Fly.io (always-on free tier)

---

## Migration Guide

### From Railway to Render

1. Export environment variables from Railway
2. Create Render service
3. Set environment variables in Render
4. Update frontend API URL
5. Test deployment

### From Railway to Fly.io

1. Install Fly CLI
2. Run `fly launch` in backend directory
3. Copy environment variables
4. Deploy: `fly deploy`
5. Update frontend API URL

---

## Recommended Strategy

### For Development/Testing:
- Use **Render** (easiest setup)

### For Production (Low Traffic):
- Use **Fly.io** (always-on, better performance)

### For Production (High Traffic):
- Consider paid plans or self-hosting
- Use **Render** ($7/month) for better resources

---

## Next Steps

1. Choose a platform (recommend Render or Fly.io)
2. Create configuration file (see examples above)
3. Push to GitHub
4. Connect repository to hosting platform
5. Set environment variables
6. Deploy!
7. Update frontend `VITE_API_BASE_URL`

---

## Support

- **Render Docs**: https://render.com/docs
- **Fly.io Docs**: https://fly.io/docs
- **PythonAnywhere Docs**: https://help.pythonanywhere.com
- **Replit Docs**: https://docs.replit.com

