# Natural Speech - AI-Powered Text-to-Speech & Avatar Generation

A modern web application that transforms text into lifelike speech and generates talking avatars using advanced AI models. Built with FastAPI backend and React frontend.

## 🎯 Features

- **Text-to-Speech (TTS)**: Convert text to natural-sounding speech using Kokoro ONNX model
- **Avatar Generation**: Create talking avatar videos from text and images using SadTalker
- **Voice Selection**: Choose from multiple AI voices
- **Speed Control**: Adjust speech speed (0.5x - 2.0x)
- **Modern UI**: Beautiful, responsive interface with Tailwind CSS and Framer Motion
- **Real-time Processing**: Fast audio generation with progress indicators

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.8+** (Python 3.9 or 3.10 recommended)
- **Node.js 18+** and npm
- **FFmpeg** (required for video processing)
  - macOS: `brew install ffmpeg`
  - Ubuntu/Debian: `sudo apt-get install ffmpeg`
  - Windows: Download from [ffmpeg.org](https://ffmpeg.org/download.html)
- **Git** (for cloning the repository)

## 🚀 Quick Start

> **New to the project?** Check out the [Quick Start Guide](QUICK_START.md) for a 5-minute setup!

### Option 1: Automated Setup (Recommended)

Run the setup script to install all dependencies:

**macOS/Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

**Windows:**
```cmd
setup.bat
```

Then start the application:

**macOS/Linux:**
```bash
./start.sh
```

**Windows:**
```cmd
start.bat
```

### Option 2: Manual Setup

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd natural-speech
```

#### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# Edit .env with your configuration (optional)
```

#### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your configuration (optional)
```

#### 4. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173 (or the port shown in terminal)
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 📁 Project Structure

```
natural-speech/
├── backend/                 # FastAPI backend
│   ├── main.py             # Main FastAPI application
│   ├── tts_service.py      # Text-to-Speech service (Kokoro)
│   ├── avatar_service.py   # Avatar generation service (SadTalker)
│   ├── config.py           # Configuration management
│   ├── requirements.txt    # Python dependencies
│   ├── requirements-dev.txt # Development dependencies
│   ├── .env.example        # Environment variables template
│   ├── kokoro-v0_19.onnx   # TTS model file
│   ├── voices.json         # Voice definitions
│   └── SadTalker/          # Avatar generation library
│       ├── inference.py    # Avatar inference script
│       ├── checkpoints/    # Model checkpoints
│       └── results/        # Generated videos
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── App.jsx         # Main application component
│   │   ├── api.js          # API client
│   │   ├── components/     # React components
│   │   │   ├── AudioPlayer.jsx
│   │   │   ├── VideoPlayer.jsx
│   │   │   ├── TextInput.jsx
│   │   │   ├── ImageUpload.jsx
│   │   │   ├── Controls.jsx
│   │   │   └── Layout.jsx
│   │   └── index.css       # Global styles with Tailwind
│   ├── package.json        # Node.js dependencies
│   ├── tailwind.config.js  # Tailwind CSS configuration
│   ├── postcss.config.js   # PostCSS configuration
│   └── .env.example        # Environment variables template
│
├── setup.sh / setup.bat    # Automated setup scripts
├── start.sh / start.bat    # Startup scripts
└── README.md               # This file
```

## ⚙️ Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory (copy from `.env.example`):

```env
# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=True

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Model Paths
TTS_MODEL_PATH=kokoro-v0_19.onnx
VOICES_PATH=voices.json

# SadTalker Configuration
SADTALKER_BASE_PATH=SadTalker
SADTALKER_CHECKPOINTS_DIR=SadTalker/checkpoints
SADTALKER_RESULTS_DIR=SadTalker/results

# File Upload Limits
MAX_UPLOAD_SIZE=10485760  # 10MB in bytes
ALLOWED_IMAGE_TYPES=jpg,jpeg,png,webp
```

### Frontend Environment Variables

Create a `.env` file in the `frontend/` directory (copy from `.env.example`):

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api

# Application Settings
VITE_APP_NAME=Natural Speech
VITE_MAX_TEXT_LENGTH=5000
```

## 🎮 Usage

### Text-to-Speech

1. Navigate to the **Text to Speech** tab
2. Enter your text in the input field
3. Select a voice from the dropdown
4. Adjust the speed slider (optional)
5. Click **Generate Speech**
6. Play the generated audio using the audio player

### Avatar Generation

1. Navigate to the **Avatar Studio** tab
2. Enter your text
3. Upload an image (JPG, PNG, or WebP)
4. Select a voice and adjust speed
5. Click **Generate Avatar**
6. Wait for processing (this may take 30-60 seconds)
7. Watch the generated video

## 🛠️ Development

### Running in Development Mode

The application runs in development mode by default with hot-reload enabled:

- **Backend**: Changes to Python files will automatically reload
- **Frontend**: Changes to React components will hot-reload in the browser

### Development Dependencies

Install development dependencies for backend:

```bash
cd backend
pip install -r requirements-dev.txt
```

### Code Style

- **Backend**: Follow PEP 8 style guide
- **Frontend**: Use ESLint and Prettier (configured in package.json)

## 🐛 Troubleshooting

### Backend Issues

**TTS Service fails to initialize:**
- Ensure `kokoro-v0_19.onnx` and `voices.json` exist in the `backend/` directory
- Check that all dependencies are installed: `pip install -r requirements.txt`
- Verify Python version: `python3 --version` (should be 3.8+)

**Avatar generation fails:**
- Ensure FFmpeg is installed: `ffmpeg -version`
- Check that SadTalker checkpoints are in `backend/SadTalker/checkpoints/`
- Verify image file format (JPG, PNG, WebP supported)
- Check backend logs for detailed error messages

**Port 8000 already in use:**
- Change the port in `.env` or use: `uvicorn main:app --port 8001`

### Frontend Issues

**Cannot connect to backend:**
- Ensure backend is running on http://localhost:8000
- Check `VITE_API_BASE_URL` in frontend `.env` file
- Verify CORS settings in backend configuration

**Tailwind styles not working:**
- Ensure `tailwind.config.js` exists and has correct content paths
- Rebuild: `npm run build`
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

**Build errors:**
- Clear cache: `rm -rf node_modules/.vite`
- Reinstall dependencies: `npm install`
- Check Node.js version: `node --version` (should be 18+)

### General Issues

**Slow avatar generation:**
- Avatar generation is computationally intensive and may take 30-60 seconds
- Ensure you have sufficient RAM (8GB+ recommended)
- Consider using GPU acceleration if available

**Audio playback issues:**
- Check browser console for errors
- Try a different browser
- Ensure audio codec support (WAV format should work in all browsers)

## 📚 Documentation

- **[Quick Start Guide](QUICK_START.md)** - Get started in 5 minutes
- **[Architecture Documentation](ARCHITECTURE.md)** - System design and architecture
- **[Agent Tasks](AGENT_TASKS.md)** - Development task breakdown
- **[Agent Progress](AGENT_PROGRESS.md)** - Current development status

### API Documentation

When the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Endpoints

- `GET /` - Health check
- `GET /api/voices` - Get list of available voices
- `POST /api/tts` - Generate speech from text
- `POST /api/avatar` - Generate talking avatar video

## 🚢 Production Deployment

For production deployment, see the deployment guide in the project documentation.

Key considerations:
- Set `DEBUG=False` in backend `.env`
- Use production build for frontend: `npm run build`
- Configure proper CORS origins
- Set up reverse proxy (nginx recommended)
- Use process manager (PM2, systemd, etc.)
- Enable HTTPS/SSL

## 📝 License

[Add your license information here]

## 🤝 Contributing

[Add contribution guidelines here]

## 🙏 Acknowledgments

- **Kokoro**: Text-to-Speech model by [Kokoro](https://github.com/hexgrad/kokoro-onnx)
- **SadTalker**: Talking avatar generation by [SadTalker](https://github.com/OpenTalker/SadTalker)
- Built with FastAPI, React, Tailwind CSS, and Framer Motion

## 📧 Support

For issues and questions:
- Open an issue on GitHub
- Check the troubleshooting section above
- Review API documentation at `/docs` endpoint

## 📖 Additional Resources

- **[Quick Start Guide](QUICK_START.md)** - Fast setup instructions
- **[Architecture Documentation](ARCHITECTURE.md)** - Detailed system architecture
- **[Development Guide](AGENT_TASKS.md)** - Task breakdown for developers

## 🔧 Development

For developers working on this project:

1. Review [AGENT_TASKS.md](AGENT_TASKS.md) for task breakdown
2. Check [AGENT_PROGRESS.md](AGENT_PROGRESS.md) for current status
3. Follow the architecture in [ARCHITECTURE.md](ARCHITECTURE.md)
4. Install dev dependencies: `pip install -r backend/requirements-dev.txt`

---

**Made with ❤️ for natural speech synthesis**

