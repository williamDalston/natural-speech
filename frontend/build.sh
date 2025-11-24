#!/bin/bash

# Production build script for Natural Speech Frontend

set -e

echo "🚀 Starting production build..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ to continue."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check for environment variables
if [ -z "$VITE_API_BASE_URL" ]; then
    echo "⚠️  VITE_API_BASE_URL not set. Using default: /api"
    export VITE_API_BASE_URL="/api"
fi

# Run linting
echo "🔍 Running linter..."
npm run lint || echo "⚠️  Linter found issues, but continuing..."

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed: dist directory not found"
    exit 1
fi

echo "✅ Build completed successfully!"
echo "📦 Output: ./dist"
echo ""
echo "To preview the build, run: npm run preview"
echo "To deploy with Docker, run: docker build -t natural-speech-frontend ."

