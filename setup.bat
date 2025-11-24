@echo off
REM Natural Speech - Setup Script for Windows
REM Installs all dependencies and sets up the project

echo 🔧 Setting up Natural Speech...
echo.

REM Check prerequisites
echo 📋 Checking prerequisites...

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8+ first.
    exit /b 1
)
python --version
echo ✅ Python found

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)
node --version
echo ✅ Node.js found

REM Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm first.
    exit /b 1
)
npm --version
echo ✅ npm found

REM Check FFmpeg
ffmpeg -version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  FFmpeg is not installed. Avatar generation may not work.
    echo    Download from https://ffmpeg.org/download.html
) else (
    echo ✅ FFmpeg found
)

echo.

REM Backend Setup
echo 📦 Setting up backend...
cd backend

REM Create virtual environment
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment and install dependencies
echo Installing Python dependencies...
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt

REM Install development dependencies if file exists
if exist "requirements-dev.txt" (
    echo Installing development dependencies...
    pip install -r requirements-dev.txt
)

REM Create .env file if it doesn't exist
if not exist ".env" (
    if exist ".env.example" (
        echo Creating .env file from .env.example...
        copy .env.example .env
        echo ⚠️  Please review and update backend\.env with your configuration
    ) else (
        echo ⚠️  .env.example not found. You may need to create .env manually
    )
)

cd ..

REM Frontend Setup
echo.
echo 🎨 Setting up frontend...
cd frontend

REM Install dependencies
echo Installing Node.js dependencies...
call npm install

REM Create .env file if it doesn't exist
if not exist ".env" (
    if exist ".env.example" (
        echo Creating .env file from .env.example...
        copy .env.example .env
        echo ⚠️  Please review and update frontend\.env with your configuration
    ) else (
        echo ⚠️  .env.example not found. You may need to create .env manually
    )
)

cd ..

echo.
echo ✅ Setup complete!
echo.
echo Next steps:
echo   1. Review and update .env files in backend\ and frontend\ directories
echo   2. Run start.bat to start the application
echo.
echo 📚 Documentation:
echo   - Quick Start: See QUICK_START.md
echo   - Full Guide: See README.md
echo   - Architecture: See ARCHITECTURE.md
echo.
pause

