# Render Quick Start - What to Click

## What You See vs What to Click

### On Render Dashboard

When you're on the Render dashboard, you'll see:

1. **"New +" button** (top right, blue button)
   - ✅ **CLICK THIS**
   - Then select **"Web Service"** from dropdown

2. **"New Web Service"** page appears

---

## Step-by-Step: What to Do

### Step 1: Click "New +"

- You'll see a button that says **"New +"** (usually top right)
- Click it
- A dropdown menu appears

### Step 2: Select "Web Service"

- From the dropdown, click **"Web Service"**
- NOT "Static Site" (that's for frontend)
- NOT "Background Worker"
- ✅ **Click "Web Service"**

---

## Step 3: Connect GitHub Repository

**You do NOT provide a URL here!** Instead:

1. **If GitHub is already connected:**
   - You'll see a list of your GitHub repositories
   - Find and **click on your repository** (e.g., `natural-speech`)
   - Continue to Step 4

2. **If GitHub is NOT connected yet:**
   - You'll see a button like "Connect GitHub" or "Configure GitHub"
   - Click it
   - Authorize Render to access your GitHub
   - Then you'll see your repositories
   - Click on your repository

---

## Step 4: Configure Settings

After selecting your repository, you'll see a form:

### Fill Out These Fields:

**Name**:
```
natural-speech-backend
```
*(This is what your service will be called - you can change it)*

**Region**:
- Dropdown menu - pick closest to you
- Example: "Oregon (US West)" or "Frankfurt (EU Central)"

**Branch**:
```
main
```
*(Or whatever your default branch is)*

**Root Directory**:
```
backend
```
⚠️ **CRITICAL**: Type `backend` here (this tells Render where your backend code is)

**Runtime**:
- Dropdown menu
- Select: **"Docker"**

**Build Command**:
- **LEAVE EMPTY** or delete any text here
- Docker handles the build

**Start Command**:
- **LEAVE EMPTY** or delete any text here
- Docker handles the start

**Plan**:
- Select: **"Free"**

**Health Check Path**:
```
/api/health
```

---

## Step 5: Environment Variables

Scroll down to "Environment Variables" section.

Click "Add Environment Variable" button and add these one by one:

| Key | Value |
|-----|-------|
| `ENVIRONMENT` | `production` |
| `DEBUG` | `false` |
| `HOST` | `0.0.0.0` |
| `PORT` | `10000` |
| `WORKERS` | `1` |
| `LOG_LEVEL` | `INFO` |
| `RATE_LIMIT_ENABLED` | `true` |
| `RATE_LIMIT_PER_MINUTE` | `60` |
| `TEMP_DIR` | `/tmp/natural_speech` |

(You'll add `CORS_ORIGINS` later after deployment)

---

## Step 6: Create Service

1. **Review everything** (especially Root Directory = `backend`)
2. Scroll to bottom
3. Click **"Create Web Service"** button
4. Wait for build (10-15 minutes first time)

---

## What URL Will You Get?

**Render will CREATE a URL for you!**

After deployment completes, you'll see:
- **Service URL**: `https://natural-speech-backend.onrender.com`
  *(Or whatever you named your service)*

This URL is automatically generated based on your service name.

---

## Summary

✅ **Click**: "New +" → "Web Service"
✅ **Connect**: Your GitHub repository (click on it from the list)
✅ **Set**: Root Directory = `backend`
✅ **Set**: Runtime = Docker
✅ **Add**: Environment variables (see table above)
✅ **Click**: "Create Web Service"
✅ **Wait**: For deployment (watch logs)
✅ **Get**: Your URL automatically (shown after deployment)

---

## Common Confusion

### ❌ "Do I click new git webservice page?"
- **Answer**: Click "New +" → "Web Service" (not "git webservice")

### ❌ "What URL do I give it?"
- **Answer**: You DON'T give a URL! You connect your GitHub repository instead
- Render will GIVE you a URL after deployment

### ✅ The Flow:
1. Click "New +" → "Web Service"
2. Click your GitHub repository from the list
3. Configure settings
4. Render builds and deploys
5. Render gives you a URL automatically

---

## Still Confused?

**Just follow this order:**

1. ✅ Click "New +" button
2. ✅ Click "Web Service"
3. ✅ Click your repository name (e.g., "natural-speech")
4. ✅ Set Root Directory to `backend`
5. ✅ Set Runtime to `Docker`
6. ✅ Add environment variables
7. ✅ Click "Create Web Service"
8. ✅ Wait for deployment
9. ✅ Copy the URL that Render gives you

That's it! No URLs to provide - just connect your GitHub repo and configure it.

