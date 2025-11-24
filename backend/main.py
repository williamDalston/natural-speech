"""
Natural Speech API - Main FastAPI Application

This module provides the main FastAPI application with:
- Text-to-speech (TTS) generation
- Avatar video generation (synchronous and asynchronous)
- Comprehensive error handling and validation
- Structured logging with request tracking
- Rate limiting and performance monitoring
- Health checks and status endpoints
- Caching for improved performance
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse, Response, StreamingResponse, JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel
import os
import soundfile as sf
import io
import shutil
import time
import uuid
from typing import Optional
from datetime import datetime
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from config import settings
from security import validate_file_upload, validate_text_input, validate_voice, validate_speed
from tts_service import TTSService
from avatar_service import AvatarService
from job_tracker import JobTracker, JobStatus
from cache_manager import CacheManager
from performance_monitor import PerformanceMonitor
from background_tasks import BackgroundTaskManager
from rate_limiter import RateLimiter
from cleanup_scheduler import CleanupScheduler
from exceptions import (
    NaturalSpeechException,
    ServiceNotAvailableException,
    ValidationException,
    FileException,
    AudioGenerationException,
    AvatarGenerationException
)
from models import ErrorResponse, HealthResponse, StatusResponse, VoicesResponse, TTSRequest
from logger_config import logger

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Natural Speech API with TTS and Avatar generation",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Include system monitoring router if available
try:
    from api.system import router as system_router
    app.include_router(system_router)
except (ImportError, Exception):
    # System monitoring is optional
    pass

# Add compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Initialize rate limiter (slowapi for production)
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Initialize CORS with environment-based configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Initialize services
import numpy as np
from contextlib import contextmanager

@contextmanager
def safe_load_context():
    original_load = np.load
    def patched_load(*args, **kwargs):
        kwargs['allow_pickle'] = True
        result = original_load(*args, **kwargs)
        if isinstance(result, np.ndarray) and result.ndim == 0 and isinstance(result.item(), dict):
            return result.item()
        return result
    np.load = patched_load
    try:
        yield
    finally:
        np.load = original_load

# Initialize TTS Service
try:
    with safe_load_context():
        voices_file = settings.VOICES_PATH if os.path.exists(settings.VOICES_PATH) else "voices.bin"
        tts_service = TTSService(model_path=settings.MODEL_PATH, voices_path=voices_file)
    logger.info("TTS Service initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize TTS Service: {e}", exc_info=True)
    tts_service = None

# Initialize Avatar Service
try:
    avatar_service = AvatarService(base_path=settings.SADTALKER_PATH)
    logger.info("Avatar Service initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Avatar Service: {e}", exc_info=True)
    avatar_service = None

# Create temp directory if it doesn't exist
os.makedirs(settings.TEMP_DIR, exist_ok=True)

# Initialize supporting services
job_tracker = JobTracker()
cache_manager = CacheManager()
performance_monitor = PerformanceMonitor()
# Use custom rate limiter if enabled, otherwise use slowapi
rate_limiter = RateLimiter(
    requests_per_minute=settings.RATE_LIMIT_PER_MINUTE if settings.RATE_LIMIT_ENABLED else 10000,
    burst_size=10
) if settings.RATE_LIMIT_ENABLED else None

# Initialize background task manager
background_tasks = None
if tts_service and avatar_service:
    background_tasks = BackgroundTaskManager(
        job_tracker=job_tracker,
        tts_service=tts_service,
        avatar_service=avatar_service,
        max_workers=2
    )

# Initialize cleanup scheduler
cleanup_scheduler = CleanupScheduler(
    job_tracker=job_tracker,
    cache_manager=cache_manager,
    rate_limiter=rate_limiter,
    temp_dir=settings.TEMP_DIR,
    cleanup_interval=3600  # Run cleanup every hour
)

# Exception handlers
@app.exception_handler(NaturalSpeechException)
async def natural_speech_exception_handler(request: Request, exc: NaturalSpeechException):
    """Handle custom Natural Speech exceptions."""
    request_id = getattr(request.state, 'request_id', 'unknown')
    logger.error(f"[{request_id}] NaturalSpeechException: {exc.message} (code: {exc.error_code})")
    response = ErrorResponse(
        error=True,
        error_code=exc.error_code,
        message=exc.message
    ).dict()
    return JSONResponse(
        status_code=exc.status_code,
        content=response,
        headers={"X-Request-ID": request_id}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors."""
    errors = exc.errors()
    error_messages = [f"{err['loc']}: {err['msg']}" for err in errors]
    message = "Validation error: " + "; ".join(error_messages)
    logger.warning(f"Validation error: {message}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=ErrorResponse(
            error=True,
            error_code="VALIDATION_ERROR",
            message=message,
            detail=str(errors)
        ).dict()
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle all other exceptions."""
    request_id = getattr(request.state, 'request_id', 'unknown')
    logger.exception(f"[{request_id}] Unhandled exception: {exc}")
    response = ErrorResponse(
        error=True,
        error_code="INTERNAL_ERROR",
        message="An internal error occurred",
        detail=str(exc) if settings.DEBUG else None
    ).dict()
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=response,
        headers={"X-Request-ID": request_id}
    )

# Add rate limiting middleware (after other middleware)
# Note: Rate limiting is applied via the timing middleware below

@app.exception_handler(RateLimitExceeded)
async def rate_limit_exception_handler(request: Request, exc: RateLimitExceeded):
    """Handle rate limit exceeded exceptions from slowapi."""
    logger.warning(f"Rate limit exceeded for {request.url.path} from {get_remote_address(request)}")
    return JSONResponse(
        status_code=429,
        content=ErrorResponse(
            error=True,
            error_code="RATE_LIMIT_EXCEEDED",
            message="Rate limit exceeded. Please try again later."
        ).dict(),
        headers={"Retry-After": str(exc.retry_after) if hasattr(exc, 'retry_after') else "60"}
    )

# Request timing, logging, and rate limiting middleware
@app.middleware("http")
async def timing_and_rate_limit_middleware(request: Request, call_next):
    # Generate request ID for tracking
    request_id = str(uuid.uuid4())[:8]
    request.state.request_id = request_id
    
    # Apply custom rate limiting (skip for health/status/metrics endpoints)
    skip_paths = ["/", "/api/health", "/api/status", "/api/metrics", "/docs", "/openapi.json", "/redoc"]
    if rate_limiter and request.url.path not in skip_paths:
        if not rate_limiter.is_allowed(request):
            retry_after = rate_limiter.get_retry_after(request)
            logger.warning(f"[{request_id}] Rate limit exceeded for {request.url.path} from {get_remote_address(request)}")
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Please try again in {retry_after:.1f} seconds.",
                headers={"Retry-After": str(int(retry_after) + 1)}
            )
    
    start_time = time.time()
    logger.info(f"[{request_id}] Request: {request.method} {request.url.path}")
    
    try:
        response = await call_next(request)
        duration = time.time() - start_time
        
        logger.info(f"[{request_id}] Response: {response.status_code} - {duration:.3f}s")
        
        # Record metrics (skip for metrics endpoint to avoid recursion)
        if request.url.path != "/api/metrics":
            success = response.status_code < 400
            performance_monitor.record_request(request.url.path, duration, success)
        
        # Add request ID to response headers for debugging
        response.headers["X-Request-ID"] = request_id
        
        return response
    except Exception as e:
        duration = time.time() - start_time
        logger.error(f"[{request_id}] Request failed after {duration:.3f}s: {e}", exc_info=True)
        raise

# Pydantic models
class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    progress: float
    error_message: Optional[str] = None
    result_path: Optional[str] = None
    created_at: str
    updated_at: str

# Root endpoint
@app.get(
    "/",
    tags=["General"],
    summary="API Information",
    description="Get information about the API and available endpoints."
)
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Natural Speech API",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "docs": "/docs" if settings.DEBUG else "Documentation disabled in production",
        "endpoints": {
            "tts": "/api/tts",
            "avatar": "/api/avatar",
            "avatar_async": "/api/avatar/async",
            "job_status": "/api/jobs/{job_id}",
            "voices": "/api/voices",
            "health": "/api/health",
            "status": "/api/status",
            "metrics": "/api/metrics"
        },
        "services": {
            "tts": tts_service is not None,
            "avatar": avatar_service is not None,
            "background_tasks": background_tasks is not None
        }
    }

# Health check endpoint
@app.get(
    "/api/health",
    response_model=HealthResponse,
    tags=["Health"],
    summary="Health Check",
    description="Check if the API is running and healthy."
)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat() + "Z",
        version="1.0.0"
    )

# Status endpoint
@app.get(
    "/api/status",
    response_model=StatusResponse,
    tags=["Health"],
    summary="Service Status",
    description="Get detailed status of all services."
)
async def get_status():
    """Get detailed status of all services."""
    services = {
        "tts": "available" if tts_service else "unavailable",
        "avatar": "available" if avatar_service else "unavailable",
        "background_tasks": "available" if background_tasks else "unavailable"
    }
    
    overall_status = "operational" if (tts_service and avatar_service) else "degraded"
    
    return StatusResponse(
        status=overall_status,
        services=services,
        timestamp=datetime.utcnow().isoformat() + "Z"
    )

# Metrics endpoint
@app.get(
    "/api/metrics",
    tags=["Monitoring"],
    summary="Performance Metrics",
    description="Get performance metrics and statistics for the API."
)
async def get_metrics():
    """Get performance metrics."""
    return performance_monitor.get_metrics()

# Get voices endpoint (with caching)
@app.get(
    "/api/voices",
    response_model=VoicesResponse,
    tags=["TTS"],
    summary="Get Available Voices",
    description="Retrieve a list of all available voices for text-to-speech generation."
)
async def get_voices():
    """Get list of available voices."""
    if not tts_service:
        from exceptions import ServiceNotAvailableException
        raise ServiceNotAvailableException("TTS")
    
    try:
        # Try to get from cache
        cache_key = "voices_list"
        cached_voices = cache_manager.get(cache_key)
        if cached_voices is not None:
            logger.debug("Returning cached voices list")
            return VoicesResponse(voices=cached_voices, count=len(cached_voices))
        
        # Generate voices list
        voices = tts_service.get_voices()
        logger.info(f"Retrieved {len(voices)} voices")
        
        # Cache for 1 hour
        cache_manager.set(cache_key, voices)
        
        return VoicesResponse(voices=voices, count=len(voices))
    except Exception as e:
        logger.error(f"Error retrieving voices: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to retrieve voices: {str(e)}")

# TTS endpoint (with caching and compression)
@app.post(
    "/api/tts",
    tags=["TTS"],
    summary="Generate Speech",
    description="""
    Generate speech from text using the specified voice.
    
    - **text**: Text to convert to speech (1-5000 characters)
    - **voice**: Voice identifier (default: af_bella)
    - **speed**: Speech speed multiplier (0.5-2.0, default: 1.0)
    
    Returns a WAV audio file. Results are cached for performance.
    """,
    responses={
        200: {
            "description": "Audio file generated successfully",
            "content": {"audio/wav": {}}
        },
        400: {"description": "Validation error", "model": ErrorResponse},
        503: {"description": "Service unavailable", "model": ErrorResponse}
    }
)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute" if settings.RATE_LIMIT_ENABLED else None)
async def generate_speech(request: Request, tts_request: TTSRequest):
    """
    Generate speech from text.
    
    Converts the provided text to speech using the specified voice and speed.
    Results are cached to improve performance for repeated requests.
    """
    if not tts_service:
        raise ServiceNotAvailableException("TTS")
    
    # Validate inputs
    try:
        validate_text_input(tts_request.text)
        available_voices = tts_service.get_voices()
        validate_voice(tts_request.voice, available_voices)
        validate_speed(tts_request.speed)
    except ValidationException as e:
        raise
    
    request_id = getattr(request.state, 'request_id', 'unknown')
    logger.info(f"[{request_id}] Generating speech: text_length={len(tts_request.text)}, voice={tts_request.voice}, speed={tts_request.speed}")
    
    # Generate cache key
    cache_key = f"tts:{tts_request.text}:{tts_request.voice}:{tts_request.speed}"
    
    # Try to get from cache
    cached_audio = cache_manager.get(cache_key)
    if cached_audio is not None:
        logger.debug(f"[{request_id}] Returning cached audio")
        return Response(
            content=cached_audio,
            media_type="audio/wav",
            headers={"Content-Disposition": "attachment; filename=speech.wav", "X-Cache": "HIT"}
        )
    
    try:
        # Generate audio
        audio, sample_rate = tts_service.generate_audio(
            tts_request.text,
            tts_request.voice,
            tts_request.speed
        )
        
        # Convert to bytes
        buffer = io.BytesIO()
        sf.write(buffer, audio, sample_rate, format='WAV')
        buffer.seek(0)
        audio_bytes = buffer.getvalue()
        
        # Cache the result (cache for 24 hours for TTS)
        cache_manager.set(cache_key, audio_bytes)
        
        logger.info(f"[{request_id}] Speech generated successfully ({len(audio_bytes)} bytes)")
        
        return Response(
            content=audio_bytes,
            media_type="audio/wav",
            headers={"Content-Disposition": "attachment; filename=speech.wav", "X-Cache": "MISS"}
        )
    
    except NaturalSpeechException:
        raise
    except Exception as e:
        logger.error(f"[{request_id}] Error generating speech: {e}", exc_info=True)
        raise AudioGenerationException(f"Failed to generate audio: {str(e)}")

# Synchronous avatar endpoint (kept for backward compatibility)
@app.post(
    "/api/avatar",
    tags=["Avatar"],
    summary="Generate Avatar Video (Synchronous)",
    description="""
    Generate a talking avatar video from an image and text (synchronous).
    
    - **text**: Text to convert to speech (1-5000 characters)
    - **voice**: Voice identifier
    - **speed**: Speech speed multiplier (0.5-2.0, default: 1.0)
    - **image**: Image file (JPEG, PNG, BMP, GIF, WebP, max 10MB)
    
    Returns an MP4 video file. This is a synchronous operation that may take time.
    For long operations, consider using `/api/avatar/async` instead.
    """,
    responses={
        200: {
            "description": "Avatar video generated successfully",
            "content": {"video/mp4": {}}
        },
        400: {"description": "Validation error", "model": ErrorResponse},
        503: {"description": "Service unavailable", "model": ErrorResponse}
    }
)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute" if settings.RATE_LIMIT_ENABLED else None)
async def generate_avatar(
    request: Request,
    text: str = Form(..., description="Text to convert to speech (1-5000 characters)"),
    voice: str = Form(..., description="Voice identifier"),
    speed: float = Form(1.0, description="Speech speed multiplier (0.5-2.0)"),
    image: UploadFile = File(..., description="Image file (JPEG, PNG, BMP, GIF, WebP, max 10MB)")
):
    if not tts_service:
        raise ServiceNotAvailableException("TTS")
    if not avatar_service:
        raise ServiceNotAvailableException("Avatar")
    
    # Validate inputs
    validate_text_input(text)
    available_voices = tts_service.get_voices()
    validate_voice(voice, available_voices)
    validate_speed(speed)
    validate_file_upload(image)

    request_id = getattr(request.state, 'request_id', 'unknown')
    logger.info(f"[{request_id}] Generating avatar: text_length={len(text)}, voice={voice}, speed={speed}, image={image.filename}")

    temp_image_path = None
    temp_audio_path = None
    try:
        # Save image to temp file with secure naming
        file_ext = os.path.splitext(image.filename)[1] if image.filename else ".jpg"
        if file_ext not in settings.ALLOWED_IMAGE_EXTENSIONS:
            file_ext = ".jpg"
        
        temp_image_path = os.path.join(settings.TEMP_DIR, f"temp_image_{uuid.uuid4()}{file_ext}")
        with open(temp_image_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        # Generate audio
        audio, sample_rate = tts_service.generate_audio(text, voice, speed)
        
        # Save audio to temp file
        temp_audio_path = os.path.join(settings.TEMP_DIR, f"temp_audio_{uuid.uuid4()}.wav")
        sf.write(temp_audio_path, audio, sample_rate, format='WAV')
        
        # Generate avatar video
        logger.info(f"[{request_id}] Starting avatar video generation...")
        video_path = avatar_service.generate_avatar(
            os.path.abspath(temp_audio_path),
            os.path.abspath(temp_image_path)
        )
        
        logger.info(f"[{request_id}] Avatar generated successfully: {video_path}")
        
        # Return video with streaming for large files
        return FileResponse(
            video_path,
            media_type="video/mp4",
            filename="avatar.mp4",
            headers={"Content-Disposition": "attachment; filename=avatar.mp4"},
            background=None  # Don't delete file immediately
        )

    except NaturalSpeechException:
        raise
    except Exception as e:
        request_id = getattr(request.state, 'request_id', 'unknown')
        logger.error(f"[{request_id}] Error generating avatar: {e}", exc_info=True)
        raise AvatarGenerationException(f"Failed to generate avatar: {str(e)}")
    finally:
        # Cleanup temp files
        for temp_path in [temp_image_path, temp_audio_path]:
            if temp_path and os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                    logger.debug(f"Cleaned up temp file: {temp_path}")
                except Exception as e:
                    logger.warning(f"Failed to cleanup temp file {temp_path}: {e}")

# Async avatar endpoint (new - returns job ID immediately)
@app.post(
    "/api/avatar/async",
    tags=["Avatar"],
    summary="Generate Avatar Video (Asynchronous)",
    description="""
    Generate a talking avatar video from an image and text (asynchronous).
    
    This endpoint returns immediately with a job ID. Use `/api/jobs/{job_id}` to check status.
    
    - **text**: Text to convert to speech (1-5000 characters)
    - **voice**: Voice identifier
    - **speed**: Speech speed multiplier (0.5-2.0, default: 1.0)
    - **image**: Image file (JPEG, PNG, BMP, GIF, WebP, max 10MB)
    
    Returns a job ID that can be used to track progress and download the result.
    """,
    responses={
        200: {
            "description": "Job submitted successfully",
            "content": {"application/json": {"example": {"job_id": "abc123", "status": "pending"}}}
        },
        400: {"description": "Validation error", "model": ErrorResponse},
        503: {"description": "Service unavailable", "model": ErrorResponse}
    }
)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute" if settings.RATE_LIMIT_ENABLED else None)
async def generate_avatar_async(
    request: Request,
    text: str = Form(..., description="Text to convert to speech (1-5000 characters)"),
    voice: str = Form(..., description="Voice identifier"),
    speed: float = Form(1.0, description="Speech speed multiplier (0.5-2.0)"),
    image: UploadFile = File(..., description="Image file (JPEG, PNG, BMP, GIF, WebP, max 10MB)")
):
    if not background_tasks:
        raise ServiceNotAvailableException("Background Tasks")
    
    # Validate inputs
    validate_text_input(text)
    if tts_service:
        available_voices = tts_service.get_voices()
        validate_voice(voice, available_voices)
    validate_speed(speed)
    validate_file_upload(image)
    
    # Save image to temp file (will be cleaned up by background task)
    file_ext = os.path.splitext(image.filename)[1] if image.filename else ".jpg"
    if file_ext not in settings.ALLOWED_IMAGE_EXTENSIONS:
        file_ext = ".jpg"
    
    temp_image_path = os.path.join(settings.TEMP_DIR, f"temp_image_{uuid.uuid4()}{file_ext}")
    try:
        with open(temp_image_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
    except Exception as e:
        raise FileException(f"Failed to save image: {str(e)}")
    
    request_id = getattr(request.state, 'request_id', 'unknown')
    logger.info(f"[{request_id}] Submitting avatar job to background queue")
    
    # Submit job to background queue
    job_id = background_tasks.submit_avatar_job(
        text=text,
        voice=voice,
        speed=speed,
        image_path=temp_image_path
    )
    
    logger.info(f"[{request_id}] Avatar job submitted: {job_id}")
    
    return {
        "job_id": job_id,
        "status": "pending",
        "message": "Avatar generation started. Use /api/jobs/{job_id} to check status."
    }

# Job status endpoint
@app.get(
    "/api/jobs/{job_id}",
    response_model=JobStatusResponse,
    tags=["Jobs"],
    summary="Get Job Status",
    description="Get the status of an asynchronous avatar generation job."
)
async def get_job_status(job_id: str):
    """Get job status by job ID."""
    job = job_tracker.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return JobStatusResponse(
        job_id=job["job_id"],
        status=job["status"],
        progress=job.get("progress", 0.0),
        error_message=job.get("error_message"),
        result_path=job.get("result_path"),
        created_at=job["created_at"],
        updated_at=job["updated_at"]
    )

# Download result endpoint
@app.get("/api/jobs/{job_id}/download")
async def download_job_result(job_id: str):
    job = job_tracker.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job["status"] != JobStatus.COMPLETED.value:
        raise HTTPException(
            status_code=400,
            detail=f"Job is not completed. Current status: {job['status']}"
        )
    
    result_path = job.get("result_path")
    if not result_path or not os.path.exists(result_path):
        raise HTTPException(status_code=404, detail="Result file not found")
    
    return FileResponse(
        result_path,
        media_type="video/mp4",
        filename="avatar.mp4"
    )

# List jobs endpoint
@app.get("/api/jobs")
async def list_jobs(status: Optional[str] = None, limit: int = 50):
    if status:
        try:
            status_enum = JobStatus(status)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
        jobs = job_tracker.get_jobs(status=status_enum, limit=limit)
    else:
        jobs = job_tracker.get_jobs(limit=limit)
    
    return {"jobs": jobs, "count": len(jobs)}

# Queue status endpoint
@app.get("/api/queue/status")
async def get_queue_status():
    """Get current background task queue status."""
    if not background_tasks:
        raise HTTPException(status_code=503, detail="Background tasks not available")
    
    queue_status = background_tasks.get_queue_status()
    return {
        "queue_size": queue_status["queue_size"],
        "active_workers": queue_status["active_workers"],
        "max_workers": queue_status["max_workers"],
        "available_workers": queue_status["available_workers"],
        "utilization": f"{(queue_status['active_workers'] / queue_status['max_workers'] * 100):.1f}%"
    }

# Cleanup old jobs endpoint (admin)
@app.post("/api/jobs/cleanup")
async def cleanup_old_jobs(days: int = 7):
    deleted = job_tracker.cleanup_old_jobs(days=days)
    return {"deleted": deleted, "message": f"Cleaned up {deleted} jobs older than {days} days"}

# Cache management endpoints
@app.post("/api/cache/clear")
async def clear_cache():
    cache_manager.clear()
    return {"message": "Cache cleared successfully"}

@app.get("/api/cache/stats")
async def get_cache_stats():
    return {
        "cache_dir": cache_manager.cache_dir,
        "memory_entries": len(cache_manager.memory_cache),
        "ttl_seconds": cache_manager.ttl
    }

# Startup event
@app.on_event("startup")
async def startup_event():
    """Log startup information and verify services."""
    logger.info("=" * 60)
    logger.info(f"Natural Speech API starting up...")
    logger.info(f"Version: {settings.APP_VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"TTS Service: {'✓ Available' if tts_service else '✗ Unavailable'}")
    logger.info(f"Avatar Service: {'✓ Available' if avatar_service else '✗ Unavailable'}")
    logger.info(f"Background Tasks: {'✓ Available' if background_tasks else '✗ Unavailable'}")
    if tts_service:
        try:
            voices = tts_service.get_voices()
            logger.info(f"Available voices: {len(voices)}")
        except:
            pass
    logger.info(f"Rate limiting: {'Enabled' if settings.RATE_LIMIT_ENABLED else 'Disabled'}")
    logger.info(f"Debug mode: {'Enabled' if settings.DEBUG else 'Disabled'}")
    
    # Start cleanup scheduler
    try:
        cleanup_scheduler.start()
        logger.info("Cleanup scheduler started")
    except Exception as e:
        logger.error(f"Failed to start cleanup scheduler: {e}")
    
    logger.info("=" * 60)

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Log shutdown information and cleanup."""
    logger.info("Natural Speech API shutting down...")
    
    # Stop cleanup scheduler
    try:
        cleanup_scheduler.stop()
        logger.info("Cleanup scheduler stopped")
    except Exception as e:
        logger.error(f"Error stopping cleanup scheduler: {e}")
    
    # Gracefully shutdown background tasks
    if background_tasks:
        logger.info("Stopping background task manager...")
        try:
            cancelled = background_tasks.shutdown(timeout=30)
            logger.info(f"Cancelled {cancelled} pending tasks")
        except Exception as e:
            logger.error(f"Error shutting down background tasks: {e}")
    
    logger.info("Shutdown complete.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.RELOAD,
        log_level=settings.LOG_LEVEL.lower()
    )
