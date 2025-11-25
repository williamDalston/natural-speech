# Deploy to Render (Free Tier)

Step-by-step guide to deploy the Natural Speech backend to Render's free tier.

## Prerequisites

- GitHub account
- Repository pushed to GitHub
- Render account (free)

## Step 1: Sign Up for Render

1. Go to [render.com](https://render.com)
2. Click "Get Started for Free"
3. Sign up with your GitHub account

## Step 2: Create Web Service

1. Click "New +" button
2. Select "Web Service"
3. Connect your GitHub repository
4. Select the repository

## Step 3: Configure Service

### Basic Settings

- **Name**: `natural-speech-backend` (or your preferred name)
- **Region**: Choose closest to you
- **Branch**: `main` (or your deployment branch)
- **Root Directory**: `backend` (important!)
- **Runtime**: `Docker`
- **Build Command**: (leave empty - Docker handles it)
- **Start Command**: (leave empty - Docker handles it)

### Environment Variables

Click "Add Environment Variable" and add:

```
ENVIRONMENT=production
DEBUG=false
HOST=0.0.0.0
PORT=10000
WORKERS=1
LOG_LEVEL=INFO
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=60
TEMP_DIR=/tmp/natural_speech
```

**Important**: Set `CORS_ORIGINS` after deployment:
- Get your Render URL (e.g., `https://natural-speech-backend.onrender.com`)
- Get your frontend URL (e.g., `https://your-app.vercel.app`)
- Add environment variable:
  ```
  CORS_ORIGINS=https://your-frontend.vercel.app,https://your-app.netlify.app
  ```

### Plan

- Select **Free** plan

### Health Check

- **Health Check Path**: `/api/health`

## Step 4: Deploy

1. Click "Create Web Service"
2. Render will start building (this takes 10-15 minutes first time)
3. Watch the build logs
4. Wait for "Your service is live" message

## Step 5: Update Frontend

After deployment, update your frontend's environment variable:

```
VITE_API_BASE_URL=https://your-backend-name.onrender.com/api
```

## Step 6: Test

1. Visit `https://your-backend-name.onrender.com/api/health`
2. Should return: `{"status":"healthy","timestamp":"...","version":"1.0.0"}`

## Important Notes

### Cold Starts

- Render free tier spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- Keep-alive solutions:
  - Use cron job to ping `/api/health` every 10 minutes
  - Or upgrade to paid plan ($7/month) for always-on

### Resource Limits

- Free tier: 512 MB RAM, 0.5 CPU
- Your app may use most of this for models
- If crashes occur, consider:
  - Using smaller models
  - Optimizing code
  - Upgrading to paid plan

### Build Time

- First build: 10-15 minutes (downloading dependencies)
- Subsequent builds: 5-10 minutes (with caching)

## Troubleshooting

### Build Fails

**Issue**: Out of memory
**Solution**: Build process uses build-time resources, not runtime. Should be fine.

**Issue**: Docker build fails
**Solution**: Check build logs, ensure all files are in repository

### App Crashes

**Issue**: Out of memory at runtime
**Solution**: 
- Reduce `WORKERS=1` (already set)
- Check logs for memory errors
- Consider model optimization

**Issue**: Timeout on avatar generation
**Solution**: 
- Render has 60-second request timeout on free tier
- Use `/api/avatar/async` endpoint instead
- Check job status with `/api/jobs/{job_id}`

### CORS Errors

**Issue**: Frontend can't connect
**Solution**: 
- Ensure `CORS_ORIGINS` includes your frontend URL
- Format: `https://your-app.vercel.app,https://your-app.netlify.app`
- No trailing slashes!
- Restart service after adding

## Monitoring

### View Logs

1. Go to your service dashboard
2. Click "Logs" tab
3. View real-time logs

### Health Checks

- Render automatically pings `/api/health`
- Check service status in dashboard

## Upgrading to Paid

If you need always-on or more resources:

1. Go to service settings
2. Change plan to "Starter" ($7/month)
3. Benefits:
   - Always-on (no cold starts)
   - 512 MB RAM, 0.5 CPU (same resources)
   - Better performance

Or "Standard" ($25/month) for:
- 2 GB RAM, 1 CPU
- Always-on
- Much better performance

## Cost Estimate

- **Free Tier**: $0/month (with limitations)
- **Starter Plan**: $7/month (always-on, same resources)
- **Standard Plan**: $25/month (more resources)

## Next Steps

1. Set up monitoring
2. Configure custom domain (optional)
3. Set up automatic deployments from GitHub
4. Consider upgrading if you need always-on

