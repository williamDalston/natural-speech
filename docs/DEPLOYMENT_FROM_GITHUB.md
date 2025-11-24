# Deploying from GitHub Branches

This guide explains how to deploy the Natural Speech project automatically from GitHub branches.

## Overview

The project includes GitHub Actions workflows that automatically:
- ✅ Run tests on every push/PR
- ✅ Build Docker images on main/develop branches
- ✅ Deploy to configured platforms (optional)

## Automatic Deployment Setup

### 1. GitHub Container Registry (Automatic)

Docker images are automatically built and pushed to GitHub Container Registry on every push to `main` or `develop` branches.

**Images are available at:**
- `ghcr.io/williamdalston/natural-speech-backend:latest`
- `ghcr.io/williamdalston/natural-speech-frontend:latest`

**To use these images:**
```bash
# Pull the latest images
docker pull ghcr.io/williamdalston/natural-speech-backend:latest
docker pull ghcr.io/williamdalston/natural-speech-frontend:latest

# Use in docker-compose.yml
services:
  backend:
    image: ghcr.io/williamdalston/natural-speech-backend:latest
  frontend:
    image: ghcr.io/williamdalston/natural-speech-frontend:latest
```

### 2. Deploy to Your Server (Optional)

To automatically deploy to your server when pushing to a branch:

#### Step 1: Add GitHub Secrets

Go to your repository → Settings → Secrets and variables → Actions, and add:

- `DEPLOY_HOST`: Your server IP or hostname
- `DEPLOY_USER`: SSH username (e.g., `ubuntu`, `root`)
- `DEPLOY_SSH_KEY`: Your private SSH key for deployment

#### Step 2: Server Setup

On your server, create the deployment directory:

```bash
# Create directory
sudo mkdir -p /opt/natural-speech
cd /opt/natural-speech

# Clone repository (first time only)
git clone https://github.com/williamDalston/natural-speech.git .

# Copy docker-compose.yml
cp docker-compose.yml docker-compose.prod.yml

# Update docker-compose.prod.yml to use GitHub images
# Edit the image references to use ghcr.io images
```

#### Step 3: Configure docker-compose.prod.yml

```yaml
services:
  backend:
    image: ghcr.io/williamdalston/natural-speech-backend:latest
    # ... rest of config
  
  frontend:
    image: ghcr.io/williamdalston/natural-speech-frontend:latest
    # ... rest of config
```

### 3. Deploy to Vercel (Optional)

For frontend deployment to Vercel:

#### Step 1: Add GitHub Secrets

- `VERCEL_TOKEN`: Your Vercel API token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

#### Step 2: Vercel Setup

1. Install Vercel CLI: `npm i -g vercel`
2. Link your project: `vercel link`
3. Get the IDs from `.vercel/project.json`

The workflow will automatically deploy to Vercel on every push to `main`.

### 4. Deploy to Netlify (Optional)

For frontend deployment to Netlify:

#### Step 1: Add GitHub Secrets

- `NETLIFY_AUTH_TOKEN`: Your Netlify auth token
- `NETLIFY_SITE_ID`: Your Netlify site ID

#### Step 2: Netlify Setup

1. Create a site on Netlify
2. Get your site ID from Netlify dashboard
3. Generate an auth token from Netlify settings

The workflow will automatically deploy to Netlify on every push to `main`.

## Manual Deployment from Branch

If you prefer manual deployment:

### Option 1: Clone and Deploy

```bash
# Clone the repository
git clone https://github.com/williamDalston/natural-speech.git
cd natural-speech

# Checkout specific branch
git checkout main  # or develop, or any branch

# Deploy with Docker Compose
docker-compose up -d
```

### Option 2: Use GitHub Images

```bash
# Pull latest images from GitHub Container Registry
docker pull ghcr.io/williamdalston/natural-speech-backend:main
docker pull ghcr.io/williamdalston/natural-speech-frontend:main

# Tag for local use
docker tag ghcr.io/williamdalston/natural-speech-backend:main natural-speech-backend:latest
docker tag ghcr.io/williamdalston/natural-speech-frontend:main natural-speech-frontend:latest

# Run with docker-compose
docker-compose up -d
```

### Option 3: Build from Source

```bash
# Clone repository
git clone https://github.com/williamDalston/natural-speech.git
cd natural-speech

# Checkout branch
git checkout main

# Build and run
docker-compose build
docker-compose up -d
```

## Branch Strategy

### Main Branch
- **Purpose**: Production-ready code
- **Deployment**: Automatic to production (if configured)
- **Images**: Tagged as `latest`

### Develop Branch
- **Purpose**: Development/staging code
- **Deployment**: Automatic to staging (if configured)
- **Images**: Tagged with branch name

### Feature Branches
- **Purpose**: New features
- **Deployment**: Manual only
- **Images**: Tagged with branch name and SHA

## Environment Variables

When deploying from GitHub, ensure environment variables are set:

### Backend (.env)
```bash
ENVIRONMENT=production
DEBUG=False
CORS_ORIGINS=https://yourdomain.com
RATE_LIMIT_ENABLED=True
RATE_LIMIT_PER_MINUTE=60
```

### Frontend (build-time)
```bash
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

## Verification

After deployment, verify everything works:

```bash
# Check backend health
curl https://api.yourdomain.com/api/health

# Check frontend
curl https://yourdomain.com

# Check Docker containers
docker-compose ps

# Check logs
docker-compose logs -f
```

## Troubleshooting

### Images not building
- Check GitHub Actions workflow runs
- Verify Dockerfile syntax
- Check for build errors in Actions logs

### Deployment not triggering
- Ensure you're pushing to `main` or `develop`
- Check workflow file syntax
- Verify GitHub Actions are enabled

### Server deployment fails
- Verify SSH key is correct
- Check server has Docker installed
- Ensure user has permissions
- Check server logs: `journalctl -u docker`

## Security Notes

1. **Never commit secrets** - Use GitHub Secrets
2. **Use SSH keys** - Not passwords for deployment
3. **Limit access** - Only authorized users should have deploy access
4. **Monitor deployments** - Review deployment logs regularly

## Next Steps

1. Set up GitHub Secrets for your deployment target
2. Configure your server/environment
3. Push to `main` branch to trigger deployment
4. Monitor GitHub Actions for deployment status

---

**Note**: Automatic deployment requires GitHub Actions to be enabled and proper secrets configured. Without secrets, images will still be built and pushed to GitHub Container Registry, but actual deployment won't happen.

