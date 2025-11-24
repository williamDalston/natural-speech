# Environment Variables Configuration

This document describes all environment variables used in the frontend application.

## Required Variables

### `VITE_API_BASE_URL`
- **Description**: Base URL for the backend API
- **Type**: String
- **Default**: `http://localhost:8000/api` (development)
- **Examples**:
  - Development: `http://localhost:8000/api`
  - Production: `https://api.example.com/api`
  - Relative path (same domain): `/api`

## Environment Files

The application supports different environment files:

- `.env` - Default environment variables (loaded in all environments)
- `.env.local` - Local overrides (gitignored, loaded in all environments)
- `.env.development` - Development environment variables
- `.env.development.local` - Local development overrides (gitignored)
- `.env.production` - Production environment variables
- `.env.production.local` - Local production overrides (gitignored)

## Usage

### Development

Create a `.env.development` file:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### Production

Set environment variables when building:

```bash
VITE_API_BASE_URL=https://api.example.com/api npm run build
```

Or create a `.env.production` file:

```env
VITE_API_BASE_URL=https://api.example.com/api
```

### Docker

Pass build arguments:

```bash
docker build --build-arg VITE_API_BASE_URL=/api -t natural-speech-frontend .
```

Or use environment variables in docker-compose:

```yaml
environment:
  - VITE_API_BASE_URL=/api
```

## Important Notes

1. **Vite Prefix**: All environment variables must be prefixed with `VITE_` to be exposed to the client-side code.

2. **Build Time**: Environment variables are embedded at build time, not runtime. You need to rebuild the application to change them.

3. **Security**: Never commit sensitive information like API keys or secrets in environment files. Use secrets management in production.

4. **Gitignore**: `.env.local` and `.env.*.local` files are gitignored for security.

## Troubleshooting

### Environment variables not working?

1. Make sure variables are prefixed with `VITE_`
2. Restart the dev server after adding new variables
3. Rebuild the application for production
4. Check that the variable name matches exactly (case-sensitive)

### Production build uses wrong API URL?

1. Ensure `.env.production` exists with correct values
2. Or pass environment variables during build: `VITE_API_BASE_URL=... npm run build`
3. For Docker, use build arguments

