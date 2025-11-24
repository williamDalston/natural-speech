# Vercel Deployment - Exact Steps

## Step-by-Step Instructions

### Step 1: Go to Vercel Settings

1. Go to: https://vercel.com
2. Sign in with GitHub
3. Click on your project (or create new one)
4. Click **"Settings"** (top menu)

### Step 2: Set Root Directory

1. In Settings, click **"General"** (left sidebar)
2. Scroll down to **"Root Directory"** section
3. You'll see a text field (NOT a dropdown list)
4. **Type exactly this:** `frontend`
   - All lowercase
   - No quotes
   - No spaces
   - Just: `frontend`

5. Click **"Save"**

### Step 3: Configure Build Settings

1. Still in Settings, click **"Build & Development Settings"** (left sidebar)
2. Verify these settings:

   **Build Command:**
   ```
   npm run build
   ```
   (or leave default if it says this)

   **Output Directory:**
   ```
   dist
   ```
   (or leave default if it says this)

   **Install Command:**
   ```
   npm install
   ```
   (or leave default)

3. Click **"Save"**

### Step 4: Redeploy

1. Go to **"Deployments"** tab (top menu)
2. Find your latest deployment
3. Click the **"..."** (three dots) menu
4. Click **"Redeploy"**
5. Make sure it says "Root Directory: frontend" in the deployment

---

## What to Type (Copy & Paste)

**Root Directory field:**
```
frontend
```

That's it! Just the word `frontend` in lowercase.

---

## Visual Guide

```
Vercel Dashboard
  └── Your Project
      └── Settings
          └── General
              └── Root Directory: [type: frontend] ← Type here
```

---

## If You Don't See Root Directory Option

1. Make sure you're in **Settings** → **General**
2. Scroll down - it's below the project name
3. If still not visible, try:
   - Refresh the page
   - Make sure you're the project owner/admin
   - Try creating a new project instead

---

## Alternative: Use vercel.json

If you can't find the Root Directory setting, the `vercel.json` file should handle it automatically. Just make sure it's in your repository (it is!).

Then redeploy and it should work.

---

## Quick Checklist

- [ ] In Vercel Settings → General
- [ ] Root Directory field = `frontend` (typed manually)
- [ ] Clicked Save
- [ ] Redeployed the project
- [ ] Checked deployment logs - should say "Root Directory: frontend"

---

**That's it! Just type `frontend` in the Root Directory field.**

