# Vercel Frontend Deployment Checklist

Quick checklist to verify your frontend is deployed correctly on Vercel.

## Your Frontend URL
🌐 **https://natural-speech.vercel.app/**

---

## ✅ Verification Checklist

### 1. Frontend is Accessible
- [ ] Can access https://natural-speech.vercel.app/
- [ ] Page loads (even if showing errors)
- [ ] No 404 or blank page

### 2. Environment Variables Set

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Required Variable**:
- [ ] `VITE_API_BASE_URL` is set
- [ ] Value: `https://your-backend.onrender.com/api`
  *(Replace with your actual Render backend URL)*

### 3. Backend is Running

Check your Render backend:
- [ ] Backend is deployed and running
- [ ] Health check works: `https://your-backend.onrender.com/api/health`
- [ ] Backend URL copied

### 4. CORS Configured

On Render backend:
- [ ] `CORS_ORIGINS` environment variable set
- [ ] Value includes: `https://natural-speech.vercel.app`
  *(No trailing slash!)*
- [ ] Backend restarted after CORS change

---

## 🔧 If Frontend Shows Errors

### Common Issues

#### 1. API Connection Error
**Symptom**: "Failed to fetch" or "Network error"

**Fix**:
1. Verify `VITE_API_BASE_URL` in Vercel environment variables
2. Verify backend is running
3. Check CORS_ORIGINS includes frontend URL
4. Redeploy frontend after changing env vars

#### 2. Blank Page
**Symptom**: Page loads but shows nothing

**Fix**:
1. Check browser console (F12) for errors
2. Check Vercel build logs for errors
3. Verify build completed successfully

#### 3. 404 Errors
**Symptom**: Routes not working

**Fix**:
1. Verify `vercel.json` has rewrites configured
2. Check that build output is `dist` folder

---

## 📋 Quick Fix Steps

### Step 1: Set Environment Variable in Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click your project: `natural-speech` (or similar)
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://your-backend-name.onrender.com/api`
     *(Replace with your actual Render backend URL)*
   - **Environment**: Production, Preview, Development (check all)
6. Click **Save**

### Step 2: Redeploy Frontend

After adding environment variable:

1. Go to **Deployments** tab
2. Click **"..."** (three dots) on latest deployment
3. Click **"Redeploy"**
4. Wait for redeployment (2-3 minutes)

### Step 3: Verify Backend CORS

On Render:

1. Go to your backend service
2. **Environment** tab
3. Find or add `CORS_ORIGINS`
4. Value: `https://natural-speech.vercel.app`
5. Save (service will restart)
6. Wait 1-2 minutes

### Step 4: Test

1. Open https://natural-speech.vercel.app/
2. Open browser DevTools (F12)
3. Go to **Console** tab
4. Try to use the app
5. Check for errors

---

## 🔍 Debugging

### Check Browser Console

1. Open https://natural-speech.vercel.app/
2. Press **F12** (or Right-click → Inspect)
3. Go to **Console** tab
4. Look for errors

**Common errors**:
- `Failed to fetch` → Backend not accessible or CORS issue
- `404` → Wrong API URL
- `TypeError` → JavaScript error

### Check Network Requests

1. Open DevTools (F12)
2. Go to **Network** tab
3. Try using the app
4. Look for API requests:
   - Should go to your Render backend
   - Should return 200 status (not 404 or CORS error)

### Check Vercel Build Logs

1. Go to Vercel dashboard
2. Click your project
3. Go to **Deployments** tab
4. Click on a deployment
5. Check build logs for errors

---

## ✅ Success Indicators

Your frontend is working correctly when:

- ✅ Page loads without errors
- ✅ Can see the UI (Text to Speech interface)
- ✅ No CORS errors in console
- ✅ API requests succeed (check Network tab)
- ✅ Can load voices list
- ✅ Can generate speech (if backend is running)

---

## 🚀 Next Steps

Once everything works:

1. ✅ Test TTS generation
2. ✅ Test Avatar generation (if backend supports it)
3. ✅ Verify all features work
4. ✅ Share your app!

---

## Need Help?

**Check**:
- Vercel build logs
- Browser console errors
- Render backend logs
- Network tab in DevTools

**Verify**:
- Environment variables are set correctly
- Backend is running
- CORS is configured
- Frontend was redeployed after env var changes

