#!/bin/bash

# Natural Speech - Setup Script
# Installs all dependencies and sets up the project

set -e

echo "🔧 Setting up Natural Speech..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed. Please install Python 3.8+ first.${NC}"
    exit 1
fi
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
echo -e "${GREEN}✅ Python $PYTHON_VERSION found${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js $NODE_VERSION found${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi
NPM_VERSION=$(npm --version)
echo -e "${GREEN}✅ npm $NPM_VERSION found${NC}"

# Check FFmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${YELLOW}⚠️  FFmpeg is not installed. Avatar generation may not work.${NC}"
    echo -e "${YELLOW}   Install with: brew install ffmpeg (macOS) or sudo apt-get install ffmpeg (Linux)${NC}"
else
    echo -e "${GREEN}✅ FFmpeg found${NC}"
fi

echo ""

# Backend Setup
echo -e "${BLUE}📦 Setting up backend...${NC}"
cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Install development dependencies if file exists
if [ -f "requirements-dev.txt" ]; then
    echo "Installing development dependencies..."
    pip install -r requirements-dev.txt
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "Creating .env file from .env.example..."
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Please review and update backend/.env with your configuration${NC}"
    else
        echo -e "${YELLOW}⚠️  .env.example not found. You may need to create .env manually${NC}"
    fi
fi

cd ..

# Frontend Setup
echo ""
echo -e "${BLUE}🎨 Setting up frontend...${NC}"
cd frontend

# Install dependencies
echo "Installing Node.js dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "Creating .env file from .env.example..."
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Please review and update frontend/.env with your configuration${NC}"
    else
        echo -e "${YELLOW}⚠️  .env.example not found. You may need to create .env manually${NC}"
    fi
fi

cd ..

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Review and update .env files in backend/ and frontend/ directories"
echo "  2. Run ./start.sh to start the application"
echo ""
echo "📚 Documentation:"
echo "  - Quick Start: See QUICK_START.md"
echo "  - Full Guide: See README.md"
echo "  - Architecture: See ARCHITECTURE.md"
echo ""

