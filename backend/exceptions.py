"""
Custom exception classes for the Natural Speech API.
"""


class NaturalSpeechException(Exception):
    """Base exception for all Natural Speech errors."""
    def __init__(self, message: str, error_code: str = None, status_code: int = 500):
        self.message = message
        self.error_code = error_code or "INTERNAL_ERROR"
        self.status_code = status_code
        super().__init__(self.message)


class ServiceNotAvailableException(NaturalSpeechException):
    """Raised when a required service is not initialized or available."""
    def __init__(self, service_name: str):
        super().__init__(
            message=f"{service_name} service is not available",
            error_code="SERVICE_UNAVAILABLE",
            status_code=503
        )


class ValidationException(NaturalSpeechException):
    """Raised when input validation fails."""
    def __init__(self, message: str, field: str = None):
        error_code = f"VALIDATION_ERROR_{field.upper()}" if field else "VALIDATION_ERROR"
        super().__init__(
            message=message,
            error_code=error_code,
            status_code=400
        )


class FileException(NaturalSpeechException):
    """Raised when file operations fail."""
    def __init__(self, message: str, error_code: str = "FILE_ERROR"):
        super().__init__(
            message=message,
            error_code=error_code,
            status_code=400
        )


class AudioGenerationException(NaturalSpeechException):
    """Raised when audio generation fails."""
    def __init__(self, message: str):
        super().__init__(
            message=message,
            error_code="AUDIO_GENERATION_ERROR",
            status_code=500
        )


class AvatarGenerationException(NaturalSpeechException):
    """Raised when avatar generation fails."""
    def __init__(self, message: str):
        super().__init__(
            message=message,
            error_code="AVATAR_GENERATION_ERROR",
            status_code=500
        )

