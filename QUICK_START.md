# Quick Start Guide

Get Natural Speech up and running in 5 minutes!

## Prerequisites Check

Before starting, ensure you have:
- ✅ Python 3.8+ installed
- ✅ Node.js 18+ installed
- ✅ FFmpeg installed

**Quick check:**
```bash
python3 --version  # Should show 3.8+
node --version     # Should show 18+
ffmpeg -version    # Should show version info
```

## Installation

### Step 1: Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd natural-speech

# Run setup script
./setup.sh        # macOS/Linux
# OR
setup.bat         # Windows
```

This will:
- Create Python virtual environment
- Install all dependencies
- Set up environment files

### Step 2: Start the Application

```bash
./start.sh        # macOS/Linux
# OR
start.bat         # Windows
```

This starts both backend and frontend servers.

### Step 3: Access the Application

Open your browser and go to:
- **Frontend**: http://localhost:5173
- **Backend API Docs**: http://localhost:8000/docs

## First Use

### Text-to-Speech

1. Enter text in the input field
2. Select a voice from the dropdown
3. Adjust speed (optional)
4. Click "Generate Speech"
5. Play the generated audio

### Avatar Generation

1. Switch to "Avatar Studio" tab
2. Enter text
3. Upload an image (JPG, PNG, or WebP)
4. Select voice and speed
5. Click "Generate Avatar"
6. Wait for processing (30-60 seconds)
7. Watch the generated video

## Troubleshooting

### Backend won't start
- Check if port 8000 is available
- Verify Python virtual environment is activated
- Check backend logs for errors

### Frontend won't start
- Check if port 5173 is available
- Run `npm install` in frontend directory
- Check Node.js version

### Avatar generation fails
- Ensure FFmpeg is installed
- Check image file format (JPG, PNG, WebP)
- Verify SadTalker checkpoints exist

### Can't connect to backend
- Ensure backend is running
- Check `VITE_API_BASE_URL` in frontend `.env`
- Verify CORS settings in backend `.env`

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [ARCHITECTURE.md](ARCHITECTURE.md) for system design
- Review [AGENT_TASKS.md](AGENT_TASKS.md) for development tasks

## Need Help?

- Check the troubleshooting section in README.md
- Review API documentation at http://localhost:8000/docs
- Open an issue on GitHub

---

**Happy generating! 🎉**

