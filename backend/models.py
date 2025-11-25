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
                "detail": "Text cannot be empty"
            }
        }


class TTSRequest(BaseModel):
    """Request model for text-to-speech generation."""
    text: str = Field(..., min_length=1, description="Text to convert to speech (supports text of any length)")
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


class WritingCreate(BaseModel):
    """Request model for creating a new writing."""
    title: Optional[str] = Field(None, max_length=200, description="Optional title for the writing")
    content: str = Field(..., min_length=1, max_length=50000, description="The text content")
    author: Optional[str] = Field(None, max_length=200, description="Optional author name")

    @validator('content')
    def validate_content(cls, v):
        if not v or not v.strip():
            raise ValueError("Content cannot be empty or only whitespace")
        return v.strip()

    class Config:
        schema_extra = {
            "example": {
                "title": "A Beautiful Poem",
                "content": "The sun sets in the west, painting the sky with hues of orange and pink...",
                "author": "Anonymous"
            }
        }


class WritingUpdate(BaseModel):
    """Request model for updating a writing."""
    title: Optional[str] = Field(None, max_length=200, description="Optional title for the writing")
    content: Optional[str] = Field(None, min_length=1, max_length=50000, description="The text content")
    author: Optional[str] = Field(None, max_length=200, description="Optional author name")

    @validator('content')
    def validate_content(cls, v):
        if v is not None and (not v or not v.strip()):
            raise ValueError("Content cannot be empty or only whitespace")
        return v.strip() if v else v


class WritingResponse(BaseModel):
    """Response model for a writing."""
    id: int
    title: Optional[str]
    content: str
    author: Optional[str]
    created_at: str
    updated_at: str

    class Config:
        orm_mode = True
        schema_extra = {
            "example": {
                "id": 1,
                "title": "A Beautiful Poem",
                "content": "The sun sets in the west...",
                "author": "Anonymous",
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            }
        }


class WritingsListResponse(BaseModel):
    """Response model for a list of writings."""
    writings: list[WritingResponse]
    count: int


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

