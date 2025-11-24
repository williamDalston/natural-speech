from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel
import os
import soundfile as sf
import io
import shutil
from tts_service import TTSService
from avatar_service import AvatarService

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize TTS Service
import numpy as np
from contextlib import contextmanager

@contextmanager
def safe_load_context():
    original_load = np.load
    def patched_load(*args, **kwargs):
        # Allow pickle
        kwargs['allow_pickle'] = True
        result = original_load(*args, **kwargs)
        # If it's a 0-d array (scalar) and contains a dict, extract it
        if isinstance(result, np.ndarray) and result.ndim == 0 and isinstance(result.item(), dict):
            return result.item()
        return result
        
    np.load = patched_load
    try:
        yield
    finally:
        np.load = original_load

try:
    with safe_load_context():
        # Use voices.bin.npy (np.save appends .npy)
        # Check if voices.bin.npy exists, otherwise use voices.bin
        voices_file = "voices.bin.npy" if os.path.exists("voices.bin.npy") else "voices.bin"
        tts_service = TTSService(model_path="kokoro-v0_19.onnx", voices_path=voices_file)
    print("TTS Service initialized successfully.")
except Exception as e:
    print(f"Failed to initialize TTS Service: {e}")
    # Print full traceback for debugging
    import traceback
    traceback.print_exc()
    tts_service = None

# Initialize Avatar Service
try:
    avatar_service = AvatarService()
    print("Avatar Service initialized successfully.")
except Exception as e:
    print(f"Failed to initialize Avatar Service: {e}")
    avatar_service = None

class TTSRequest(BaseModel):
    text: str
    voice: str = "af_bella" # Default voice
    speed: float = 1.0

@app.get("/")
async def root():
    return {"message": "TTS API is running"}

@app.get("/api/voices")
async def get_voices():
    if not tts_service:
        raise HTTPException(status_code=500, detail="TTS Service not initialized")
    return {"voices": tts_service.get_voices()}

@app.post("/api/tts")
async def generate_speech(request: TTSRequest):
    if not tts_service:
        raise HTTPException(status_code=500, detail="TTS Service not initialized")
    
    try:
        audio, sample_rate = tts_service.generate_audio(request.text, request.voice, request.speed)
        
        import io
        buffer = io.BytesIO()
        sf.write(buffer, audio, sample_rate, format='WAV')
        buffer.seek(0)
        
        return Response(content=buffer.getvalue(), media_type="audio/wav")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/avatar")
async def generate_avatar(
    text: str = Form(...),
    voice: str = Form(...),
    speed: float = Form(1.0),
    image: UploadFile = File(...)
):
    if not tts_service:
        raise HTTPException(status_code=500, detail="TTS Service not initialized")
    if not avatar_service:
        raise HTTPException(status_code=500, detail="Avatar Service not initialized")

    try:
        # 1. Generate Audio
        audio, sample_rate = tts_service.generate_audio(text, voice, speed)
        
        # Save audio to temp file
        temp_audio_path = "temp_audio.wav"
        sf.write(temp_audio_path, audio, sample_rate, format='WAV')
        
        # 2. Save Image to temp file
        temp_image_path = f"temp_{image.filename}"
        with open(temp_image_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
            
        # 3. Generate Avatar Video
        video_path = avatar_service.generate_avatar(os.path.abspath(temp_audio_path), os.path.abspath(temp_image_path))
        
        # 4. Return Video
        return FileResponse(video_path, media_type="video/mp4", filename="avatar.mp4")

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup temp files
        if os.path.exists("temp_audio.wav"):
            os.remove("temp_audio.wav")
        if 'temp_image_path' in locals() and os.path.exists(temp_image_path):
            os.remove(temp_image_path)
