# Fix: Vercel Serverless Function Size Error

## Problem
Error: "A Serverless Function has exceeded the unzipped maximum size of 250 MB"

This happens because Vercel tries to include backend files (which have large ML models).

## Solution

### ✅ Correct Setup (Frontend Only on Vercel)

**Vercel should ONLY deploy the frontend, NOT the backend.**

### Step 1: Check Vercel Settings

1. Go to your Vercel project settings
2. Go to **Settings** → **General**
3. **CRITICAL:** Set **Root Directory** to: `frontend`
   - This tells Vercel to only look at the frontend folder
   - Backend files will be ignored

### Step 2: Verify Build Settings

In Vercel project settings → **Build & Development Settings**:

- **Root Directory:** `frontend`
- **Build Command:** `npm run build` (or leave default)
- **Output Directory:** `dist` (or leave default)
- **Install Command:** `npm install` (or leave default)

### Step 3: Redeploy

1. Go to **Deployments** tab
2. Click the **"..."** menu on latest deployment
3. Click **"Redeploy"**
4. Make sure it uses the `frontend` root directory

## Alternative: Use Netlify Instead

If Vercel still has issues, use Netlify (also free):

1. Go to: https://app.netlify.com
2. Sign in with GitHub
3. **Add new site** → **Import from Git**
4. Select your repository
5. Settings:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`
6. Deploy!

Netlify handles large repos better than Vercel.

## Why This Happens

- Your backend has large ML model files (310MB+)
- Vercel serverless functions have a 250MB limit
- **Solution:** Deploy backend separately on Railway (which has no size limit)

## Correct Architecture

```
Frontend (Vercel/Netlify) → Backend (Railway)
     ↓                           ↓
  React App              FastAPI + ML Models
  (Small, fast)          (Large models OK)
```

## Quick Fix Checklist

- [ ] Root Directory in Vercel = `frontend`
- [ ] Backend deployed separately on Railway
- [ ] Frontend environment variable points to Railway backend
- [ ] Redeploy after fixing settings

---

**Remember:** Vercel = Frontend only. Railway = Backend only. They work together!

