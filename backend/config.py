"""
Configuration management for the Natural Speech backend.

This module handles loading and managing environment variables and application configuration.
It provides a centralized Config class that loads settings from environment variables
with sensible defaults.

Usage:
    from config import settings
    
    # Access configuration
    host = settings.HOST
    port = settings.PORT
    cors_origins = settings.cors_origins_list
"""

import os
from typing import List
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)


class Config:
    """Application configuration class."""
    
    def __init__(self):
        """Initialize configuration from environment variables."""
        # Server Configuration
        self.HOST: str = os.getenv("HOST", "0.0.0.0")
        self.PORT: int = int(os.getenv("PORT", "8000"))
        self.DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
        
        # CORS Configuration
        cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
        self.CORS_ORIGINS: List[str] = [origin.strip() for origin in cors_origins_str.split(",")]
        self.CORS_ALLOW_CREDENTIALS: bool = os.getenv("CORS_ALLOW_CREDENTIALS", "True").lower() == "true"
        
        # Model Paths
        self.TTS_MODEL_PATH: str = os.getenv("TTS_MODEL_PATH", "kokoro-v0_19.onnx")
        self.VOICES_PATH: str = os.getenv("VOICES_PATH", "voices.json")
        
        # SadTalker Configuration
        self.SADTALKER_BASE_PATH: str = os.getenv("SADTALKER_BASE_PATH", "SadTalker")
        self.SADTALKER_CHECKPOINTS_DIR: str = os.getenv("SADTALKER_CHECKPOINTS_DIR", "SadTalker/checkpoints")
        self.SADTALKER_RESULTS_DIR: str = os.getenv("SADTALKER_RESULTS_DIR", "SadTalker/results")
        
        # File Upload Limits
        self.MAX_UPLOAD_SIZE: int = int(os.getenv("MAX_UPLOAD_SIZE", "10485760"))  # 10MB default
        allowed_exts_str = os.getenv("ALLOWED_IMAGE_TYPES", "jpg,jpeg,png,webp")
        self.ALLOWED_IMAGE_EXTENSIONS: set = {f".{ext.strip().lower()}" for ext in allowed_exts_str.split(",")}
        self.ALLOWED_IMAGE_TYPES: List[str] = [
            f"image/{ext.strip().lower()}" if ext.strip().lower() != "jpg" else "image/jpeg"
            for ext in allowed_exts_str.split(",")
        ]
        
        # Application Info
        self.APP_NAME: str = os.getenv("APP_NAME", "Natural Speech API")
        self.APP_VERSION: str = os.getenv("APP_VERSION", "1.0.0")
        self.ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
        
        # Paths (aliases for compatibility)
        self.MODEL_PATH: str = os.getenv("MODEL_PATH", "kokoro-v0_19.onnx")
        self.SADTALKER_PATH: str = os.getenv("SADTALKER_PATH", "SadTalker")
        self.TEMP_DIR: str = os.getenv("TEMP_DIR", "temp")
        
        # Database
        self.DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./natural_speech.db")
        
        # Monitoring
        self.ENABLE_METRICS: bool = os.getenv("ENABLE_METRICS", "True").lower() == "true"
        
        # Workers (for Gunicorn) - default to 1 for free tier hosting
        self.WORKERS: int = int(os.getenv("WORKERS", "1"))
        
        # Rate Limiting
        self.RATE_LIMIT_ENABLED: bool = os.getenv("RATE_LIMIT_ENABLED", "True").lower() == "true"
        self.RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
        
        # Logging
        self.LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
        self.LOG_FILE: str = os.getenv("LOG_FILE", "logs/app.log")
        self.RELOAD: bool = os.getenv("RELOAD", "False").lower() == "true"
        
        # OpenAI Configuration (for conversation practice)
        self.OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
        self.OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Get CORS origins as a list."""
        return self.CORS_ORIGINS
    
    def validate(self) -> None:
        """Validate configuration values."""
        # Ensure model files exist
        if not Path(self.TTS_MODEL_PATH).exists():
            raise FileNotFoundError(f"TTS model not found: {self.TTS_MODEL_PATH}")
        
        if not Path(self.VOICES_PATH).exists():
            raise FileNotFoundError(f"Voices file not found: {self.VOICES_PATH}")
        
        # Ensure SadTalker directory exists
        if not Path(self.SADTALKER_BASE_PATH).exists():
            raise FileNotFoundError(f"SadTalker directory not found: {self.SADTALKER_BASE_PATH}")
    
    def get_cors_origins(self) -> List[str]:
        """Get CORS origins as a list."""
        return self.CORS_ORIGINS


# Create global config instance
config = Config()
# Alias for compatibility with existing code
settings = config
