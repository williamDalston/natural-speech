# Natural Speech Frontend

A modern React application for AI-powered text-to-speech and avatar generation.

## Features

- 🎤 Text-to-Speech generation with multiple voices
- 🎬 Avatar video generation with SadTalker
- 🎨 Modern UI with Tailwind CSS and Framer Motion
- 📱 Responsive design
- ⚡ Optimized performance with code splitting and lazy loading
- 🔄 Automatic retry logic with exponential backoff
- 📊 Progress tracking for long-running operations
- 🚨 Comprehensive error handling with user-friendly messages
- 🔔 Toast notifications for user feedback
- 💾 State persistence with localStorage
- 🌐 Offline detection and handling
- 🚀 Production-ready with Docker support
- ✅ Full test coverage with Vitest
- 📝 Code quality tools (ESLint, Prettier)

## Prerequisites

- Node.js 18+ and npm (Node.js 20+ recommended)
- Backend API running (see backend README)

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables** (see [ENV_TEMPLATE.md](./ENV_TEMPLATE.md)):
   ```bash
   cp .env.example .env.development
   # Edit .env.development with your API URL
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open browser**:
   Navigate to `http://localhost:5173`

## Development

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_ENV=development
```

### Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Building for Production

### Standard Build

```bash
npm run build
```

### Build with Analysis

To analyze bundle size:

```bash
npm run build:analyze
```

This will generate a `dist/stats.html` file with detailed bundle analysis.

### Production Build Script

Use the provided build script:

```bash
./build.sh
```

Or with custom API URL:

```bash
VITE_API_BASE_URL=https://api.example.com/api ./build.sh
```

## Docker

### Build Docker Image

```bash
docker build -t natural-speech-frontend .
```

Or with build arguments:

```bash
docker build --build-arg VITE_API_BASE_URL=/api -t natural-speech-frontend .
```

### Run with Docker

```bash
docker run -p 3000:80 natural-speech-frontend
```

### Docker Compose

```bash
docker-compose up
```

Or with custom API URL:

```bash
VITE_API_BASE_URL=https://api.example.com/api docker-compose up
```

## Production Deployment

### Environment Variables

Set the following environment variables for production:

- `VITE_API_BASE_URL`: Your production API URL (e.g., `https://api.example.com/api`)

### Nginx Configuration

The included `nginx.conf` is optimized for production with:
- Gzip compression
- Static asset caching
- Security headers
- SPA routing support

### Deployment Steps

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy the `dist` folder to your web server

3. Configure your web server to use the provided `nginx.conf` or equivalent

4. Ensure environment variables are set correctly

## Project Structure

```
frontend/
├── src/
│   ├── components/      # React components
│   ├── context/         # React context providers
│   ├── hooks/           # Custom React hooks
│   ├── test/            # Unit tests
│   ├── api.js          # API client
│   ├── App.jsx         # Main application component
│   └── main.jsx        # Application entry point
├── e2e/                 # E2E tests (Playwright)
├── public/             # Static assets
├── dist/               # Production build output
├── Dockerfile          # Docker configuration
├── nginx.conf          # Nginx configuration
├── playwright.config.js # Playwright configuration
├── vite.config.js      # Vite configuration
└── package.json        # Dependencies
```

## Performance Optimizations

- **Code Splitting**: Automatic code splitting with manual chunks for vendors
- **Lazy Loading**: Heavy components (AudioPlayer, VideoPlayer) are lazy loaded
- **Bundle Optimization**: Terser minification with console removal in production
- **Asset Optimization**: Optimized asset file naming and organization
- **Service Worker**: PWA support with caching strategies
- **Gzip Compression**: Enabled in nginx configuration

## Scripts

### Development
- `npm run dev` - Start development server
- `npm run preview` - Preview production build

### Building
- `npm run build` - Build for production
- `npm run build:analyze` - Build with bundle analyzer

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Testing
- `npm run test` - Run tests in watch mode
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:e2e` - Run E2E tests (Playwright)
- `npm run test:e2e:ui` - Run E2E tests with UI

**Note**: E2E tests require the backend to be running on `http://localhost:8000`

## Deployment

See [DEPLOYMENT_PLATFORMS.md](./DEPLOYMENT_PLATFORMS.md) for detailed platform-specific guides:
- **Vercel** - Fast, zero-config deployment
- **Netlify** - Similar to Vercel, great free tier
- **Railway** - Full-stack deployment with Docker support
- **Docker** - Self-hosted or cloud deployment
- **GitHub Pages** - Free static hosting
- **Self-Hosted** - Full control with Nginx

Quick deployment:

```bash
# Vercel
vercel

# Netlify
netlify deploy --prod --dir=dist

# Railway (connect GitHub repo in dashboard)
# Docker
docker build -t natural-speech-frontend .
docker run -p 3000:80 natural-speech-frontend
```

## CI/CD

GitHub Actions workflow is configured at `.github/workflows/frontend.yml`:

- ✅ Linting on pull requests
- ✅ Format checking
- ✅ Unit tests with coverage
- ✅ E2E tests with Playwright
- ✅ Building on push/PR
- ✅ Docker image building on main/develop branches
- ✅ Bundle analysis on pull requests

All quality checks must pass before deployment.

## Troubleshooting

### Build Fails

- Ensure Node.js version is 18+
- Clear `node_modules` and `package-lock.json`, then reinstall
- Check environment variables are set correctly

### Docker Build Fails

- Ensure Docker is running
- Check Dockerfile syntax
- Verify build arguments are correct

### API Connection Issues

- Verify `VITE_API_BASE_URL` is set correctly
- Check CORS configuration on backend
- Ensure backend is running and accessible

## License

See main project LICENSE file.
