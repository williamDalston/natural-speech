"""
System monitoring endpoints.
"""
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from monitoring import system_monitor
from config import settings

router = APIRouter(prefix="/api/system", tags=["System"])


@router.get("/metrics")
async def get_system_metrics():
    """Get detailed system metrics."""
    if not settings.ENABLE_METRICS:
        return JSONResponse(
            status_code=403,
            content={"error": "Metrics collection is disabled"}
        )
    
    return system_monitor.get_system_metrics()


@router.get("/health")
async def get_system_health():
    """Get system health status."""
    if not settings.ENABLE_METRICS:
        return JSONResponse(
            status_code=403,
            content={"error": "Metrics collection is disabled"}
        )
    
    return system_monitor.get_health_status()

