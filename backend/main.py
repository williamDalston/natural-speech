"""
Prose and Pause API - Main FastAPI Application

This module provides the main FastAPI application with:
- Text-to-speech (TTS) generation
- Writings database for exploring wonderful writing
- Comprehensive error handling and validation
- Structured logging with request tracking
- Rate limiting and performance monitoring
- Health checks and status endpoints
- Caching for improved performance
"""

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import Response, JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel
import os
import soundfile as sf
import io
import time
import uuid
from typing import Optional, List
from datetime import datetime
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from config import settings
from security import validate_text_input, validate_voice, validate_speed
from tts_service import TTSService
from cache_manager import CacheManager
from performance_monitor import PerformanceMonitor
from rate_limiter import RateLimiter
from job_tracker import JobTracker, JobStatus
from cleanup_scheduler import CleanupScheduler
from data_service import data_service
from writings_service import writings_service
from conversation_service import conversation_service
from interactive_conversation_service import interactive_conversation_service
from rhetorical_device_service import rhetorical_device_service
from speech_service import speech_service
from speeches_service import speeches_service
from poems_service import poems_service
from statistics_service import statistics_service
from database import get_db, init_db, get_db_health, get_pipeline_stats
from pipeline_health import (
    pipeline_health,
    ComponentStatus,
    PipelineHealthMonitor
)
from exceptions import (
    NaturalSpeechException,
    ServiceNotAvailableException,
    ValidationException,
    AudioGenerationException
)
from models import (
    ErrorResponse, HealthResponse, StatusResponse, VoicesResponse, TTSRequest,
    WritingCreate, WritingUpdate, WritingResponse, WritingsListResponse,
    ConversationPromptRequest, ConversationPromptsResponse, ConversationPrompt,
    InteractiveConversationStartRequest, InteractiveConversationContinueRequest,
    InteractiveConversationResponse, ConversationMessage,
    RhetoricalDevicePracticeRequest, RhetoricalDevicePracticeResponse, RhetoricalDevicePrompt,
    SpeechCreate, SpeechResponse, SpeechesListResponse,
    PoemCreate, PoemUpdate, PoemResponse, PoemsListResponse, PoetryStylesResponse,
    DailyStatisticsResponse, WeeklyStatisticsResponse, MonthlyStatisticsResponse,
    UserGoalCreate, UserGoalUpdate, UserGoalResponse, UserGoalsListResponse,
    StreakResponse, StatisticsSummaryResponse
)
from logger_config import logger

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Audio-only platform for exploring wonderful writing through text-to-speech",
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
    pipeline_health.record_component_check(
        "tts_service",
        ComponentStatus.HEALTHY,
        metadata={"voices_available": len(tts_service.get_voices()) if tts_service else 0}
    )
except Exception as e:
    logger.error(f"Failed to initialize TTS Service: {e}", exc_info=True)
    tts_service = None
    pipeline_health.record_component_check(
        "tts_service",
        ComponentStatus.UNAVAILABLE,
        error=str(e)
    )
    pipeline_health.record_error(
        "tts_service",
        "InitializationError",
        f"Failed to initialize TTS service: {str(e)}",
        traceback=str(e)
    )

# Initialize supporting services
try:
    cache_manager = CacheManager()
    pipeline_health.record_component_check("cache_manager", ComponentStatus.HEALTHY)
except Exception as e:
    logger.error(f"Failed to initialize Cache Manager: {e}", exc_info=True)
    cache_manager = None
    pipeline_health.record_component_check("cache_manager", ComponentStatus.ERROR, error=str(e))

try:
    performance_monitor = PerformanceMonitor()
    pipeline_health.record_component_check("performance_monitor", ComponentStatus.HEALTHY)
except Exception as e:
    logger.error(f"Failed to initialize Performance Monitor: {e}", exc_info=True)
    performance_monitor = None
    pipeline_health.record_component_check("performance_monitor", ComponentStatus.ERROR, error=str(e))

# Use custom rate limiter if enabled, otherwise use slowapi
try:
    rate_limiter = RateLimiter(
        requests_per_minute=settings.RATE_LIMIT_PER_MINUTE if settings.RATE_LIMIT_ENABLED else 10000,
        burst_size=10
    ) if settings.RATE_LIMIT_ENABLED else None
    if rate_limiter:
        pipeline_health.record_component_check("rate_limiter", ComponentStatus.HEALTHY)
except Exception as e:
    logger.error(f"Failed to initialize Rate Limiter: {e}", exc_info=True)
    rate_limiter = None
    pipeline_health.record_component_check("rate_limiter", ComponentStatus.ERROR, error=str(e))

# Initialize Job Tracker
try:
    job_tracker = JobTracker(db_path=os.getenv("JOB_TRACKER_DB", "jobs.db"))
    pipeline_health.record_component_check("job_tracker", ComponentStatus.HEALTHY)
except Exception as e:
    logger.error(f"Failed to initialize Job Tracker: {e}", exc_info=True)
    job_tracker = None
    pipeline_health.record_component_check("job_tracker", ComponentStatus.ERROR, error=str(e))

# Initialize Cleanup Scheduler
cleanup_scheduler = None
try:
    if job_tracker and cache_manager:
        cleanup_scheduler = CleanupScheduler(
            job_tracker=job_tracker,
            cache_manager=cache_manager,
            rate_limiter=rate_limiter,
            temp_dir=settings.TEMP_DIR,
            cleanup_interval=int(os.getenv("CLEANUP_INTERVAL", "3600"))  # 1 hour default
        )
        pipeline_health.record_component_check("cleanup_scheduler", ComponentStatus.HEALTHY)
except Exception as e:
    logger.error(f"Failed to initialize Cleanup Scheduler: {e}", exc_info=True)
    cleanup_scheduler = None
    pipeline_health.record_component_check("cleanup_scheduler", ComponentStatus.ERROR, error=str(e))

# Initialize database health tracking
try:
    db_health = get_db_health()
    db_status = ComponentStatus.HEALTHY if db_health["status"] == "healthy" else ComponentStatus.DEGRADED
    pipeline_health.record_component_check("database", db_status, metadata=db_health)
except Exception as e:
    logger.error(f"Failed to check database health: {e}", exc_info=True)
    pipeline_health.record_component_check("database", ComponentStatus.ERROR, error=str(e))

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
    import traceback
    
    # Record error in pipeline health
    pipeline_health.record_error(
        component="api",
        error_type=type(exc).__name__,
        message=str(exc),
        traceback=traceback.format_exc(),
        context={
            "request_id": request_id,
            "path": request.url.path,
            "method": request.method
        }
    )
    
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
            if performance_monitor:
                performance_monitor.record_request(request.url.path, duration, success)
            
            # Record in pipeline health
            pipeline_health.record_operation(
                component="api",
                operation=request.url.path,
                duration=duration,
                success=success
            )
        
        # Add request ID to response headers for debugging
        response.headers["X-Request-ID"] = request_id
        
        return response
    except Exception as e:
        duration = time.time() - start_time
        logger.error(f"[{request_id}] Request failed after {duration:.3f}s: {e}", exc_info=True)
        
        # Record error in pipeline health
        import traceback
        pipeline_health.record_error(
            component="api",
            error_type=type(e).__name__,
            message=str(e),
            traceback=traceback.format_exc(),
            context={
                "request_id": request_id,
                "path": request.url.path,
                "method": request.method,
                "duration": duration
            }
        )
        raise

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
        "message": "Prose and Pause API - Explore Wonderful Writing Through Audio",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "docs": "/docs" if settings.DEBUG else "Documentation disabled in production",
        "endpoints": {
            "tts": "/api/tts",
            "writings": "/api/writings",
            "voices": "/api/voices",
            "health": "/api/health",
            "status": "/api/status",
            "metrics": "/api/metrics",
            "pipeline_status": "/api/pipeline/status",
            "pipeline_diagnostics": "/api/pipeline/diagnostics",
            "pipeline_stats": "/api/pipeline/stats",
            "pipeline_errors": "/api/pipeline/errors",
            "speeches": "/api/speeches",
            "poems": "/api/poems",
            "poetry_styles": "/api/poetry/styles"
        },
        "services": {
            "tts": tts_service is not None
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
    """Get detailed status of all services with pipeline health integration."""
    start_time = time.time()
    
    try:
        # Check component health
        components_health = pipeline_health.get_all_components_health()
        
        services = {}
        for component, health in components_health.items():
            if component == "tts_service":
                services["tts"] = "available" if health["status"] == "healthy" else "unavailable"
            elif component == "database":
                services["database"] = health["status"]
            elif component == "cache_manager":
                services["cache"] = health["status"]
            elif component == "rate_limiter":
                services["rate_limiter"] = health["status"]
            elif component == "job_tracker":
                services["job_tracker"] = health["status"]
            elif component == "cleanup_scheduler":
                services["cleanup_scheduler"] = health["status"]
        
        # Determine overall status
        pipeline_status = pipeline_health.get_pipeline_status()
        overall_status = pipeline_status["overall_status"]
        
        # Record check
        duration = time.time() - start_time
        pipeline_health.record_component_check("api", ComponentStatus.HEALTHY, duration)
        
        return StatusResponse(
            status=overall_status,
            services=services,
            timestamp=datetime.utcnow().isoformat() + "Z"
        )
    except Exception as e:
        duration = time.time() - start_time
        pipeline_health.record_component_check("api", ComponentStatus.ERROR, duration, error=str(e))
        logger.error(f"Error getting status: {e}", exc_info=True)
        raise

# Metrics endpoint
@app.get(
    "/api/metrics",
    tags=["Monitoring"],
    summary="Performance Metrics",
    description="Get performance metrics and statistics for the API."
)
async def get_metrics():
    """Get performance metrics from performance monitor."""
    try:
        if performance_monitor:
            return performance_monitor.get_metrics()
        else:
            return {"error": "Performance monitor not available"}
    except Exception as e:
        logger.error(f"Error getting metrics: {e}", exc_info=True)
        pipeline_health.record_error("api", "MetricsError", str(e))
        raise HTTPException(status_code=500, detail="Failed to get metrics")

# Pipeline Status endpoint - Comprehensive pipeline health
@app.get(
    "/api/pipeline/status",
    tags=["Monitoring"],
    summary="Pipeline Status",
    description="Get comprehensive pipeline status including all components, errors, and diagnostics."
)
async def get_pipeline_status():
    """Get comprehensive pipeline status with all component health information."""
    try:
        return pipeline_health.get_pipeline_status()
    except Exception as e:
        logger.error(f"Error getting pipeline status: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get pipeline status")

# Pipeline Diagnostics endpoint
@app.get(
    "/api/pipeline/diagnostics",
    tags=["Monitoring"],
    summary="Pipeline Diagnostics",
    description="Get detailed diagnostics for troubleshooting pipeline issues."
)
async def get_pipeline_diagnostics():
    """Get detailed diagnostics for troubleshooting."""
    try:
        return pipeline_health.get_diagnostics()
    except Exception as e:
        logger.error(f"Error getting pipeline diagnostics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get diagnostics")

# Pipeline Stats endpoint - Database and job statistics
@app.get(
    "/api/pipeline/stats",
    tags=["Monitoring"],
    summary="Pipeline Statistics",
    description="Get database and job statistics from the pipeline."
)
async def get_pipeline_stats_endpoint():
    """Get pipeline statistics including jobs and writings."""
    try:
        db = next(get_db())
        try:
            stats = get_pipeline_stats(db)
            pipeline_health.record_component_check("database", ComponentStatus.HEALTHY)
            return stats
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error getting pipeline stats: {e}", exc_info=True)
        pipeline_health.record_error("database", "StatsError", str(e))
        pipeline_health.record_component_check("database", ComponentStatus.ERROR, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get pipeline stats")

# Error Summary endpoint
@app.get(
    "/api/pipeline/errors",
    tags=["Monitoring"],
    summary="Error Summary",
    description="Get error summary and analysis for the pipeline."
)
async def get_error_summary(hours: int = 24, component: Optional[str] = None):
    """Get error summary for analysis."""
    try:
        return pipeline_health.get_error_summary(component=component, hours=hours)
    except Exception as e:
        logger.error(f"Error getting error summary: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get error summary")

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
    
    - **text**: Text to convert to speech (supports text of any length)
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
        validate_text_input(tts_request.text)  # No max length - supports any length
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
        # Generate audio with error tracking
        tts_start = time.time()
        try:
            audio, sample_rate = tts_service.generate_audio(
                tts_request.text,
                tts_request.voice,
                tts_request.speed
            )
            tts_duration = time.time() - tts_start
            pipeline_health.record_operation("tts_service", "generate_audio", tts_duration, success=True)
            pipeline_health.record_component_check("tts_service", ComponentStatus.HEALTHY, tts_duration)
        except Exception as e:
            tts_duration = time.time() - tts_start
            pipeline_health.record_operation("tts_service", "generate_audio", tts_duration, success=False)
            pipeline_health.record_component_check("tts_service", ComponentStatus.ERROR, tts_duration, error=str(e))
            import traceback
            pipeline_health.record_error(
                "tts_service",
                type(e).__name__,
                str(e),
                traceback=traceback.format_exc(),
                context={"request_id": request_id, "voice": tts_request.voice}
            )
            raise
        
        # Convert to bytes
        buffer = io.BytesIO()
        sf.write(buffer, audio, sample_rate, format='WAV')
        buffer.seek(0)
        audio_bytes = buffer.getvalue()
        
        # Cache the result (cache for 24 hours for TTS)
        if cache_manager:
            try:
                cache_manager.set(cache_key, audio_bytes)
                pipeline_health.record_component_check("cache_manager", ComponentStatus.HEALTHY)
            except Exception as e:
                logger.warning(f"[{request_id}] Cache set failed: {e}")
                pipeline_health.record_component_check("cache_manager", ComponentStatus.DEGRADED, error=str(e))
        
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

# Job tracking endpoints
@app.get(
    "/api/jobs/{job_id}",
    tags=["Jobs"],
    summary="Get Job Status",
    description="Get the status and progress of an async job."
)
async def get_job_status(job_id: str):
    """Get job status by ID."""
    if not job_tracker:
        raise HTTPException(status_code=503, detail="Job tracker not available")
    
    job = job_tracker.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return job

@app.get(
    "/api/jobs",
    tags=["Jobs"],
    summary="List Jobs",
    description="Get a list of jobs, optionally filtered by status."
)
async def list_jobs(
    status: Optional[str] = None,
    limit: int = 100
):
    """List jobs with optional status filter."""
    if not job_tracker:
        raise HTTPException(status_code=503, detail="Job tracker not available")
    
    try:
        job_status = JobStatus(status) if status else None
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    
    jobs = job_tracker.get_jobs(status=job_status, limit=limit)
    return {
        "jobs": jobs,
        "count": len(jobs)
    }

@app.post(
    "/api/jobs/cleanup",
    tags=["Jobs"],
    summary="Cleanup Old Jobs",
    description="Manually trigger cleanup of old jobs (admin endpoint)."
)
async def cleanup_jobs(days: int = 7):
    """Cleanup jobs older than specified days."""
    if not job_tracker:
        raise HTTPException(status_code=503, detail="Job tracker not available")
    
    if days < 1 or days > 365:
        raise HTTPException(status_code=400, detail="Days must be between 1 and 365")
    
    deleted = job_tracker.cleanup_old_jobs(days=days)
    return {
        "message": f"Cleaned up {deleted} old jobs",
        "deleted_count": deleted
    }

# Data endpoints
@app.get("/api/accounts", tags=["Data"])
async def get_accounts():
    """Get all available accounts"""
    accounts = data_service.get_accounts()
    return {"accounts": accounts}

@app.get("/api/platforms", tags=["Data"])
async def get_platforms():
    """Get all available platforms"""
    platforms = data_service.get_platforms()
    return {"platforms": platforms}

class DataRequest(BaseModel):
    start_date: str
    end_date: str
    accounts: List[str]
    platforms: List[str]
    range_type: str = "custom"

@app.post("/api/data", tags=["Data"])
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute" if settings.RATE_LIMIT_ENABLED else None)
async def fetch_data(request: Request, data_request: DataRequest):
    """
    Fetch data for specified date range, accounts, and platforms
    
    - **start_date**: Start date in YYYY-MM-DD format
    - **end_date**: End date in YYYY-MM-DD format
    - **accounts**: List of account IDs to filter by
    - **platforms**: List of platform IDs to filter by
    - **range_type**: Type of range ('today', 'this_month', 'custom')
    """
    try:
        result = data_service.fetch_data(
            start_date=data_request.start_date,
            end_date=data_request.end_date,
            accounts=data_request.accounts,
            platforms=data_request.platforms,
            range_type=data_request.range_type
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching data: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch data")

@app.post("/api/data/export", tags=["Data"])
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute" if settings.RATE_LIMIT_ENABLED else None)
async def export_data(request: Request, data_request: DataRequest):
    """
    Export data to CSV format
    
    Returns a CSV file with the requested data
    """
    try:
        csv_content = data_service.export_to_csv(
            start_date=data_request.start_date,
            end_date=data_request.end_date,
            accounts=data_request.accounts,
            platforms=data_request.platforms,
            range_type=data_request.range_type
        )
        
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=data-export-{data_request.start_date}-to-{data_request.end_date}.csv"
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error exporting data: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to export data")

# Writings endpoints
@app.get(
    "/api/writings",
    response_model=WritingsListResponse,
    tags=["Writings"],
    summary="Get All Writings",
    description="Retrieve all wonderful writings, ordered by most recent first. Supports advanced search with filters for category, genre, author, date range, and word count."
)
async def get_writings(
    skip: int = 0, 
    limit: int = 100, 
    search: Optional[str] = None,
    category: Optional[str] = None,
    genre: Optional[str] = None,
    author: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    min_word_count: Optional[int] = None,
    max_word_count: Optional[int] = None
):
    """
    Get all writings with advanced search and filtering options.
    
    - **search**: Text search in title, content, or author
    - **category**: Filter by category (e.g., "user", "curated")
    - **genre**: Filter by genre
    - **author**: Filter by author name
    - **start_date**: Filter by start date (YYYY-MM-DD format)
    - **end_date**: Filter by end date (YYYY-MM-DD format)
    - **min_word_count**: Minimum word count filter
    - **max_word_count**: Maximum word count filter
    """
    db = next(get_db())
    try:
        # Parse date strings if provided
        start_date_obj = None
        end_date_obj = None
        if start_date:
            try:
                start_date_obj = datetime.fromisoformat(start_date).date()
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD.")
        if end_date:
            try:
                end_date_obj = datetime.fromisoformat(end_date).date()
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD.")
        
        # Use unified search method that handles all filters
        writings = writings_service.search_writings(
            db=db,
            query=search,
            skip=skip,
            limit=limit,
            author=author,
            genre=genre,
            category=category,
            start_date=start_date_obj,
            end_date=end_date_obj,
            min_word_count=min_word_count,
            max_word_count=max_word_count
        )
        
        # Convert to response format
        writing_responses = [
            WritingResponse(
                id=w.id,
                title=w.title,
                content=w.content,
                author=w.author,
                category=getattr(w, 'category', 'user'),
                genre=getattr(w, 'genre', None),
                created_at=w.created_at.isoformat() + "Z",
                updated_at=w.updated_at.isoformat() + "Z"
            )
            for w in writings
        ]
        
        return WritingsListResponse(writings=writing_responses, count=len(writing_responses))
    finally:
        db.close()


@app.get(
    "/api/writings/{writing_id}",
    response_model=WritingResponse,
    tags=["Writings"],
    summary="Get Writing by ID",
    description="Retrieve a specific writing by its ID."
)
async def get_writing(writing_id: int):
    """Get a single writing by ID."""
    db = next(get_db())
    try:
        writing = writings_service.get_writing_by_id(db, writing_id)
        if not writing:
            raise HTTPException(status_code=404, detail="Writing not found")
        
        return WritingResponse(
            id=writing.id,
            title=writing.title,
            content=writing.content,
            author=writing.author,
            category=getattr(writing, 'category', 'user'),
            genre=getattr(writing, 'genre', None),
            created_at=writing.created_at.isoformat() + "Z",
            updated_at=writing.updated_at.isoformat() + "Z"
        )
    finally:
        db.close()


@app.post(
    "/api/writings",
    response_model=WritingResponse,
    tags=["Writings"],
    summary="Create New Writing",
    description="Create a new wonderful writing in the database."
)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute" if settings.RATE_LIMIT_ENABLED else None)
async def create_writing(request: Request, writing: WritingCreate):
    """Create a new writing."""
    db = next(get_db())
    try:
        new_writing = writings_service.create_writing(
            db=db,
            title=writing.title,
            content=writing.content,
            author=writing.author
        )
        
        # Track statistics (only for user writings, not curated)
        if getattr(new_writing, 'category', 'user') == 'user':
            word_count = statistics_service._calculate_word_count(writing.content)
            statistics_service.increment_writing_created(db, word_count)
            # Update goal progress
            statistics_service.update_goal_progress(db)
        
        return WritingResponse(
            id=new_writing.id,
            title=new_writing.title,
            content=new_writing.content,
            author=new_writing.author,
            category=getattr(new_writing, 'category', 'user'),
            genre=getattr(new_writing, 'genre', None),
            created_at=new_writing.created_at.isoformat() + "Z",
            updated_at=new_writing.updated_at.isoformat() + "Z"
        )
    except Exception as e:
        logger.error(f"Error creating writing: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create writing")
    finally:
        db.close()


@app.put(
    "/api/writings/{writing_id}",
    response_model=WritingResponse,
    tags=["Writings"],
    summary="Update Writing",
    description="Update an existing writing."
)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute" if settings.RATE_LIMIT_ENABLED else None)
async def update_writing(request: Request, writing_id: int, writing: WritingUpdate):
    """Update an existing writing."""
    db = next(get_db())
    try:
        updated_writing = writings_service.update_writing(
            db=db,
            writing_id=writing_id,
            title=writing.title,
            content=writing.content,
            author=writing.author
        )
        
        if not updated_writing:
            raise HTTPException(status_code=404, detail="Writing not found")
        
        return WritingResponse(
            id=updated_writing.id,
            title=updated_writing.title,
            content=updated_writing.content,
            author=updated_writing.author,
            category=getattr(updated_writing, 'category', 'user'),
            genre=getattr(updated_writing, 'genre', None),
            created_at=updated_writing.created_at.isoformat() + "Z",
            updated_at=updated_writing.updated_at.isoformat() + "Z"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating writing: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update writing")
    finally:
        db.close()


@app.delete(
    "/api/writings/{writing_id}",
    tags=["Writings"],
    summary="Delete Writing",
    description="Delete a writing from the database."
)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute" if settings.RATE_LIMIT_ENABLED else None)
async def delete_writing(request: Request, writing_id: int):
    """Delete a writing."""
    db = next(get_db())
    try:
        success = writings_service.delete_writing(db, writing_id)
        if not success:
            raise HTTPException(status_code=404, detail="Writing not found")
        
        return {"message": "Writing deleted successfully", "id": writing_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting writing: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete writing")
    finally:
        db.close()


@app.get(
    "/api/writings/stats",
    tags=["Writings"],
    summary="Get Writings Statistics",
    description="Get statistics about the writings database."
)
async def get_writings_stats():
    """Get statistics about writings."""
    db = next(get_db())
    try:
        total_count = writings_service.get_writings_count(db)
        curated_count = writings_service.get_writings_count(db, category="curated")
        user_count = writings_service.get_writings_count(db, category="user")
        genres = writings_service.get_genres(db)
        curated_genres = writings_service.get_genres(db, category="curated")
        return {
            "total_writings": total_count,
            "curated_writings": curated_count,
            "user_writings": user_count,
            "genres": genres,
            "curated_genres": curated_genres
        }
    finally:
        db.close()


@app.get(
    "/api/writings/curated",
    response_model=WritingsListResponse,
    tags=["Writings"],
    summary="Get Curated Amazing Writings",
    description="Retrieve curated amazing writings from literature, speeches, and poetry."
)
async def get_curated_writings(skip: int = 0, limit: int = 100, genre: Optional[str] = None):
    """Get curated amazing writings with optional genre filter."""
    db = next(get_db())
    try:
        writings = writings_service.get_curated_writings(db, skip, limit, genre=genre)
        
        # Convert to response format
        writing_responses = [
            WritingResponse(
                id=w.id,
                title=w.title,
                content=w.content,
                author=w.author,
                category=getattr(w, 'category', 'curated'),
                genre=getattr(w, 'genre', None),
                created_at=w.created_at.isoformat() + "Z",
                updated_at=w.updated_at.isoformat() + "Z"
            )
            for w in writings
        ]
        
        return WritingsListResponse(writings=writing_responses, count=len(writing_responses))
    finally:
        db.close()


@app.get(
    "/api/writings/genres",
    tags=["Writings"],
    summary="Get Available Genres",
    description="Get list of available genres for filtering writings."
)
async def get_genres(category: Optional[str] = None):
    """Get list of available genres, optionally filtered by category."""
    db = next(get_db())
    try:
        genres = writings_service.get_genres(db, category=category)
        return {"genres": genres, "count": len(genres)}
    finally:
        db.close()


# Conversation Practice endpoints
@app.post(
    "/api/conversation/prompts",
    response_model=ConversationPromptsResponse,
    tags=["Conversation"],
    summary="Generate Conversation Practice Prompts",
    description="Generate conversation practice prompts for a given topic using GPT."
)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute" if settings.RATE_LIMIT_ENABLED else None)
async def generate_conversation_prompts(request: Request, prompt_request: ConversationPromptRequest):
    """
    Generate conversation practice prompts for a topic.
    
    - **topic**: The topic the user wants to practice speaking about
    - **count**: Number of prompts to generate (1-10, default: 5)
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"[{request_id}] Generating {prompt_request.count} prompts for topic: {prompt_request.topic}")
        
        prompts_data = conversation_service.generate_prompts(
            topic=prompt_request.topic,
            count=prompt_request.count
        )
        
        # Convert to response format
        prompts = [
            ConversationPrompt(question=p["question"], context=p["context"])
            for p in prompts_data
        ]
        
        logger.info(f"[{request_id}] Generated {len(prompts)} prompts successfully")
        
        return ConversationPromptsResponse(
            prompts=prompts,
            topic=prompt_request.topic,
            count=len(prompts)
        )
    except ServiceNotAvailableException as e:
        logger.warning(f"[{request_id}] Conversation service unavailable: {e}")
        raise HTTPException(
            status_code=503,
            detail=str(e)
        )
    except ValidationException as e:
        logger.warning(f"[{request_id}] Validation error: {e}")
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"[{request_id}] Error generating prompts: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to generate conversation prompts"
        )


@app.get(
    "/api/conversation/status",
    tags=["Conversation"],
    summary="Check Conversation Service Status",
    description="Check if the conversation service (GPT API) is available."
)
async def get_conversation_status():
    """Check if conversation service is available."""
    return {
        "available": conversation_service.is_available(),
        "service": "OpenAI GPT"
    }


# Interactive Conversation endpoints
@app.post(
    "/api/conversation/interactive/start",
    response_model=InteractiveConversationResponse,
    tags=["Conversation"],
    summary="Start Interactive Conversation",
    description="Start a new interactive conversation on a topic. Returns AI's opening message and audio."
)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute" if settings.RATE_LIMIT_ENABLED else None)
async def start_interactive_conversation(request: Request, conv_request: InteractiveConversationStartRequest):
    """
    Start a new interactive conversation on a topic.
    
    - **topic**: The topic to practice discussing
    - **voice**: Voice identifier for TTS (default: af_bella)
    - **speed**: Speech speed multiplier (0.5-2.0, default: 1.0)
    
    Returns both text response and audio for the AI's opening message.
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"[{request_id}] Starting interactive conversation on topic: {conv_request.topic}")
        
        # Start conversation with GPT
        conversation_data = interactive_conversation_service.start_conversation(conv_request.topic)
        ai_message = conversation_data.get("message")
        
        if not ai_message:
            raise HTTPException(
                status_code=500,
                detail="Received empty message from conversation service"
            )
        
        logger.debug(f"[{request_id}] Generated AI message (length: {len(ai_message)} chars)")
        
        # Generate TTS audio for the response
        audio_url = None
        if tts_service and ai_message:
            try:
                logger.debug(f"[{request_id}] Generating TTS audio for message")
                audio, sample_rate = tts_service.generate_audio(
                    ai_message,
                    conv_request.voice,
                    conv_request.speed
                )
                
                # Convert audio to base64 for easy transmission
                import base64
                import io
                buffer = io.BytesIO()
                sf.write(buffer, audio, sample_rate, format='WAV')
                buffer.seek(0)
                audio_bytes = buffer.getvalue()
                audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
                audio_url = f"data:audio/wav;base64,{audio_base64}"
                
                logger.debug(f"[{request_id}] TTS audio generated successfully ({len(audio_bytes)} bytes)")
                
            except Exception as e:
                logger.warning(f"[{request_id}] Failed to generate TTS audio: {e}", exc_info=True)
                # Continue without audio if TTS fails - conversation can still proceed
                pipeline_health.record_error(
                    "tts_service",
                    "TTSGenerationError",
                    f"Failed to generate TTS for conversation: {str(e)}",
                    context={"request_id": request_id, "message_length": len(ai_message)}
                )
        
        logger.info(f"[{request_id}] Conversation started successfully")
        
        return InteractiveConversationResponse(
            message=ai_message,
            topic=conv_request.topic,
            audio_url=audio_url
        )
        
    except ServiceNotAvailableException as e:
        logger.warning(f"[{request_id}] Interactive conversation service unavailable: {e}")
        raise HTTPException(
            status_code=503,
            detail=str(e)
        )
    except ValidationException as e:
        logger.warning(f"[{request_id}] Validation error: {e}")
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"[{request_id}] Error starting conversation: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to start conversation"
        )


@app.post(
    "/api/conversation/interactive/continue",
    response_model=InteractiveConversationResponse,
    tags=["Conversation"],
    summary="Continue Interactive Conversation",
    description="Continue an interactive conversation. Returns AI's response with text and audio."
)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute" if settings.RATE_LIMIT_ENABLED else None)
async def continue_interactive_conversation(request: Request, conv_request: InteractiveConversationContinueRequest):
    """
    Continue an interactive conversation.
    
    - **topic**: The topic being discussed
    - **user_message**: The user's message
    - **conversation_history**: Previous messages in the conversation
    - **voice**: Voice identifier for TTS (default: af_bella)
    - **speed**: Speech speed multiplier (0.5-2.0, default: 1.0)
    
    Returns both text response and audio for the AI's reply.
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"[{request_id}] Continuing conversation on topic: {conv_request.topic}")
        
        # Format conversation history with validation
        history = []
        for msg in conv_request.conversation_history:
            if msg.role in ["user", "assistant"] and msg.content:
                history.append({"role": msg.role, "content": msg.content})
        
        # Add user's current message
        if conv_request.user_message:
            history.append({"role": "user", "content": conv_request.user_message})
        
        logger.debug(f"[{request_id}] Continuing conversation with {len(history)} messages in history")
        
        # Get AI response from GPT
        ai_message = interactive_conversation_service.continue_conversation(
            conv_request.topic,
            history
        )
        
        if not ai_message:
            raise HTTPException(
                status_code=500,
                detail="Received empty message from conversation service"
            )
        
        logger.debug(f"[{request_id}] Generated AI response (length: {len(ai_message)} chars)")
        
        # Generate TTS audio for the response
        audio_url = None
        if tts_service and ai_message:
            try:
                logger.debug(f"[{request_id}] Generating TTS audio for response")
                audio, sample_rate = tts_service.generate_audio(
                    ai_message,
                    conv_request.voice,
                    conv_request.speed
                )
                
                # Convert audio to base64 for easy transmission
                import base64
                import io
                buffer = io.BytesIO()
                sf.write(buffer, audio, sample_rate, format='WAV')
                buffer.seek(0)
                audio_bytes = buffer.getvalue()
                audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
                audio_url = f"data:audio/wav;base64,{audio_base64}"
                
                logger.debug(f"[{request_id}] TTS audio generated successfully ({len(audio_bytes)} bytes)")
                
            except Exception as e:
                logger.warning(f"[{request_id}] Failed to generate TTS audio: {e}", exc_info=True)
                # Continue without audio if TTS fails - conversation can still proceed
                pipeline_health.record_error(
                    "tts_service",
                    "TTSGenerationError",
                    f"Failed to generate TTS for conversation: {str(e)}",
                    context={"request_id": request_id, "message_length": len(ai_message)}
                )
        
        logger.info(f"[{request_id}] Conversation continued successfully")
        
        return InteractiveConversationResponse(
            message=ai_message,
            topic=conv_request.topic,
            audio_url=audio_url
        )
        
    except ServiceNotAvailableException as e:
        logger.warning(f"[{request_id}] Interactive conversation service unavailable: {e}")
        raise HTTPException(
            status_code=503,
            detail=str(e)
        )
    except ValidationException as e:
        logger.warning(f"[{request_id}] Validation error: {e}")
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"[{request_id}] Error continuing conversation: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to continue conversation"
        )


@app.get(
    "/api/conversation/interactive/status",
    tags=["Conversation"],
    summary="Check Interactive Conversation Service Status",
    description="Check if the interactive conversation service is available."
)
async def get_interactive_conversation_status():
    """Check if interactive conversation service is available."""
    return {
        "available": interactive_conversation_service.is_available(),
        "service": "OpenAI GPT",
        "tts_available": tts_service is not None
    }


# Rhetorical Device Practice endpoints
@app.get(
    "/api/rhetorical-devices/list",
    tags=["Rhetorical Devices"],
    summary="Get Available Rhetorical Devices",
    description="Get a list of all available rhetorical devices with descriptions."
)
async def get_rhetorical_devices():
    """Get all available rhetorical devices."""
    devices = rhetorical_device_service.get_available_devices()
    return {
        "devices": devices,
        "count": len(devices)
    }


@app.post(
    "/api/rhetorical-devices/practice",
    response_model=RhetoricalDevicePracticeResponse,
    tags=["Rhetorical Devices"],
    summary="Generate Rhetorical Device Practice Prompts",
    description="Generate writing practice prompts that incorporate specific rhetorical devices for a given topic."
)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute" if settings.RATE_LIMIT_ENABLED else None)
async def generate_rhetorical_device_prompts(request: Request, practice_request: RhetoricalDevicePracticeRequest):
    """
    Generate rhetorical device practice prompts for a topic.
    
    - **topic**: The topic the user wants to practice writing about
    - **devices**: List of rhetorical devices to incorporate (1-10 devices)
    - **count**: Number of prompts to generate (1-10, default: 3)
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"[{request_id}] Generating {practice_request.count} prompts for topic: {practice_request.topic} with devices: {practice_request.devices}")
        
        prompts_data = rhetorical_device_service.generate_prompts(
            topic=practice_request.topic,
            devices=practice_request.devices,
            count=practice_request.count
        )
        
        # Convert to response format
        prompts = [
            RhetoricalDevicePrompt(
                prompt=p["prompt"],
                devices=p["devices"],
                examples=p.get("examples")
            )
            for p in prompts_data
        ]
        
        logger.info(f"[{request_id}] Generated {len(prompts)} prompts successfully")
        
        return RhetoricalDevicePracticeResponse(
            prompts=prompts,
            topic=practice_request.topic,
            devices=practice_request.devices,
            count=len(prompts)
        )
    except ServiceNotAvailableException as e:
        logger.warning(f"[{request_id}] Rhetorical device service unavailable: {e}")
        raise HTTPException(
            status_code=503,
            detail=str(e)
        )
    except ValidationException as e:
        logger.warning(f"[{request_id}] Validation error: {e}")
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"[{request_id}] Error generating prompts: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to generate rhetorical device practice prompts"
        )


@app.get(
    "/api/rhetorical-devices/status",
    tags=["Rhetorical Devices"],
    summary="Check Rhetorical Device Service Status",
    description="Check if the rhetorical device service (GPT API) is available."
)
async def get_rhetorical_device_status():
    """Check if rhetorical device service is available."""
    return {
        "available": rhetorical_device_service.is_available(),
        "service": "OpenAI GPT"
    }


# Speech Practice endpoints
@app.post(
    "/api/speeches",
    response_model=SpeechResponse,
    tags=["Speeches"],
    summary="Generate Practice Speech",
    description="Generate a sophisticated practice speech for a given topic using a 5-prompt system."
)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute" if settings.RATE_LIMIT_ENABLED else None)
async def create_speech(request: Request, speech_request: SpeechCreate):
    """
    Generate a practice speech for a topic.
    
    - **topic**: The topic to generate a speech about
    
    This endpoint uses a sophisticated 5-prompt system to generate an eloquent,
    intellectually sophisticated, and deeply engaging speech that can be practiced
    and played using the TTS system.
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        logger.info(f"[{request_id}] Generating speech for topic: {speech_request.topic}")
        
        # Generate speech content using the 5-prompt system
        speech_content = speech_service.generate_speech(speech_request.topic)
        
        # Save to database
        db = next(get_db())
        try:
            new_speech = speeches_service.create_speech(
                db=db,
                topic=speech_request.topic,
                content=speech_content
            )
            
            # Track statistics
            statistics_service.increment_speech_practiced(db)
            statistics_service.update_goal_progress(db)
            
            logger.info(f"[{request_id}] Speech generated successfully with ID {new_speech.id}")
            
            return SpeechResponse(
                id=new_speech.id,
                topic=new_speech.topic,
                content=new_speech.content,
                created_at=new_speech.created_at.isoformat() + "Z",
                updated_at=new_speech.updated_at.isoformat() + "Z"
            )
        finally:
            db.close()
            
    except ServiceNotAvailableException as e:
        logger.warning(f"[{request_id}] Speech service unavailable: {e}")
        raise HTTPException(
            status_code=503,
            detail=str(e)
        )
    except ValidationException as e:
        logger.warning(f"[{request_id}] Validation error: {e}")
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"[{request_id}] Error generating speech: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to generate speech"
        )


@app.get(
    "/api/speeches",
    response_model=SpeechesListResponse,
    tags=["Speeches"],
    summary="Get All Speeches",
    description="Retrieve all practice speeches, ordered by most recent first."
)
async def get_speeches(skip: int = 0, limit: int = 100, search: Optional[str] = None):
    """Get all speeches with optional search."""
    db = next(get_db())
    try:
        if search:
            speeches = speeches_service.search_speeches(db, search, skip, limit)
        else:
            speeches = speeches_service.get_all_speeches(db, skip, limit)
        
        # Convert to response format
        speech_responses = [
            SpeechResponse(
                id=s.id,
                topic=s.topic,
                content=s.content,
                created_at=s.created_at.isoformat() + "Z",
                updated_at=s.updated_at.isoformat() + "Z"
            )
            for s in speeches
        ]
        
        return SpeechesListResponse(speeches=speech_responses, count=len(speech_responses))
    finally:
        db.close()


@app.get(
    "/api/speeches/{speech_id}",
    response_model=SpeechResponse,
    tags=["Speeches"],
    summary="Get Speech by ID",
    description="Retrieve a specific speech by its ID."
)
async def get_speech(speech_id: int):
    """Get a single speech by ID."""
    db = next(get_db())
    try:
        speech = speeches_service.get_speech_by_id(db, speech_id)
        if not speech:
            raise HTTPException(status_code=404, detail="Speech not found")
        
        return SpeechResponse(
            id=speech.id,
            topic=speech.topic,
            content=speech.content,
            created_at=speech.created_at.isoformat() + "Z",
            updated_at=speech.updated_at.isoformat() + "Z"
        )
    finally:
        db.close()


@app.delete(
    "/api/speeches/{speech_id}",
    tags=["Speeches"],
    summary="Delete Speech",
    description="Delete a speech from the database."
)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute" if settings.RATE_LIMIT_ENABLED else None)
async def delete_speech(request: Request, speech_id: int):
    """Delete a speech."""
    db = next(get_db())
    try:
        success = speeches_service.delete_speech(db, speech_id)
        if not success:
            raise HTTPException(status_code=404, detail="Speech not found")
        
        return {"message": "Speech deleted successfully", "id": speech_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting speech: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete speech")
    finally:
        db.close()


@app.get(
    "/api/speeches/stats",
    tags=["Speeches"],
    summary="Get Speeches Statistics",
    description="Get statistics about the speeches database."
)
async def get_speeches_stats():
    """Get statistics about speeches."""
    db = next(get_db())
    try:
        count = speeches_service.get_speeches_count(db)
        return {"total_speeches": count}
    finally:
        db.close()


@app.get(
    "/api/speeches/status",
    tags=["Speeches"],
    summary="Check Speech Service Status",
    description="Check if the speech service (GPT API) is available."
)
async def get_speech_status():
    """Check if speech service is available."""
    return {
        "available": speech_service.is_available(),
        "service": "OpenAI GPT"
    }


# Poetry endpoints
@app.get(
    "/api/poetry/styles",
    response_model=PoetryStylesResponse,
    tags=["Poetry"],
    summary="Get Available Poetry Styles",
    description="Retrieve a list of available poetry styles with descriptions."
)
async def get_poetry_styles():
    """Get list of available poetry styles."""
    styles = [
        {
            "name": "Haiku",
            "description": "A traditional Japanese 3-line poem with a 5-7-5 syllable pattern. Focuses on nature and moments of beauty.",
            "example": "An old silent pond...\nA frog jumps into the pond—\nSplash! Silence again."
        },
        {
            "name": "Sonnet",
            "description": "A 14-line poem, typically with iambic pentameter. Shakespearean sonnets use ABAB CDCD EFEF GG rhyme scheme.",
            "example": "Shall I compare thee to a summer's day?\nThou art more lovely and more temperate..."
        },
        {
            "name": "Free Verse",
            "description": "Poetry without a fixed pattern of meter or rhyme. Allows for natural flow and expression.",
            "example": "The wind whispers secrets\nThrough the leaves\nAnd I listen."
        },
        {
            "name": "Limerick",
            "description": "A humorous 5-line poem with AABBA rhyme scheme. Often playful and witty.",
            "example": "There once was a man from Peru\nWho dreamed he was eating his shoe\nHe woke with a fright\nIn the middle of the night\nTo find that his dream had come true."
        },
        {
            "name": "Acrostic",
            "description": "A poem where the first letter of each line spells out a word or message.",
            "example": "S - Sunlight streaming through\nU - Understanding grows\nN - Nature's beauty shows"
        },
        {
            "name": "Villanelle",
            "description": "A 19-line poem with five tercets and a final quatrain. Uses repeated lines for emphasis.",
            "example": "Do not go gentle into that good night,\nOld age should burn and rave at close of day..."
        },
        {
            "name": "Ode",
            "description": "A lyrical poem addressing a person, place, thing, or idea. Often celebratory in tone.",
            "example": "O wild West Wind, thou breath of Autumn's being..."
        },
        {
            "name": "Ballad",
            "description": "A narrative poem, often with a simple rhyme scheme, telling a story or legend.",
            "example": "The highwayman came riding—\nRiding—riding—\nThe highwayman came riding, up to the old inn-door."
        }
    ]
    
    return PoetryStylesResponse(styles=styles, count=len(styles))


@app.get(
    "/api/poems",
    response_model=PoemsListResponse,
    tags=["Poetry"],
    summary="Get All Poems",
    description="Retrieve all user-created poems, ordered by most recent first."
)
async def get_poems(skip: int = 0, limit: int = 100, search: Optional[str] = None):
    """Get all poems with optional search."""
    db = next(get_db())
    try:
        if search:
            poems = poems_service.search_poems(db, search, skip, limit)
        else:
            poems = poems_service.get_all_poems(db, skip, limit)
        
        # Convert to response format
        poem_responses = [
            PoemResponse(
                id=p.id,
                title=p.title,
                content=p.content,
                style=p.style,
                audio_url=p.audio_url,
                created_at=p.created_at.isoformat() + "Z",
                updated_at=p.updated_at.isoformat() + "Z"
            )
            for p in poems
        ]
        
        return PoemsListResponse(poems=poem_responses, count=len(poem_responses))
    finally:
        db.close()


@app.get(
    "/api/poems/{poem_id}",
    response_model=PoemResponse,
    tags=["Poetry"],
    summary="Get Poem by ID",
    description="Retrieve a specific poem by its ID."
)
async def get_poem(poem_id: int):
    """Get a single poem by ID."""
    db = next(get_db())
    try:
        poem = poems_service.get_poem_by_id(db, poem_id)
        if not poem:
            raise HTTPException(status_code=404, detail="Poem not found")
        
        return PoemResponse(
            id=poem.id,
            title=poem.title,
            content=poem.content,
            style=poem.style,
            audio_url=poem.audio_url,
            created_at=poem.created_at.isoformat() + "Z",
            updated_at=poem.updated_at.isoformat() + "Z"
        )
    finally:
        db.close()


@app.post(
    "/api/poems",
    response_model=PoemResponse,
    tags=["Poetry"],
    summary="Create New Poem",
    description="Create a new poem with optional title, style, and audio recording."
)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute" if settings.RATE_LIMIT_ENABLED else None)
async def create_poem(request: Request, poem: PoemCreate):
    """Create a new poem."""
    db = next(get_db())
    try:
        new_poem = poems_service.create_poem(
            db=db,
            title=poem.title,
            content=poem.content,
            style=poem.style,
            audio_url=poem.audio_url
        )
        
        # Track statistics
        word_count = statistics_service._calculate_word_count(poem.content)
        statistics_service.increment_poem_created(db, word_count)
        statistics_service.update_goal_progress(db)
        
        return PoemResponse(
            id=new_poem.id,
            title=new_poem.title,
            content=new_poem.content,
            style=new_poem.style,
            audio_url=new_poem.audio_url,
            created_at=new_poem.created_at.isoformat() + "Z",
            updated_at=new_poem.updated_at.isoformat() + "Z"
        )
    except Exception as e:
        logger.error(f"Error creating poem: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create poem")
    finally:
        db.close()


@app.put(
    "/api/poems/{poem_id}",
    response_model=PoemResponse,
    tags=["Poetry"],
    summary="Update Poem",
    description="Update an existing poem."
)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute" if settings.RATE_LIMIT_ENABLED else None)
async def update_poem(request: Request, poem_id: int, poem: PoemUpdate):
    """Update an existing poem."""
    db = next(get_db())
    try:
        updated_poem = poems_service.update_poem(
            db=db,
            poem_id=poem_id,
            title=poem.title,
            content=poem.content,
            style=poem.style,
            audio_url=poem.audio_url
        )
        
        if not updated_poem:
            raise HTTPException(status_code=404, detail="Poem not found")
        
        return PoemResponse(
            id=updated_poem.id,
            title=updated_poem.title,
            content=updated_poem.content,
            style=updated_poem.style,
            audio_url=updated_poem.audio_url,
            created_at=updated_poem.created_at.isoformat() + "Z",
            updated_at=updated_poem.updated_at.isoformat() + "Z"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating poem: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update poem")
    finally:
        db.close()


@app.delete(
    "/api/poems/{poem_id}",
    tags=["Poetry"],
    summary="Delete Poem",
    description="Delete a poem from the database."
)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute" if settings.RATE_LIMIT_ENABLED else None)
async def delete_poem(request: Request, poem_id: int):
    """Delete a poem."""
    db = next(get_db())
    try:
        success = poems_service.delete_poem(db, poem_id)
        if not success:
            raise HTTPException(status_code=404, detail="Poem not found")
        
        return {"message": "Poem deleted successfully", "id": poem_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting poem: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete poem")
    finally:
        db.close()


@app.get(
    "/api/poems/stats",
    tags=["Poetry"],
    summary="Get Poems Statistics",
    description="Get statistics about the poems database."
)
async def get_poems_stats():
    """Get statistics about poems."""
    db = next(get_db())
    try:
        count = poems_service.get_poems_count(db)
        return {"total_poems": count}
    finally:
        db.close()


# Statistics endpoints
@app.get(
    "/api/stats/daily",
    response_model=DailyStatisticsResponse,
    tags=["Statistics"],
    summary="Get Daily Statistics",
    description="Get daily statistics for a specific date or today."
)
async def get_daily_stats(date: Optional[str] = None):
    """Get daily statistics."""
    db = next(get_db())
    try:
        target_date = None
        if date:
            try:
                target_date = datetime.fromisoformat(date.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format. Use ISO format (YYYY-MM-DD).")
        
        stats = statistics_service.get_daily_stats(db, target_date)
        return DailyStatisticsResponse(**stats)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting daily stats: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get daily statistics")
    finally:
        db.close()


@app.get(
    "/api/stats/weekly",
    response_model=WeeklyStatisticsResponse,
    tags=["Statistics"],
    summary="Get Weekly Statistics",
    description="Get weekly statistics for the last 7 days ending on a specific date or today."
)
async def get_weekly_stats(end_date: Optional[str] = None):
    """Get weekly statistics."""
    db = next(get_db())
    try:
        target_end_date = None
        if end_date:
            try:
                target_end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format. Use ISO format (YYYY-MM-DD).")
        
        stats = statistics_service.get_weekly_stats(db, target_end_date)
        return WeeklyStatisticsResponse(**stats)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting weekly stats: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get weekly statistics")
    finally:
        db.close()


@app.get(
    "/api/stats/monthly",
    response_model=MonthlyStatisticsResponse,
    tags=["Statistics"],
    summary="Get Monthly Statistics",
    description="Get monthly statistics for a specific month and year or current month."
)
async def get_monthly_stats(month: Optional[int] = None, year: Optional[int] = None):
    """Get monthly statistics."""
    db = next(get_db())
    try:
        if month is not None and (month < 1 or month > 12):
            raise HTTPException(status_code=400, detail="Month must be between 1 and 12.")
        if year is not None and year < 2000:
            raise HTTPException(status_code=400, detail="Year must be 2000 or later.")
        
        stats = statistics_service.get_monthly_stats(db, month, year)
        return MonthlyStatisticsResponse(**stats)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting monthly stats: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get monthly statistics")
    finally:
        db.close()


@app.get(
    "/api/stats/streak",
    response_model=StreakResponse,
    tags=["Statistics"],
    summary="Get Streak Information",
    description="Get the current consecutive days streak."
)
async def get_streak():
    """Get streak information."""
    db = next(get_db())
    try:
        streak = statistics_service.calculate_streak(db)
        return StreakResponse(streak_days=streak)
    except Exception as e:
        logger.error(f"Error getting streak: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get streak information")
    finally:
        db.close()


@app.get(
    "/api/stats/summary",
    response_model=StatisticsSummaryResponse,
    tags=["Statistics"],
    summary="Get Statistics Summary",
    description="Get a summary of all statistics including streak, today's stats, weekly stats, and goals."
)
async def get_stats_summary():
    """Get comprehensive statistics summary."""
    db = next(get_db())
    try:
        # Update goal progress first
        statistics_service.update_goal_progress(db)
        
        # Get all statistics
        streak = statistics_service.calculate_streak(db)
        today_stats = statistics_service.get_daily_stats(db)
        weekly_stats = statistics_service.get_weekly_stats(db)
        goals = statistics_service.get_all_goals(db, active_only=True)
        
        return StatisticsSummaryResponse(
            streak=StreakResponse(streak_days=streak),
            today_stats=DailyStatisticsResponse(**today_stats),
            weekly_stats=WeeklyStatisticsResponse(**weekly_stats),
            goals=[UserGoalResponse(**goal) for goal in goals]
        )
    except Exception as e:
        logger.error(f"Error getting stats summary: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get statistics summary")
    finally:
        db.close()


# Goal endpoints
@app.get(
    "/api/goals",
    response_model=UserGoalsListResponse,
    tags=["Goals"],
    summary="Get All User Goals",
    description="Get all user goals, optionally filtered by active status."
)
async def get_goals(active_only: bool = True):
    """Get all user goals."""
    db = next(get_db())
    try:
        goals = statistics_service.get_all_goals(db, active_only=active_only)
        return UserGoalsListResponse(
            goals=[UserGoalResponse(**goal) for goal in goals],
            count=len(goals)
        )
    except Exception as e:
        logger.error(f"Error getting goals: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get goals")
    finally:
        db.close()


@app.post(
    "/api/goals",
    response_model=UserGoalResponse,
    tags=["Goals"],
    summary="Create User Goal",
    description="Create a new user training goal."
)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute" if settings.RATE_LIMIT_ENABLED else None)
async def create_goal(request: Request, goal_data: UserGoalCreate):
    """Create a new user goal."""
    db = next(get_db())
    try:
        goal = statistics_service.create_goal(
            db,
            goal_data.goal_type,
            goal_data.target_value,
            goal_data.period
        )
        
        # Update goal progress
        statistics_service.update_goal_progress(db)
        
        goal_dict = statistics_service.get_all_goals(db, active_only=False)
        goal_dict = next((g for g in goal_dict if g["id"] == goal.id), None)
        
        if not goal_dict:
            raise HTTPException(status_code=500, detail="Failed to retrieve created goal")
        
        return UserGoalResponse(**goal_dict)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating goal: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create goal")
    finally:
        db.close()


@app.put(
    "/api/goals/{goal_id}",
    response_model=UserGoalResponse,
    tags=["Goals"],
    summary="Update User Goal",
    description="Update an existing user goal."
)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute" if settings.RATE_LIMIT_ENABLED else None)
async def update_goal(request: Request, goal_id: int, goal_data: UserGoalUpdate):
    """Update a user goal."""
    db = next(get_db())
    try:
        goal = statistics_service.update_goal(
            db,
            goal_id,
            goal_data.target_value,
            goal_data.is_active
        )
        
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")
        
        # Update goal progress
        statistics_service.update_goal_progress(db)
        
        goal_dict = statistics_service.get_all_goals(db, active_only=False)
        goal_dict = next((g for g in goal_dict if g["id"] == goal.id), None)
        
        if not goal_dict:
            raise HTTPException(status_code=500, detail="Failed to retrieve updated goal")
        
        return UserGoalResponse(**goal_dict)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating goal: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update goal")
    finally:
        db.close()


@app.delete(
    "/api/goals/{goal_id}",
    tags=["Goals"],
    summary="Delete User Goal",
    description="Delete a user goal."
)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute" if settings.RATE_LIMIT_ENABLED else None)
async def delete_goal(request: Request, goal_id: int):
    """Delete a user goal."""
    db = next(get_db())
    try:
        success = statistics_service.delete_goal(db, goal_id)
        if not success:
            raise HTTPException(status_code=404, detail="Goal not found")
        
        return {"message": "Goal deleted successfully", "id": goal_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting goal: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete goal")
    finally:
        db.close()


# Startup event
@app.on_event("startup")
async def startup_event():
    """Log startup information and verify services."""
    logger.info("=" * 60)
    logger.info(f"Prose and Pause API starting up...")
    logger.info(f"Version: {settings.APP_VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"TTS Service: {'✓ Available' if tts_service else '✗ Unavailable'}")
    if tts_service:
        try:
            voices = tts_service.get_voices()
            logger.info(f"Available voices: {len(voices)}")
        except:
            pass
    logger.info(f"Conversation Service: {'✓ Available' if conversation_service.is_available() else '✗ Unavailable (OpenAI API key not set)'}")
    logger.info(f"Rhetorical Device Service: {'✓ Available' if rhetorical_device_service.is_available() else '✗ Unavailable (OpenAI API key not set)'}")
    logger.info(f"Speech Service: {'✓ Available' if speech_service.is_available() else '✗ Unavailable (OpenAI API key not set)'}")
    logger.info(f"Rate limiting: {'Enabled' if settings.RATE_LIMIT_ENABLED else 'Disabled'}")
    logger.info(f"Job Tracker: {'✓ Available' if job_tracker else '✗ Unavailable'}")
    logger.info(f"Cleanup Scheduler: {'✓ Available' if cleanup_scheduler else '✗ Unavailable'}")
    logger.info(f"Debug mode: {'Enabled' if settings.DEBUG else 'Disabled'}")
    
    # Start cleanup scheduler
    if cleanup_scheduler:
        try:
            cleanup_scheduler.start()
            logger.info("Cleanup scheduler started")
        except Exception as e:
            logger.error(f"Failed to start cleanup scheduler: {e}", exc_info=True)
    
    logger.info("=" * 60)

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Log shutdown information and cleanup."""
    logger.info("Prose and Pause API shutting down...")
    
    # Stop cleanup scheduler
    if cleanup_scheduler:
        try:
            cleanup_scheduler.stop()
            logger.info("Cleanup scheduler stopped")
        except Exception as e:
            logger.error(f"Error stopping cleanup scheduler: {e}", exc_info=True)
    
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
