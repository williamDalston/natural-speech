@echo off
REM Natural Speech - Startup Script for Windows
REM Starts both backend and frontend servers

echo 🚀 Starting Natural Speech Application...
echo.

REM Check if virtual environment exists
if not exist "backend\venv" (
    echo ⚠️  Virtual environment not found. Running setup first...
    call setup.bat
)

REM Start Backend in new window
echo 📦 Starting backend server...
start "Natural Speech Backend" cmd /k "cd backend && venv\Scripts\activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start Frontend in new window
echo 🎨 Starting frontend server...
start "Natural Speech Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ Application started successfully!
echo.
echo 📍 Access the application at:
echo    Frontend: http://localhost:5173
echo    Backend API: http://localhost:8000
echo    API Docs: http://localhost:8000/docs
echo.
echo Close the windows to stop the servers.
pause

