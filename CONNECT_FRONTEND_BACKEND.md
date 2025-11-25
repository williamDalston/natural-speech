# Connect Frontend to Backend - Step by Step

Complete guide to connect your frontend to your Render backend.

---

## Step 1: Get Your Backend URL from Render

### After Backend Deployment

1. **Go to Render Dashboard**: [dashboard.render.com](https://dashboard.render.com)
2. **Click on your service** (e.g., `natural-speech-backend`)
3. **Find your URL**: At the top, you'll see something like:
   ```
   https://natural-speech-backend.onrender.com
   ```
4. **Copy this URL** - you'll need it for the frontend

✅ **Backend URL example**: `https://natural-speech-backend.onrender.com`

---

## Step 2: Configure CORS on Backend

Before connecting the frontend, you need to allow it to connect.

### On Render Dashboard:

1. **Click your backend service**
2. Go to **"Environment"** tab
3. Click **"Add Environment Variable"**
4. Add:
   - **Key**: `CORS_ORIGINS`
   - **Value**: `https://your-frontend-url.vercel.app,https://your-frontend-url.netlify.app`
     *(We'll update this after frontend is deployed)*

**For now, add a placeholder:**
```
CORS_ORIGINS=https://placeholder-frontend.com
```

5. Click **"Save Changes"**
6. Render will automatically restart your service

⏰ **Wait 1-2 minutes** for restart to complete.

---

## Step 3: Deploy Frontend (Vercel or Netlify)

Choose one platform:

### Option A: Deploy to Vercel (Recommended)

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign up/Login** with GitHub
3. **Click "Add New..." → "Project"**
4. **Import your GitHub repository**
5. **Configure Project**:
   - **Framework Preset**: Vite (auto-detected)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto-filled)
   - **Output Directory**: `dist` (auto-filled)

6. **Environment Variables**:
   - Click **"Environment Variables"**
   - Add:
     - **Key**: `VITE_API_BASE_URL`
     - **Value**: `https://your-backend-name.onrender.com/api`
       *(Replace with your actual Render backend URL)*
   - Click **"Add"**

7. **Deploy**:
   - Click **"Deploy"** button
   - Wait for deployment (2-3 minutes)

8. **Get Frontend URL**:
   - After deployment, Vercel gives you a URL like:
     ```
     https://natural-speech-frontend.vercel.app
     ```

✅ **Frontend deployed!**

---

### Option B: Deploy to Netlify

1. **Go to [netlify.com](https://netlify.com)**
2. **Sign up/Login** with GitHub
3. **Click "Add new site" → "Import an existing project"**
4. **Connect to GitHub** and select your repository
5. **Configure build settings**:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`

6. **Environment Variables**:
   - Go to **"Site settings" → "Environment variables"**
   - Click **"Add a variable"**
   - Add:
     - **Key**: `VITE_API_BASE_URL`
     - **Value**: `https://your-backend-name.onrender.com/api`
       *(Replace with your actual Render backend URL)*
   - Click **"Save"**

7. **Deploy**:
   - Click **"Deploy site"** (or trigger redeploy)
   - Wait for deployment

8. **Get Frontend URL**:
   - After deployment, Netlify gives you a URL like:
     ```
     https://natural-speech-frontend.netlify.app
     ```

✅ **Frontend deployed!**

---

## Step 4: Update CORS_ORIGINS on Backend

Now that your frontend is deployed, update CORS to allow it:

### On Render Dashboard:

1. **Go to your backend service**
2. **Environment tab**
3. **Find `CORS_ORIGINS` variable**
4. **Edit it** (click the pencil/edit icon)
5. **Update value** with your actual frontend URL:
   ```
   https://your-frontend.vercel.app
   ```
   Or if multiple:
   ```
   https://your-frontend.vercel.app,https://your-frontend.netlify.app
   ```
   ⚠️ **Important**: 
   - No trailing slashes!
   - Separate multiple URLs with commas (no spaces)
   - Must use `https://` (not `http://`)

6. **Save Changes**
7. **Wait for service restart** (1-2 minutes)

✅ **CORS configured!**

---

## Step 5: Test the Connection

### Test Backend

1. **Open browser**
2. **Visit**: `https://your-backend.onrender.com/api/health`
3. **Should see**: `{"status":"healthy","timestamp":"...","version":"1.0.0"}`

✅ **Backend is working!**

### Test Frontend → Backend Connection

1. **Open your frontend URL** (from Vercel/Netlify)
2. **Open browser DevTools** (F12 or Right-click → Inspect)
3. **Go to Console tab**
4. **Try to generate speech** in your app
5. **Check for errors**:
   - ❌ CORS error = CORS_ORIGINS not set correctly
   - ❌ 404 error = Wrong API URL
   - ❌ Network error = Backend might be down

### Test Voices Endpoint

In browser console (on your frontend page), try:
```javascript
fetch('https://your-backend.onrender.com/api/voices')
  .then(r => r.json())
  .then(console.log)
```

Should return list of voices.

✅ **Connection working!**

---

## Troubleshooting

### CORS Errors

**Error**: `Access to fetch at '...' has been blocked by CORS policy`

**Solutions**:
1. ✅ Verify `CORS_ORIGINS` includes your frontend URL exactly
2. ✅ No trailing slashes: `https://app.vercel.app` (not `https://app.vercel.app/`)
3. ✅ Must match exactly (including `https://`)
4. ✅ Restart backend after changing CORS_ORIGINS
5. ✅ Check browser console for exact error message

**Format example**:
```
✅ Correct: https://my-app.vercel.app
❌ Wrong: https://my-app.vercel.app/
❌ Wrong: http://my-app.vercel.app
❌ Wrong: my-app.vercel.app
```

---

### 404 Errors

**Error**: `404 Not Found` when calling API

**Solutions**:
1. ✅ Verify API URL ends with `/api`: 
   ```
   https://backend.onrender.com/api
   ```
2. ✅ Check endpoint path: `/api/voices`, `/api/tts`, etc.
3. ✅ Full URL example:
   ```
   https://backend.onrender.com/api/voices
   ```

---

### Backend Not Responding

**Error**: Connection timeout or `Failed to fetch`

**Solutions**:
1. ✅ Check if backend is running in Render dashboard
2. ✅ Check Render logs for errors
3. ✅ Verify backend URL is correct
4. ✅ First request after inactivity takes 30-60 seconds (cold start)

---

### Environment Variable Not Working

**Issue**: Frontend still using old API URL

**Solutions**:
1. ✅ Verify environment variable is set in deployment platform
2. ✅ **Redeploy frontend** after adding/changing environment variables
   - Vercel: Go to Deployments → Click "..." → Redeploy
   - Netlify: Site settings → Build & deploy → Trigger deploy
3. ✅ Environment variables are embedded at **build time**, not runtime
4. ✅ Check variable name: Must be `VITE_API_BASE_URL` (with `VITE_` prefix)

---

## Quick Reference

### Backend URL Format
```
https://your-service-name.onrender.com
```

### API Endpoints
```
https://your-service-name.onrender.com/api/health
https://your-service-name.onrender.com/api/voices
https://your-service-name.onrender.com/api/tts
https://your-service-name.onrender.com/api/avatar
```

### Frontend Environment Variable
```
VITE_API_BASE_URL=https://your-service-name.onrender.com/api
```

### Backend CORS_ORIGINS
```
https://your-frontend.vercel.app
```
(Or Netlify URL, or both separated by commas)

---

## Complete Setup Checklist

### Backend (Render)
- [x] Backend deployed and running
- [x] Backend URL copied
- [x] CORS_ORIGINS set (placeholder or final URL)
- [x] Health endpoint working: `/api/health`

### Frontend (Vercel/Netlify)
- [x] Frontend deployed
- [x] Environment variable `VITE_API_BASE_URL` set
- [x] Frontend URL copied
- [x] Frontend redeployed after adding env variable

### Connection
- [x] CORS_ORIGINS updated with actual frontend URL
- [x] Backend restarted after CORS update
- [x] Tested connection from frontend
- [x] Tested TTS generation
- [x] No errors in browser console

---

## Summary

1. ✅ Get backend URL from Render
2. ✅ Deploy frontend to Vercel/Netlify
3. ✅ Set `VITE_API_BASE_URL` in frontend
4. ✅ Update `CORS_ORIGINS` in backend with frontend URL
5. ✅ Test everything!

---

## Need Help?

**Common Issues**:
- **CORS errors**: Check CORS_ORIGINS format
- **404 errors**: Verify API URL ends with `/api`
- **Not working**: Redeploy frontend after changing env vars
- **Cold starts**: First request after 15 min inactivity is slow (normal)

**Check**:
- Render logs for backend errors
- Browser console for frontend errors
- Network tab in DevTools to see requests

Everything should work now! 🎉

