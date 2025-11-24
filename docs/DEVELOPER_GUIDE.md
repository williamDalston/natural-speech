# Natural Speech - Developer Guide

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Setup & Installation](#setup--installation)
4. [Development Workflow](#development-workflow)
5. [Code Structure](#code-structure)
6. [Testing](#testing)
7. [Contributing](#contributing)
8. [Deployment](#deployment)

## Project Overview

Natural Speech is a full-stack application for text-to-speech conversion and avatar video generation. It consists of:

- **Backend**: FastAPI-based Python service with TTS (Kokoro) and Avatar (SadTalker) capabilities
- **Frontend**: React/Vite application with modern UI

## Architecture

### Backend Architecture

```
backend/
├── main.py              # FastAPI application entry point
├── tts_service.py       # Text-to-speech service wrapper
├── avatar_service.py    # Avatar generation service wrapper
├── models.py            # Pydantic models for validation
├── exceptions.py        # Custom exception classes
└── SadTalker/           # SadTalker integration
```

**Key Components:**
- FastAPI for REST API
- Kokoro ONNX for TTS
- SadTalker for avatar generation
- Pydantic for request validation

### Frontend Architecture

```
frontend/
├── src/
│   ├── App.jsx          # Main application component
│   ├── api.js           # API client
│   ├── components/      # React components
│   └── test/           # Test files
```

**Key Technologies:**
- React 19
- Vite for build tooling
- Tailwind CSS for styling
- Framer Motion for animations
- Vitest for testing

## Setup & Installation

### Prerequisites

- Python 3.8+
- Node.js 18+
- FFmpeg (for video processing)
- Git

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   pip install -r requirements-dev.txt  # For development
   ```

4. **Verify model files exist:**
   - `kokoro-v0_19.onnx` - TTS model
   - `voices.json` - Voice definitions
   - `SadTalker/checkpoints/` - Avatar model checkpoints

5. **Run the server:**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## Development Workflow

### Code Quality Tools

**Backend:**
```bash
# Format code
black .

# Sort imports
isort .

# Lint code
flake8 .

# Type checking
mypy .
```

**Frontend:**
```bash
# Format code
npm run format

# Lint code
npm run lint
npm run lint:fix
```

### Pre-commit Hooks

Install pre-commit hooks:
```bash
pip install pre-commit
pre-commit install
```

Hooks will automatically run on commit:
- Code formatting (Black, Prettier)
- Import sorting (isort)
- Linting (flake8, ESLint)
- File checks (trailing whitespace, etc.)

## Code Structure

### Backend Services

#### TTS Service (`tts_service.py`)

Handles text-to-speech conversion using Kokoro ONNX model.

**Key Methods:**
- `generate_audio(text, voice, speed)` - Generate audio from text
- `get_voices()` - Get list of available voices

#### Avatar Service (`avatar_service.py`)

Handles avatar video generation using SadTalker.

**Key Methods:**
- `generate_avatar(audio_path, image_path)` - Generate video from audio and image

### Frontend Components

#### Main Components

- `App.jsx` - Main application logic and state management
- `Layout.jsx` - Application layout and navigation
- `TextInput.jsx` - Text input with character counter
- `Controls.jsx` - Voice and speed controls
- `AudioPlayer.jsx` - Audio playback component
- `VideoPlayer.jsx` - Video playback component
- `ImageUpload.jsx` - Image upload component

#### API Client (`api.js`)

Centralized API client with error handling:
- `getVoices()` - Fetch available voices
- `generateSpeech()` - Generate audio
- `generateAvatar()` - Generate video

## Testing

### Backend Tests

Run tests:
```bash
cd backend
pytest
```

Run with coverage:
```bash
pytest --cov=. --cov-report=html
```

Test structure:
```
backend/tests/
├── conftest.py          # Pytest fixtures
├── test_main.py        # API endpoint tests
├── test_tts_service.py # TTS service tests
└── test_avatar_service.py # Avatar service tests
```

### Frontend Tests

Run tests:
```bash
cd frontend
npm test
```

Run with UI:
```bash
npm run test:ui
```

Run with coverage:
```bash
npm run test:coverage
```

Test structure:
```
frontend/src/test/
├── setup.js           # Test configuration
├── api.test.js        # API client tests
├── TextInput.test.jsx # Component tests
└── Controls.test.jsx  # Component tests
```

### Writing Tests

**Backend Example:**
```python
def test_tts_endpoint(client):
    response = client.post(
        "/api/tts",
        json={"text": "Hello", "voice": "af_bella", "speed": 1.0}
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "audio/wav"
```

**Frontend Example:**
```javascript
it('renders textarea', () => {
  render(<TextInput text="" setText={vi.fn()} />);
  expect(screen.getByPlaceholderText(/script/i)).toBeInTheDocument();
});
```

## Contributing

### Development Process

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Ensure all tests pass
5. Run code quality checks
6. Submit a pull request

### Code Style

- Follow existing code patterns
- Use meaningful variable names
- Add comments for complex logic
- Keep functions focused and small
- Write descriptive commit messages

### Commit Message Format

```
type: brief description

Detailed explanation if needed
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `style`, `chore`

## Deployment

### Production Build

**Backend:**
```bash
# Install production dependencies only
pip install -r requirements.txt

# Run with production server
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

**Frontend:**
```bash
npm run build
# Output in dist/ directory
```

### Environment Variables

Create `.env` files for configuration:

**Backend `.env`:**
```
PORT=8000
HOST=0.0.0.0
LOG_LEVEL=INFO
```

**Frontend `.env`:**
```
VITE_API_BASE_URL=http://localhost:8000/api
```

### Docker Deployment

See `docker-compose.yml` for containerized deployment.

## Troubleshooting

### Common Issues

**Backend won't start:**
- Check Python version (3.8+)
- Verify model files exist
- Check port 8000 is available
- Review error logs

**Frontend build fails:**
- Clear `node_modules` and reinstall
- Check Node.js version (18+)
- Verify all dependencies installed

**Tests failing:**
- Ensure test dependencies installed
- Check test data files exist
- Verify services are mocked correctly

## Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Pytest Documentation](https://docs.pytest.org/)
- [Vitest Documentation](https://vitest.dev/)

## License

See LICENSE file for details.

