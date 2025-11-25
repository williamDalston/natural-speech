"""
Security utilities for file uploads and request validation.
"""
import os
from typing import Optional
from fastapi import UploadFile, HTTPException
from exceptions import FileException, ValidationException
from config import settings

# Try to import magic library (optional)
try:
    import magic
    HAS_MAGIC = True
except ImportError:
    HAS_MAGIC = False


def validate_file_upload(file: UploadFile, max_size: Optional[int] = None) -> None:
    """
    Validate uploaded file for security.
    
    Args:
        file: The uploaded file
        max_size: Maximum file size in bytes (defaults to settings.MAX_UPLOAD_SIZE)
    
    Raises:
        FileException: If file validation fails
    """
    max_size = max_size or settings.MAX_UPLOAD_SIZE
    
    # Check file size
    if hasattr(file, 'size') and file.size and file.size > max_size:
        raise FileException(
            f"File size exceeds maximum allowed size of {max_size / 1024 / 1024:.1f}MB",
            error_code="FILE_TOO_LARGE"
        )
    
    # Check file extension
    if file.filename:
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in settings.ALLOWED_IMAGE_EXTENSIONS:
            raise FileException(
                f"File type not allowed. Allowed types: {', '.join(settings.ALLOWED_IMAGE_EXTENSIONS)}",
                error_code="INVALID_FILE_TYPE"
            )
    
    # Check content type
    if file.content_type and file.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise FileException(
            f"Content type not allowed. Allowed types: {', '.join(settings.ALLOWED_IMAGE_TYPES)}",
            error_code="INVALID_CONTENT_TYPE"
        )


def validate_text_input(text: str, min_length: int = 1, max_length: Optional[int] = None) -> None:
    """
    Validate text input for TTS.
    
    Args:
        text: The text to validate
        min_length: Minimum text length (default: 1)
        max_length: Maximum text length (optional, no limit if None)
    
    Raises:
        ValidationException: If text validation fails
    """
    if not text or not text.strip():
        raise ValidationException("Text cannot be empty", field="text")
    
    if len(text) < min_length:
        raise ValidationException(
            f"Text must be at least {min_length} characters long",
            field="text"
        )
    
    # Optional max length check (for backwards compatibility or specific use cases)
    if max_length is not None and len(text) > max_length:
        raise ValidationException(
            f"Text must not exceed {max_length} characters",
            field="text"
        )


def validate_voice(voice: str, available_voices: list) -> None:
    """
    Validate voice selection.
    
    Args:
        voice: The voice identifier
        available_voices: List of available voice identifiers
    
    Raises:
        ValidationException: If voice is invalid
    """
    if voice not in available_voices:
        raise ValidationException(
            f"Invalid voice. Available voices: {', '.join(available_voices[:10])}...",
            field="voice"
        )


def validate_speed(speed: float, min_speed: float = 0.5, max_speed: float = 2.0) -> None:
    """
    Validate speed parameter.
    
    Args:
        speed: The speed multiplier
        min_speed: Minimum allowed speed
        max_speed: Maximum allowed speed
    
    Raises:
        ValidationException: If speed is invalid
    """
    if not isinstance(speed, (int, float)):
        raise ValidationException("Speed must be a number", field="speed")
    
    if speed < min_speed or speed > max_speed:
        raise ValidationException(
            f"Speed must be between {min_speed} and {max_speed}",
            field="speed"
        )

