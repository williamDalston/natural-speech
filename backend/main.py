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
from data_service import data_service
from writings_service import writings_service
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
    WritingCreate, WritingUpdate, WritingResponse, WritingsListResponse
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
            "pipeline_errors": "/api/pipeline/errors"
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
    description="Retrieve all wonderful writings, ordered by most recent first."
)
async def get_writings(skip: int = 0, limit: int = 100, search: Optional[str] = None):
    """Get all writings with optional search."""
    db = next(get_db())
    try:
        if search:
            writings = writings_service.search_writings(db, search, skip, limit)
        else:
            writings = writings_service.get_all_writings(db, skip, limit)
        
        # Convert to response format
        writing_responses = [
            WritingResponse(
                id=w.id,
                title=w.title,
                content=w.content,
                author=w.author,
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
        
        return WritingResponse(
            id=new_writing.id,
            title=new_writing.title,
            content=new_writing.content,
            author=new_writing.author,
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
        count = writings_service.get_writings_count(db)
        return {"total_writings": count}
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
    logger.info(f"Rate limiting: {'Enabled' if settings.RATE_LIMIT_ENABLED else 'Disabled'}")
    logger.info(f"Debug mode: {'Enabled' if settings.DEBUG else 'Disabled'}")
    logger.info("=" * 60)

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Log shutdown information and cleanup."""
    logger.info("Prose and Pause API shutting down...")
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
