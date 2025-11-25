# Conversation Practice Feature

## Overview

The Conversation Practice feature allows users to practice speaking on any topic. Users can:
1. Enter a topic they want to practice
2. Get AI-generated conversation prompts using GPT
3. Record themselves speaking
4. Listen to their recordings stored in local cache
5. Practice repeatedly by recording and listening again

## Features

### Backend
- **GPT Integration**: Uses OpenAI API to generate conversation prompts
- **Conversation Service**: `backend/conversation_service.py` handles prompt generation
- **API Endpoints**:
  - `POST /api/conversation/prompts` - Generate prompts for a topic
  - `GET /api/conversation/status` - Check if GPT service is available

### Frontend
- **ConversationPractice Component**: Full-featured practice interface
- **Audio Recording**: Uses MediaRecorder API for browser-based recording
- **Local Storage**: Recordings stored in browser localStorage
- **Playback Controls**: Play, pause, download, and delete recordings
- **Prompt Navigation**: Navigate through multiple prompts for the same topic

## Setup

### Backend Configuration

Add to your `.env` file:
```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini  # Optional, defaults to gpt-4o-mini
```

### Installation

The OpenAI package is already added to `requirements.txt`. Install it:
```bash
cd backend
pip install -r requirements.txt
```

## Usage

1. Navigate to "Conversation Practice" in the sidebar
2. Enter a topic (e.g., "climate change", "artificial intelligence")
3. Click "Generate Prompts" to get AI-generated conversation prompts
4. Read the prompt and click "Start Recording"
5. Speak your response (1-3 minutes recommended)
6. Click "Stop Recording" when done
7. Your recording is automatically saved to local storage
8. Click the play button to listen to your recording
9. Practice again with the same or different prompts

## Technical Details

### Recording Format
- Format: WebM audio
- Stored in: Browser localStorage (key: `conversation_recordings`)
- Storage limit: Browser-dependent (typically 5-10MB)

### Data Structure
Each recording contains:
- `id`: Unique identifier
- `topic`: The topic practiced
- `prompt`: The specific prompt used
- `audioUrl`: Blob URL for playback
- `timestamp`: When the recording was made
- `blob`: The audio blob data

### API Integration
- Falls back to predefined prompts if GPT API is unavailable
- Handles rate limiting and errors gracefully
- Provides status endpoint to check service availability

## Future Enhancements

Potential improvements:
- [ ] Audio transcription for feedback
- [ ] Recording duration display
- [ ] Export recordings as files
- [ ] Practice statistics and progress tracking
- [ ] Multiple language support
- [ ] Voice analysis and feedback

