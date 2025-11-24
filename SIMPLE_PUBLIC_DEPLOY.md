# Simple Public Deployment Guide

Deploy Natural Speech for FREE so anyone can use it!

## 🎯 Two Simple Options

### Option 1: Vercel (Easiest - Recommended) ⭐
**Free, no credit card needed, takes 5 minutes**

### Option 2: Netlify + Railway
**Also free, slightly more setup**

---

## ✅ Option 1: Deploy to Vercel (Easiest)

### Step 1: Deploy Frontend (2 minutes)

⚠️ **IMPORTANT:** Vercel is for FRONTEND ONLY. Backend goes to Railway (Step 2).

1. Go to: https://vercel.com
2. Click **"Sign up"** → Sign in with GitHub
3. Click **"Add New Project"**
4. Import your repository: `williamDalston/natural-speech`
5. Set these settings:
   - **Root Directory:** `frontend` ⚠️ **CRITICAL - Must be `frontend`**
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build` (or leave default)
   - **Output Directory:** `dist` (or leave default)
6. **Skip environment variable for now** (we'll add it after backend is deployed)
7. Click **"Deploy"**

✅ **Frontend is now live!** (e.g., `https://natural-speech.vercel.app`)

**Note:** If you get a size error, make sure Root Directory is set to `frontend` - this excludes the large backend files.

### Step 2: Deploy Backend (3 minutes)

1. Go to: https://railway.app
2. Click **"Login"** → Sign in with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select: `williamDalston/natural-speech`
5. Railway will detect it's a Python project
6. Set these settings:
   - **Root Directory:** `backend`
   - **Start Command:** `gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`
7. Add Environment Variables (click "Variables" tab):
   ```
   ENVIRONMENT=production
   DEBUG=False
   CORS_ORIGINS=https://natural-speech.vercel.app
   PORT=$PORT
   ```
8. Click **"Deploy"**

✅ **Backend is now live!** (e.g., `https://natural-speech-production.up.railway.app`)

### Step 3: Connect Frontend to Backend (1 minute)

1. Go back to Vercel
2. Go to your project → **Settings** → **Environment Variables**
3. Update `VITE_API_BASE_URL` to your Railway backend URL:
   ```
   VITE_API_BASE_URL=https://natural-speech-production.up.railway.app/api
   ```
4. Click **"Redeploy"**

🎉 **Done! Your app is now public and free!**

---

## ✅ Option 2: Netlify + Railway

### Frontend on Netlify:

1. Go to: https://app.netlify.com
2. Sign in with GitHub
3. Click **"Add new site"** → **"Import an existing project"**
4. Select: `williamDalston/natural-speech`
5. Settings:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`
6. Add environment variable:
   - `VITE_API_BASE_URL` = Your Railway backend URL
7. Click **"Deploy site"**

### Backend on Railway:
(Same as Option 1, Step 2)

---

## 📋 Quick Checklist

- [ ] Sign up for Vercel (free)
- [ ] Deploy frontend to Vercel
- [ ] Sign up for Railway (free)
- [ ] Deploy backend to Railway
- [ ] Update frontend environment variable with backend URL
- [ ] Test your live app!

---

## 🔗 Your Public URLs

After deployment, you'll have:
- **Frontend:** `https://natural-speech.vercel.app`
- **Backend:** `https://your-app.railway.app`

Share these URLs with anyone!

---

## 💡 Tips

1. **Both services are FREE** - No credit card needed
2. **Automatic deployments** - Every push to GitHub auto-deploys
3. **Custom domains** - Add your own domain later (free)
4. **SSL included** - HTTPS automatically enabled

---

## 🆘 Need Help?

- Vercel docs: https://vercel.com/docs
- Railway docs: https://docs.railway.app

---

**That's it! Simple, free, and public! 🚀**

