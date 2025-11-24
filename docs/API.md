# Natural Speech API Documentation

## Base URL

```
http://localhost:8000
```

## Endpoints

### Root Endpoint

#### `GET /`

Returns a simple status message.

**Response:**
```json
{
  "message": "TTS API is running"
}
```

---

### Get Available Voices

#### `GET /api/voices`

Retrieves a list of available voice models.

**Response:**
```json
{
  "voices": ["af_bella", "af_sarah", "am_michael", ...]
}
```

**Status Codes:**
- `200 OK` - Success
- `500 Internal Server Error` - TTS service not initialized

---

### Generate Speech

#### `POST /api/tts`

Converts text to speech audio.

**Request Body:**
```json
{
  "text": "Hello, this is a test of the text-to-speech system.",
  "voice": "af_bella",
  "speed": 1.0
}
```

**Parameters:**
- `text` (string, required): Text to convert to speech (1-5000 characters)
- `voice` (string, optional): Voice identifier (default: "af_bella")
- `speed` (float, optional): Speech speed multiplier, range 0.5-2.0 (default: 1.0)

**Response:**
- Content-Type: `audio/wav`
- Body: WAV audio file binary data

**Status Codes:**
- `200 OK` - Success, returns audio file
- `400 Bad Request` - Invalid request parameters
- `422 Unprocessable Entity` - Validation error
- `500 Internal Server Error` - TTS service error or not initialized

**Example:**
```bash
curl -X POST http://localhost:8000/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "voice": "af_bella", "speed": 1.0}' \
  --output output.wav
```

---

### Generate Avatar Video

#### `POST /api/avatar`

Generates a talking avatar video from text and an image.

**Request:**
- Content-Type: `multipart/form-data`
- Form fields:
  - `text` (string, required): Text to convert to speech (1-5000 characters)
  - `voice` (string, required): Voice identifier
  - `speed` (float, optional): Speech speed multiplier, range 0.5-2.0 (default: 1.0)
  - `image` (file, required): Image file (PNG, JPG, JPEG)

**Response:**
- Content-Type: `video/mp4`
- Body: MP4 video file binary data
- Filename: `avatar.mp4`

**Status Codes:**
- `200 OK` - Success, returns video file
- `400 Bad Request` - Invalid request parameters
- `422 Unprocessable Entity` - Validation error (missing fields)
- `500 Internal Server Error` - Service error or not initialized

**Example:**
```bash
curl -X POST http://localhost:8000/api/avatar \
  -F "text=Hello, this is a test" \
  -F "voice=af_bella" \
  -F "speed=1.0" \
  -F "image=@/path/to/image.png" \
  --output avatar.mp4
```

**JavaScript Example:**
```javascript
const formData = new FormData();
formData.append('text', 'Hello, world!');
formData.append('voice', 'af_bella');
formData.append('speed', '1.0');
formData.append('image', imageFile);

const response = await fetch('http://localhost:8000/api/avatar', {
  method: 'POST',
  body: formData
});

const videoBlob = await response.blob();
```

---

## Error Responses

All error responses follow this format:

```json
{
  "detail": "Error message description"
}
```

**Common Error Codes:**
- `400` - Bad Request (validation errors)
- `422` - Unprocessable Entity (missing required fields)
- `500` - Internal Server Error (service errors)
- `503` - Service Unavailable (service not initialized)

---

## Rate Limiting

Currently, no rate limiting is implemented. For production deployments, consider implementing rate limiting per IP address.

---

## Notes

- Audio generation is typically fast (< 1 second)
- Avatar generation can take 30-60 seconds depending on text length and system resources
- Maximum text length is 5000 characters
- Supported image formats: PNG, JPG, JPEG
- Audio format: WAV (16-bit PCM)
- Video format: MP4 (H.264)

---

## CORS

The API allows CORS from all origins by default. For production, configure CORS to only allow specific origins.

