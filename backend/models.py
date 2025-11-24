"""
Pydantic models for request/response validation.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional
import re


class ErrorResponse(BaseModel):
    """Standard error response model."""
    error: bool = True
    error_code: str
    message: str
    detail: Optional[str] = None

    class Config:
        schema_extra = {
            "example": {
                "error": True,
                "error_code": "VALIDATION_ERROR",
                "message": "Input validation failed",
                "detail": "Text must be between 1 and 5000 characters"
            }
        }


class TTSRequest(BaseModel):
    """Request model for text-to-speech generation."""
    text: str = Field(..., min_length=1, max_length=5000, description="Text to convert to speech")
    voice: str = Field(default="af_bella", description="Voice identifier to use")
    speed: float = Field(default=1.0, ge=0.5, le=2.0, description="Speech speed multiplier (0.5-2.0)")

    @validator('text')
    def validate_text(cls, v):
        if not v or not v.strip():
            raise ValueError("Text cannot be empty or only whitespace")
        return v.strip()

    @validator('speed')
    def validate_speed(cls, v):
        if not isinstance(v, (int, float)):
            raise ValueError("Speed must be a number")
        if v < 0.5 or v > 2.0:
            raise ValueError("Speed must be between 0.5 and 2.0")
        return float(v)

    class Config:
        schema_extra = {
            "example": {
                "text": "Hello, this is a test of the text-to-speech system.",
                "voice": "af_bella",
                "speed": 1.0
            }
        }


class AvatarRequest(BaseModel):
    """Request model for avatar generation (used for validation, actual request uses Form data)."""
    text: str = Field(..., min_length=1, max_length=5000, description="Text to convert to speech")
    voice: str = Field(..., description="Voice identifier to use")
    speed: float = Field(default=1.0, ge=0.5, le=2.0, description="Speech speed multiplier (0.5-2.0)")

    @validator('text')
    def validate_text(cls, v):
        if not v or not v.strip():
            raise ValueError("Text cannot be empty or only whitespace")
        return v.strip()

    @validator('speed')
    def validate_speed(cls, v):
        if not isinstance(v, (int, float)):
            raise ValueError("Speed must be a number")
        if v < 0.5 or v > 2.0:
            raise ValueError("Speed must be between 0.5 and 2.0")
        return float(v)

    class Config:
        schema_extra = {
            "example": {
                "text": "Hello, this is a test of the avatar generation system.",
                "voice": "af_bella",
                "speed": 1.0
            }
        }


class HealthResponse(BaseModel):
    """Health check response model."""
    status: str
    timestamp: str
    version: str = "1.0.0"

    class Config:
        schema_extra = {
            "example": {
                "status": "healthy",
                "timestamp": "2024-01-01T00:00:00Z",
                "version": "1.0.0"
            }
        }


class StatusResponse(BaseModel):
    """Service status response model."""
    status: str
    services: dict
    timestamp: str

    class Config:
        schema_extra = {
            "example": {
                "status": "operational",
                "services": {
                    "tts": "available",
                    "avatar": "available"
                },
                "timestamp": "2024-01-01T00:00:00Z"
            }
        }


class VoicesResponse(BaseModel):
    """Response model for available voices."""
    voices: list[str]
    count: int

    class Config:
        schema_extra = {
            "example": {
                "voices": ["af_bella", "af_sarah", "am_michael"],
                "count": 3
            }
        }

