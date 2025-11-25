# Deployment Platform Guides

This document provides platform-specific deployment instructions for the Natural Speech frontend.

## Table of Contents

- [Vercel](#vercel)
- [Netlify](#netlify)
- [Railway](#railway)
- [Docker](#docker)
- [GitHub Pages](#github-pages)
- [Self-Hosted (Nginx)](#self-hosted-nginx)

---

## Vercel

### Automatic Deployment

1. Connect your GitHub repository to Vercel
2. Vercel will automatically detect the Vite project
3. Configure environment variables in Vercel dashboard:
   - `VITE_API_BASE_URL`: Your backend API URL

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Configuration

The `vercel.json` file is already configured with:
- Build command: `npm run build`
- Output directory: `dist`
- Framework: `vite`
- SPA rewrites for React Router

### Environment Variables

Set in Vercel dashboard:
- `VITE_API_BASE_URL` - Backend API URL

---

## Netlify

### Automatic Deployment

1. Connect your GitHub repository to Netlify
2. Netlify will use `netlify.toml` configuration
3. Set environment variables in Netlify dashboard

### Manual Deployment

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

### Configuration

The `netlify.toml` file is configured with:
- Build command: `npm run build`
- Publish directory: `frontend/dist`
- SPA redirects for React Router
- Node.js version: 20

### Environment Variables

Set in Netlify dashboard:
- `VITE_API_BASE_URL` - Backend API URL

---

## Railway

### Setup

1. **Connect Repository**:
   - Go to [Railway](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

2. **Configure Service**:
   - Railway will auto-detect the project
   - Use the `railway.json` configuration file
   - Or configure manually:
     - **Build Command**: `cd frontend && npm ci && npm run build`
     - **Start Command**: `cd frontend && npx serve -s dist -l $PORT`
     - **Root Directory**: Leave empty (runs from project root)

3. **Environment Variables**:
   - `VITE_API_BASE_URL`: Your backend API URL
   - `PORT`: Railway sets this automatically

### Manual Configuration (if needed)

If auto-detection doesn't work:

1. Create a new service
2. Set source to your GitHub repo
3. Configure:
   - **Build**: `cd frontend && npm ci && npm run build`
   - **Start**: `cd frontend && npx serve -s dist -l $PORT`
   - **Root**: Empty or `frontend/`

### Alternative: Using Docker on Railway

1. Use the included `Dockerfile`:
   - Railway can deploy directly from Dockerfile
   - No additional configuration needed

### Railway Plans

- **Trial**: Limited resources (expires after period)
- **Hobby Plan**: $5/month
  - 8 GB RAM / 8 vCPU per service
  - 7-day log history
  - Global regions
  - Community support

### Troubleshooting Railway

**Build fails**:
- Ensure `package.json` is in `frontend/` directory
- Check that Node.js version matches (20+)
- Verify build command paths are correct

**Port issues**:
- Railway sets `$PORT` automatically
- Use `npx serve -s dist -l $PORT` in start command
- Or use Docker which handles ports automatically

**Environment variables**:
- Set `VITE_API_BASE_URL` in Railway dashboard
- Rebuild after changing environment variables

---

## Docker

### Build

```bash
cd frontend
docker build -t natural-speech-frontend .
```

### Run

```bash
docker run -p 3000:80 natural-speech-frontend
```

### With Environment Variables

```bash
docker build --build-arg VITE_API_BASE_URL=https://api.example.com/api -t natural-speech-frontend .
```

### Docker Compose

```bash
cd frontend
docker-compose up
```

---

## GitHub Pages

### Setup

1. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Add to `package.json`:
   ```json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     },
     "homepage": "https://username.github.io/natural-speech"
   }
   ```

3. Set base in `vite.config.js`:
   ```js
   export default defineConfig({
     base: '/natural-speech/',
     // ... rest of config
   })
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

### Note

GitHub Pages is a static host and won't work with backend APIs that require CORS. Use only if your backend allows cross-origin requests from GitHub Pages domain.

---

## Self-Hosted (Nginx)

### 1. Build Application

```bash
cd frontend
npm run build
```

### 2. Copy Files

```bash
cp -r dist/* /var/www/html/
```

### 3. Configure Nginx

```bash
cp nginx.conf /etc/nginx/sites-available/natural-speech
ln -s /etc/nginx/sites-available/natural-speech /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 4. Set Environment Variables

Build with production API URL:
```bash
VITE_API_BASE_URL=https://api.example.com/api npm run build
```

---

## Comparison

| Platform | Free Tier | Build Time | Ease of Setup | Best For |
|----------|-----------|------------|---------------|----------|
| Vercel | Yes | Fast | ⭐⭐⭐⭐⭐ | Quick deployment, excellent DX |
| Netlify | Yes | Fast | ⭐⭐⭐⭐⭐ | Similar to Vercel, great features |
| Railway | Trial | Medium | ⭐⭐⭐⭐ | Full-stack apps, Docker support |
| Docker | - | Medium | ⭐⭐⭐ | Production, control, scalability |
| GitHub Pages | Yes | Fast | ⭐⭐⭐ | Simple static sites, open source |
| Self-Hosted | - | - | ⭐⭐ | Full control, custom requirements |

---

## Environment Variables Summary

All platforms require:

- `VITE_API_BASE_URL`: Backend API URL
  - Development: `http://localhost:8000/api`
  - Production: `https://api.example.com/api`
  - Same domain: `/api`

---

## Recommended Setup

1. **Development**: Local with `npm run dev`
2. **Staging**: Vercel or Netlify (free, fast)
3. **Production**: 
   - Railway (if backend is also on Railway)
   - Docker on VPS (for full control)
   - Vercel/Netlify (for simplicity)

---

## Troubleshooting

### Build Fails

- Check Node.js version (20+)
- Clear `node_modules` and reinstall
- Verify all dependencies are in `package.json`

### API Connection Issues

- Verify `VITE_API_BASE_URL` is set correctly
- Check CORS settings on backend
- Ensure backend is accessible from frontend domain

### Routing Issues (404)

- Ensure SPA redirects are configured
- Check `index.html` is served for all routes
- Verify server configuration

---

For more details, see [DEPLOYMENT.md](./DEPLOYMENT.md)

