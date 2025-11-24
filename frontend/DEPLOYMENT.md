# Deployment Guide

This guide covers deploying the Natural Speech frontend to various platforms.

## Prerequisites

- Built frontend application (`npm run build`)
- Environment variables configured
- Backend API accessible

## Docker Deployment

### Build Image

```bash
docker build -t natural-speech-frontend .
```

Or with custom API URL:

```bash
docker build --build-arg VITE_API_BASE_URL=https://api.example.com/api -t natural-speech-frontend .
```

### Run Container

```bash
docker run -p 3000:80 natural-speech-frontend
```

### Docker Compose

```bash
# Set environment variable
export VITE_API_BASE_URL=https://api.example.com/api

# Start services
docker-compose up -d
```

## Static Hosting

### Vercel

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Set environment variables in Vercel dashboard:
   - `VITE_API_BASE_URL`: Your API URL

### Netlify

1. Install Netlify CLI:
   ```bash
   npm i -g netlify-cli
   ```

2. Build command:
   ```bash
   npm run build
   ```

3. Publish directory:
   ```
   dist
   ```

4. Set environment variables in Netlify dashboard

### GitHub Pages

1. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Add to package.json:
   ```json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     },
     "homepage": "https://username.github.io/natural-speech"
   }
   ```

3. Deploy:
   ```bash
   npm run deploy
   ```

## Nginx Configuration

For custom server deployment, use the provided `nginx.conf`:

```bash
# Copy built files
cp -r dist/* /var/www/html/

# Copy nginx config
cp nginx.conf /etc/nginx/sites-available/natural-speech
ln -s /etc/nginx/sites-available/natural-speech /etc/nginx/sites-enabled/

# Test and reload
nginx -t
systemctl reload nginx
```

### Reverse Proxy Setup

If your backend is on a different server, configure nginx as a reverse proxy:

```nginx
location /api/ {
    proxy_pass http://backend-server:8000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Then set `VITE_API_BASE_URL=/api` in your build.

## Environment-Specific Builds

### Development
```bash
VITE_API_BASE_URL=http://localhost:8000/api npm run build
```

### Staging
```bash
VITE_API_BASE_URL=https://staging-api.example.com/api npm run build
```

### Production
```bash
VITE_API_BASE_URL=https://api.example.com/api npm run build
```

## CI/CD Deployment

The GitHub Actions workflow automatically:
- Lints code on PRs
- Runs tests
- Builds application
- Creates Docker images (on main/develop branches)
- Generates bundle analysis (on PRs)

### Manual Deployment

```bash
# Install dependencies
npm ci

# Run tests
npm run test -- --run

# Build
VITE_API_BASE_URL=https://api.example.com/api npm run build

# Deploy dist/ directory to your hosting provider
```

## Health Checks

The application includes a health check endpoint:

- Docker: `HEALTHCHECK` in Dockerfile
- Nginx: `/health` endpoint in nginx.conf
- Manual: `curl http://your-domain/health`

## Performance Optimization

### Before Deployment

1. **Enable Gzip**: Configured in nginx.conf
2. **Cache Headers**: Set in nginx.conf
3. **CDN**: Consider using CDN for static assets
4. **Service Worker**: Automatically enabled in production builds

### Monitoring

Consider adding:
- Error tracking (Sentry, LogRocket)
- Analytics (Google Analytics, Plausible)
- Performance monitoring (Web Vitals)

## Troubleshooting

### Build fails

1. Check Node.js version (20+ recommended)
2. Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
3. Check environment variables

### API connection issues

1. Verify `VITE_API_BASE_URL` is set correctly
2. Check CORS settings on backend
3. Ensure backend is accessible from frontend domain

### Service worker not working

1. Serve over HTTPS (required for service workers)
2. Check browser console for errors
3. Clear browser cache and reload

## Security Checklist

- [ ] Environment variables not exposed in client code
- [ ] HTTPS enabled in production
- [ ] Security headers configured (nginx.conf)
- [ ] CORS properly configured on backend
- [ ] Content Security Policy (CSP) headers set
- [ ] Regular dependency updates

