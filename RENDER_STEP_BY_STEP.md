# 🚀 Render Deployment Guide - Step by Step

Complete step-by-step guide to deploy your Natural Speech backend to Render for FREE.

---

## 📋 Prerequisites Checklist

Before you start, make sure you have:
- [ ] GitHub account
- [ ] Your code pushed to a GitHub repository
- [ ] Email address for Render account

---

## Step 1: Sign Up for Render

1. **Go to Render**: Open your browser and visit [render.com](https://render.com)

2. **Sign Up**:
   - Click the **"Get Started for Free"** button (top right)
   - Choose **"Sign up with GitHub"** (recommended - easier setup)
   - Authorize Render to access your GitHub account
   - Complete the signup process

3. **Verify Email** (if required):
   - Check your email inbox
   - Click the verification link from Render

✅ **You're now logged into Render!**

---

## Step 2: Prepare Your GitHub Repository

### Option A: Already on GitHub
- ✅ Skip to Step 3 if your code is already on GitHub

### Option B: Push to GitHub Now

1. **Initialize Git** (if not already):
   ```bash
   cd /Users/williamalston/Desktop/natural-speech
   git init
   ```

2. **Add Files**:
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   ```

3. **Create GitHub Repository**:
   - Go to [github.com](https://github.com)
   - Click **"New"** (green button) or **"+"** → **"New repository"**
   - Name it: `natural-speech` (or your preferred name)
   - Choose **Public** or **Private**
   - **Don't** initialize with README (you already have files)
   - Click **"Create repository"**

4. **Push Your Code**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/natural-speech.git
   git branch -M main
   git push -u origin main
   ```
   *(Replace `YOUR_USERNAME` with your actual GitHub username)*

✅ **Your code is now on GitHub!**

---

## Step 3: Create Web Service on Render

1. **Go to Render Dashboard**:
   - You should be at [dashboard.render.com](https://dashboard.render.com)
   - If not, click the Render logo to go home

2. **Start Creating Service**:
   - Click the **"New +"** button (top right, blue button)
   - Select **"Web Service"** from the dropdown menu

3. **Connect Repository**:
   - Render will show a list of your GitHub repositories
   - **Find and click** on your `natural-speech` repository
   - If you don't see it, click **"Configure account"** to connect more repositories

✅ **Repository connected!**

---

## Step 4: Configure Your Service

You'll now see a form to configure your service. Fill it out as follows:

### Basic Settings

**Name**:
```
natural-speech-backend
```
*(Or any name you prefer - this will be part of your URL)*

**Region**:
- Choose the region closest to you (e.g., `Oregon (US West)` or `Frankfurt (EU Central)`)

**Branch**:
```
main
```
*(Or `master` if that's your default branch)*

**Root Directory**:
```
backend
```
⚠️ **IMPORTANT**: This tells Render where your backend code is located!

**Runtime**:
- Select **"Docker"** from the dropdown
- This will use your `backend/Dockerfile`

**Build Command**:
- **Leave empty** - Docker handles the build automatically

**Start Command**:
- **Leave empty** - Docker CMD handles the start automatically

### Plan Selection

**Plan**:
- Select **"Free"** (unless you want to pay $7/month for always-on)

✅ **Basic configuration done!**

---

## Step 5: Set Environment Variables

Scroll down to the **"Environment Variables"** section.

Click **"Add Environment Variable"** and add these one by one:

### Required Variables

1. **ENVIRONMENT**
   - Key: `ENVIRONMENT`
   - Value: `production`

2. **DEBUG**
   - Key: `DEBUG`
   - Value: `false`

3. **HOST**
   - Key: `HOST`
   - Value: `0.0.0.0`

4. **PORT**
   - Key: `PORT`
   - Value: `10000`
   *(Render assigns port 10000 to free tier services)*

5. **WORKERS**
   - Key: `WORKERS`
   - Value: `1`
   *(Reduces memory usage for free tier)*

### Optional Variables (Recommended)

6. **LOG_LEVEL**
   - Key: `LOG_LEVEL`
   - Value: `INFO`

7. **RATE_LIMIT_ENABLED**
   - Key: `RATE_LIMIT_ENABLED`
   - Value: `true`

8. **RATE_LIMIT_PER_MINUTE**
   - Key: `RATE_LIMIT_PER_MINUTE`
   - Value: `60`

9. **TEMP_DIR**
   - Key: `TEMP_DIR`
   - Value: `/tmp/natural_speech`

### Important: CORS_ORIGINS (Set Later)

**Don't set this yet** - we'll add it after deployment when we know your frontend URL.

✅ **Environment variables set!**

---

## Step 6: Advanced Settings (Optional)

Scroll down to **"Advanced"** section:

### Health Check Path

**Health Check Path**:
```
/api/health
```
*(This helps Render monitor your service)*

### Auto-Deploy

**Auto-Deploy**:
- ✅ **Keep enabled** - This deploys automatically when you push to GitHub

✅ **Configuration complete!**

---

## Step 7: Deploy!

1. **Review Everything**:
   - Double-check the settings above
   - Make sure Root Directory is `backend`
   - Make sure Runtime is `Docker`

2. **Create Service**:
   - Click the **"Create Web Service"** button at the bottom
   - Render will start building your service immediately!

---

## Step 8: Watch the Build

You'll see the build logs appear. Here's what to expect:

### Build Process

1. **Cloning repository** (30 seconds)
   - Render downloads your code from GitHub

2. **Building Docker image** (5-10 minutes on first build)
   - Installing system dependencies
   - Installing Python packages
   - Installing PyTorch and ML libraries
   - ⏰ **This takes time - be patient!**

3. **Starting service** (1-2 minutes)
   - Starting Gunicorn
   - Loading models
   - Health checks

### What You'll See

```
==> Cloning from https://github.com/...
==> Determining build plan...
==> Building...
==> Running docker build...
==> Starting service...
```

### ⚠️ First Build Takes Time!

- **First build**: 10-15 minutes (downloading all dependencies)
- **Future builds**: 5-8 minutes (with caching)

✅ **Don't close this page!** Watch for errors.

---

## Step 9: Check Deployment Status

### Success Indicators

You'll know it's successful when you see:
- ✅ **"Your service is live"** message
- ✅ Green status indicator
- ✅ URL appears (e.g., `https://natural-speech-backend.onrender.com`)

### Test Your Service

1. **Copy your service URL** (something like `https://natural-speech-backend.onrender.com`)

2. **Test Health Endpoint**:
   - Open a new browser tab
   - Go to: `https://your-service-url.onrender.com/api/health`
   - You should see: `{"status":"healthy","timestamp":"...","version":"1.0.0"}`

✅ **Your backend is live!**

---

## Step 10: Configure CORS for Frontend

Now that your backend is live, you need to allow your frontend to connect:

1. **Get Your Backend URL**:
   - From Render dashboard, copy your service URL
   - Example: `https://natural-speech-backend.onrender.com`

2. **Get Your Frontend URL**:
   - If deployed: Copy your frontend URL (e.g., `https://your-app.vercel.app`)
   - If not deployed yet: You'll add this later

3. **Add CORS_ORIGINS Variable**:
   - Go back to Render dashboard
   - Click on your service name
   - Go to **"Environment"** tab
   - Click **"Add Environment Variable"**
   - Key: `CORS_ORIGINS`
   - Value: `https://your-frontend.vercel.app,https://your-frontend.netlify.app`
     *(Replace with your actual frontend URLs, separated by commas, no spaces)*
   - Click **"Save Changes"**

4. **Restart Service**:
   - After adding the variable, Render will automatically restart your service
   - Wait for the restart to complete (1-2 minutes)

✅ **CORS configured!**

---

## Step 11: Update Frontend API URL

Now update your frontend to use the new backend URL:

### Option A: Environment Variable (Recommended)

1. **Set in Deployment Platform** (Vercel/Netlify):
   - Go to your frontend deployment settings
   - Add environment variable:
     - Key: `VITE_API_BASE_URL`
     - Value: `https://your-backend-name.onrender.com/api`
   - Redeploy frontend

### Option B: Local Development

1. **Create/Edit `.env.local`** in frontend directory:
   ```bash
   VITE_API_BASE_URL=https://your-backend-name.onrender.com/api
   ```

2. **Restart Dev Server**:
   ```bash
   cd frontend
   npm run dev
   ```

✅ **Frontend connected to backend!**

---

## Step 12: Test Everything

### Test Backend Endpoints

1. **Health Check**:
   ```
   GET https://your-backend.onrender.com/api/health
   ```
   Should return: `{"status":"healthy",...}`

2. **Get Voices**:
   ```
   GET https://your-backend.onrender.com/api/voices
   ```
   Should return a list of voices

3. **Test from Frontend**:
   - Open your frontend app
   - Try generating speech
   - Check browser console for errors

✅ **Everything working!**

---

## 📊 Understanding Render Dashboard

### Dashboard Overview

Once deployed, you'll see:

- **Status**: Green = Running, Yellow = Deploying, Red = Error
- **URL**: Your service URL
- **Latest Deploy**: Deployment history

### Key Tabs

1. **Logs**: View real-time application logs
2. **Events**: See deployment history and events
3. **Metrics**: CPU, Memory, Request metrics (paid plans)
4. **Environment**: Manage environment variables
5. **Settings**: Service configuration

---

## ⚠️ Important Notes About Free Tier

### Cold Starts

- **Issue**: Service spins down after 15 minutes of inactivity
- **Symptom**: First request takes 30-60 seconds
- **Solution Options**:
  1. Accept it (free tier limitation)
  2. Use a cron service to ping `/api/health` every 10 minutes
  3. Upgrade to Starter plan ($7/month) for always-on

### Resource Limits

- **RAM**: 512 MB (your app uses ~400 MB - fits!)
- **CPU**: 0.5 shared CPU
- **Request Timeout**: 60 seconds
  - ✅ Use `/api/avatar/async` for long operations

### Build Time

- **First Build**: 10-15 minutes
- **Subsequent Builds**: 5-8 minutes (faster with caching)

---

## 🐛 Troubleshooting

### Build Fails

**Problem**: Build fails with errors

**Solutions**:
1. Check build logs for specific error
2. Common issues:
   - Missing files in repository
   - Dockerfile errors
   - Out of memory during build (rare)

**Action**: Share error message from logs

---

### Service Crashes

**Problem**: Service starts then crashes

**Solutions**:
1. Check **Logs** tab for error messages
2. Common causes:
   - Out of memory (check WORKERS=1 is set)
   - Missing environment variables
   - Model files not found

**Action**: Check logs, verify environment variables

---

### CORS Errors

**Problem**: Frontend can't connect to backend

**Solutions**:
1. Verify `CORS_ORIGINS` includes your frontend URL
2. Format: `https://your-app.vercel.app` (no trailing slash!)
3. Multiple origins: `https://app1.com,https://app2.com`
4. Restart service after adding CORS_ORIGINS

**Action**: Double-check CORS_ORIGINS value

---

### Slow First Request

**Problem**: First request after inactivity is very slow (30-60 seconds)

**Solutions**:
1. This is normal for free tier (cold start)
2. Subsequent requests are fast
3. Options:
   - Use cron job to keep service warm
   - Upgrade to Starter plan ($7/month)

**Action**: Accept or upgrade

---

### Out of Memory

**Problem**: Service crashes with memory errors

**Solutions**:
1. Verify `WORKERS=1` is set
2. Check logs for memory usage
3. Consider optimizing models
4. Upgrade if needed

**Action**: Check WORKERS environment variable

---

## 🔄 Updating Your Service

### Automatic Deployments

- ✅ Enabled by default
- ✅ Deploys automatically when you push to `main` branch
- ✅ You can disable in Settings if needed

### Manual Deployment

1. Go to Render dashboard
2. Click your service
3. Click **"Manual Deploy"** → **"Deploy latest commit"**

### Rolling Back

1. Go to **"Events"** tab
2. Find previous successful deployment
3. Click **"Redeploy"**

---

## 📈 Monitoring Your Service

### View Logs

1. Click your service in Render dashboard
2. Go to **"Logs"** tab
3. See real-time application logs

### Health Checks

- Render automatically checks `/api/health` every 5 minutes
- Service will restart if health check fails
- View status in dashboard

### Check Service Status

- **Green**: Running normally
- **Yellow**: Deploying or restarting
- **Red**: Error - check logs

---

## 🎯 Next Steps

### After Successful Deployment

1. ✅ Test all endpoints
2. ✅ Update frontend API URL
3. ✅ Test frontend → backend connection
4. ✅ Set up monitoring (optional)
5. ✅ Configure custom domain (optional, paid)

### Optional Enhancements

1. **Keep Service Warm** (free):
   - Use [cron-job.org](https://cron-job.org) or similar
   - Set to ping `/api/health` every 10 minutes
   - Free service stays warm!

2. **Custom Domain**:
   - Go to Settings → Custom Domain
   - Add your domain
   - Follow DNS setup instructions
   - (Works on free tier!)

3. **Upgrade Considerations**:
   - **Starter ($7/month)**: Always-on, no cold starts
   - **Standard ($25/month)**: More resources, better performance

---

## ✅ Success Checklist

After following this guide, you should have:

- [x] Render account created
- [x] Service deployed and running
- [x] Health endpoint responding
- [x] Environment variables configured
- [x] CORS configured for frontend
- [x] Frontend connected to backend
- [x] Tested TTS generation
- [x] Understand free tier limitations

---

## 📞 Need Help?

### Common Issues

1. **Build taking too long**: Normal for first build (10-15 min)
2. **Service not starting**: Check logs for errors
3. **CORS errors**: Verify CORS_ORIGINS includes frontend URL
4. **Cold starts**: Normal on free tier, or upgrade

### Resources

- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Render Support**: Available in dashboard
- **Your Logs**: Check in Render dashboard → Logs tab

---

## 🎉 Congratulations!

You've successfully deployed your backend to Render! 

Your backend is now:
- ✅ Live and accessible
- ✅ Free to run
- ✅ Automatically deploying from GitHub
- ✅ Ready for production use

**Next**: Deploy your frontend and connect everything together!

---

**Questions?** Check the logs or Render documentation. Happy deploying! 🚀

