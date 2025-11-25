"""
Utility functions for file management and validation.
"""

import os
import tempfile
import shutil
from pathlib import Path
from typing import Optional, List, Tuple
from contextlib import contextmanager
import mimetypes

# Allowed image file extensions
ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp'}
ALLOWED_IMAGE_MIME_TYPES = {
    'image/jpeg', 'image/jpg', 'image/png', 
    'image/bmp', 'image/gif', 'image/webp'
}

# File size limits (in bytes)
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB
# Text length limit removed - TTS service now handles text of any length
# through intelligent chunking
MAX_TEXT_LENGTH = None  # No limit


def validate_image_file(file, max_size: int = MAX_IMAGE_SIZE) -> Tuple[bool, Optional[str]]:
    """
    Validate an uploaded image file.
    
    Args:
        file: UploadFile object from FastAPI
        max_size: Maximum file size in bytes
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Check file extension
    filename = file.filename or ""
    file_ext = Path(filename).suffix.lower()
    
    if file_ext not in ALLOWED_IMAGE_EXTENSIONS:
        return False, f"Invalid file type. Allowed types: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"
    
    # Check MIME type
    content_type = file.content_type or ""
    if content_type and content_type not in ALLOWED_IMAGE_MIME_TYPES:
        return False, f"Invalid MIME type. Allowed types: {', '.join(ALLOWED_IMAGE_MIME_TYPES)}"
    
    # Check file size
    # Note: We need to read the file to check size, which consumes it
    # This should be done before calling this function in the actual endpoint
    return True, None


def get_file_size(file_path: str) -> int:
    """Get file size in bytes."""
    return os.path.getsize(file_path)


@contextmanager
def temporary_file(suffix: str = "", prefix: str = "temp_", delete: bool = True):
    """
    Context manager for creating temporary files with automatic cleanup.
    
    Args:
        suffix: File suffix (e.g., '.wav', '.jpg')
        prefix: File prefix
        delete: Whether to delete the file on exit
        
    Yields:
        Path to the temporary file
    """
    fd, path = tempfile.mkstemp(suffix=suffix, prefix=prefix)
    try:
        os.close(fd)
        yield path
    finally:
        if delete and os.path.exists(path):
            try:
                os.remove(path)
            except OSError:
                pass  # File might already be deleted


@contextmanager
def temporary_directory(prefix: str = "temp_", delete: bool = True):
    """
    Context manager for creating temporary directories with automatic cleanup.
    
    Args:
        prefix: Directory prefix
        delete: Whether to delete the directory on exit
        
    Yields:
        Path to the temporary directory
    """
    path = tempfile.mkdtemp(prefix=prefix)
    try:
        yield path
    finally:
        if delete and os.path.exists(path):
            try:
                shutil.rmtree(path)
            except OSError:
                pass  # Directory might already be deleted


def cleanup_file(file_path: str) -> bool:
    """
    Safely remove a file.
    
    Args:
        file_path: Path to the file to remove
        
    Returns:
        True if file was removed, False otherwise
    """
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
    except OSError:
        pass
    return False


def cleanup_files(file_paths: List[str]) -> int:
    """
    Safely remove multiple files.
    
    Args:
        file_paths: List of file paths to remove
        
    Returns:
        Number of files successfully removed
    """
    count = 0
    for file_path in file_paths:
        if cleanup_file(file_path):
            count += 1
    return count


def validate_voice(voice: str, available_voices: List[str]) -> Tuple[bool, Optional[str]]:
    """
    Validate that a voice is available.
    
    Args:
        voice: Voice identifier to validate
        available_voices: List of available voice identifiers
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not voice:
        return False, "Voice cannot be empty"
    
    if voice not in available_voices:
        return False, f"Voice '{voice}' is not available. Available voices: {', '.join(available_voices[:10])}..."
    
    return True, None

