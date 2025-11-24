# Natural Speech - Architecture Documentation

## System Overview

Natural Speech is a full-stack web application that provides AI-powered text-to-speech and avatar generation capabilities. The system consists of a FastAPI backend and a React frontend, communicating via REST API.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   React App  │  │   API Client │  │  Components  │       │
│  │   (Vite)     │  │   (api.js)   │  │  (UI/UX)     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │ HTTP/REST API
                             │ (Port 5173 → 8000)
┌────────────────────────────┼─────────────────────────────────┐
│                            │         Backend (FastAPI)       │
│  ┌──────────────────────────▼──────────────────────────┐     │
│  │              FastAPI Application                     │     │
│  │  ┌──────────────┐  ┌──────────────┐                │     │
│  │  │   Routes     │  │  Middleware  │                │     │
│  │  │  /api/tts    │  │  CORS, Auth  │                │     │
│  │  │  /api/avatar │  │  Rate Limit  │                │     │
│  │  └──────────────┘  └──────────────┘                │     │
│  └─────────────────────────────────────────────────────┘     │
│                            │                                 │
│  ┌─────────────────────────┼─────────────────────────┐       │
│  │                         │                         │       │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐│       │
│  │  │ TTS Service  │  │Avatar Service│  │   Cache  ││       │
│  │  │  (Kokoro)    │  │ (SadTalker)  │  │ Manager  ││       │
│  │  └──────────────┘  └──────────────┘  └──────────┘│       │
│  │         │                  │              │       │       │
│  └─────────┼──────────────────┼──────────────┼───────┘       │
│            │                  │              │                 │
│  ┌─────────▼──────────┐  ┌───▼──────────┐  ┌▼──────────────┐│
│  │  Kokoro Model      │  │  SadTalker    │  │  SQLite DB    ││
│  │  (kokoro-v0_19.onnx│  │  Checkpoints │  │  (Jobs)       ││
│  │  voices.json)      │  │  Results     │  │               ││
│  └────────────────────┘  └──────────────┘  └───────────────┘│
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### Frontend Architecture

#### Technology Stack
- **Framework**: React 19.2
- **Build Tool**: Vite 7.2
- **Styling**: Tailwind CSS 3.4
- **Animations**: Framer Motion 12.23
- **State Management**: React Context API
- **HTTP Client**: Fetch API with custom wrapper

#### Key Components

1. **App.jsx** - Main application component
   - Manages global state
   - Handles tab switching (TTS/Avatar)
   - Coordinates API calls

2. **api.js** - API client module
   - Centralized API communication
   - Retry logic with exponential backoff
   - Request timeout handling
   - Progress tracking for long operations

3. **Components**:
   - `Layout.jsx` - Main layout wrapper
   - `TextInput.jsx` - Text input with validation
   - `ImageUpload.jsx` - Image upload handler
   - `Controls.jsx` - Voice/speed controls
   - `AudioPlayer.jsx` - Audio playback
   - `VideoPlayer.jsx` - Video playback
   - `ErrorBoundary.jsx` - Error handling
   - `Toast.jsx` - Notifications

### Backend Architecture

#### Technology Stack
- **Framework**: FastAPI
- **Server**: Uvicorn (dev) / Gunicorn (prod)
- **TTS Engine**: Kokoro ONNX
- **Avatar Engine**: SadTalker
- **Database**: SQLite (for job tracking)
- **Caching**: In-memory cache
- **Logging**: Loguru

#### Key Modules

1. **main.py** - FastAPI application
   - API route definitions
   - Middleware configuration
   - Service initialization
   - Error handling

2. **config.py** - Configuration management
   - Environment variable loading
   - Configuration validation
   - Settings access

3. **tts_service.py** - Text-to-Speech service
   - Kokoro model integration
   - Audio generation
   - Voice management

4. **avatar_service.py** - Avatar generation service
   - SadTalker integration
   - Video generation pipeline
   - File management

5. **Supporting Modules**:
   - `exceptions.py` - Custom exception classes
   - `security.py` - Input validation and security
   - `job_tracker.py` - Background job management
   - `cache_manager.py` - Response caching
   - `logger_config.py` - Logging setup

## Data Flow

### Text-to-Speech Flow

```
User Input (Text)
    ↓
Frontend: TextInput Component
    ↓
Frontend: API Client (api.js)
    ↓ HTTP POST /api/tts
Backend: FastAPI Route Handler
    ↓
Backend: TTS Service
    ↓
Kokoro Model Processing
    ↓
Audio Generation (WAV)
    ↓
Backend: Response (audio/wav)
    ↓
Frontend: AudioPlayer Component
    ↓
User: Playback
```

### Avatar Generation Flow

```
User Input (Text + Image)
    ↓
Frontend: Form Submission
    ↓
Frontend: API Client (api.js)
    ↓ HTTP POST /api/avatar
Backend: FastAPI Route Handler
    ↓
Backend: TTS Service (Generate Audio)
    ↓
Backend: Avatar Service
    ↓
SadTalker Processing
    ↓
Video Generation (MP4)
    ↓
Backend: Response (video/mp4)
    ↓
Frontend: VideoPlayer Component
    ↓
User: Playback
```

## API Endpoints

### GET `/api/voices`
Returns list of available voices.

**Response:**
```json
{
  "voices": ["af_bella", "af_sarah", ...]
}
```

### POST `/api/tts`
Generates speech from text.

**Request:**
```json
{
  "text": "Hello, world!",
  "voice": "af_bella",
  "speed": 1.0
}
```

**Response:** Audio file (WAV format)

### POST `/api/avatar`
Generates talking avatar video.

**Request:** Multipart form data
- `text`: string
- `voice`: string
- `speed`: float
- `image`: file

**Response:** Video file (MP4 format)

## Configuration

### Environment Variables

**Backend (.env):**
- `HOST`, `PORT` - Server configuration
- `DEBUG` - Debug mode
- `CORS_ORIGINS` - Allowed origins
- `TTS_MODEL_PATH` - Path to Kokoro model
- `VOICES_PATH` - Path to voices file
- `SADTALKER_BASE_PATH` - SadTalker directory
- `MAX_UPLOAD_SIZE` - File upload limit
- `LOG_LEVEL` - Logging level

**Frontend (.env):**
- `VITE_API_BASE_URL` - Backend API URL
- `VITE_APP_NAME` - Application name
- `VITE_MAX_TEXT_LENGTH` - Text input limit

## File Structure

```
natural-speech/
├── backend/              # FastAPI backend
│   ├── main.py          # Main application
│   ├── config.py        # Configuration
│   ├── tts_service.py   # TTS service
│   ├── avatar_service.py # Avatar service
│   ├── requirements.txt # Dependencies
│   └── SadTalker/       # Avatar generation library
│
├── frontend/            # React frontend
│   ├── src/
│   │   ├── App.jsx      # Main component
│   │   ├── api.js       # API client
│   │   └── components/  # UI components
│   ├── package.json     # Dependencies
│   └── vite.config.js   # Build config
│
├── setup.sh             # Setup script
├── start.sh             # Startup script
└── README.md            # Documentation
```

## Security Considerations

1. **Input Validation**: All inputs validated on backend
2. **File Upload Security**: File type and size validation
3. **CORS**: Configured for specific origins
4. **Rate Limiting**: Prevents abuse
5. **Error Handling**: No sensitive data in error messages

## Performance Optimizations

1. **Caching**: Frequently used audio cached
2. **Background Tasks**: Long operations run asynchronously
3. **Compression**: GZip middleware for responses
4. **Connection Pooling**: Efficient database connections
5. **Lazy Loading**: Frontend components loaded on demand

## Deployment Architecture

### Development
- Frontend: Vite dev server (port 5173)
- Backend: Uvicorn with auto-reload (port 8000)

### Production
- Frontend: Static files served by Nginx
- Backend: Gunicorn with Uvicorn workers
- Reverse Proxy: Nginx
- Database: SQLite (can be upgraded to PostgreSQL)

## Future Enhancements

1. **Database**: Migrate to PostgreSQL for scalability
2. **Queue System**: Redis/Celery for job processing
3. **CDN**: Static asset delivery
4. **Monitoring**: Prometheus/Grafana integration
5. **Authentication**: User accounts and API keys
6. **Multi-tenancy**: Support for multiple users

---

**Last Updated**: 2024
**Version**: 1.0.0

