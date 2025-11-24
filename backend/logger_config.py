"""
Logging configuration for the Natural Speech API.
"""

import sys
from loguru import logger
from pathlib import Path
import os


def setup_logging(log_level: str = "INFO", log_dir: str = "logs"):
    """
    Set up structured logging with loguru.
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_dir: Directory to store log files
    """
    # Remove default handler
    logger.remove()
    
    # Create logs directory if it doesn't exist
    log_path = Path(log_dir)
    log_path.mkdir(exist_ok=True)
    
    # Console handler with colors
    logger.add(
        sys.stderr,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level=log_level,
        colorize=True
    )
    
    # File handler for all logs with rotation
    logger.add(
        log_path / "app_{time:YYYY-MM-DD}.log",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        level=log_level,
        rotation="00:00",  # Rotate at midnight
        retention="30 days",  # Keep logs for 30 days
        compression="zip",  # Compress old logs
        enqueue=True,  # Thread-safe logging
        backtrace=True,  # Include stack trace
        diagnose=True  # Include variable values in stack trace
    )
    
    # Separate file for errors only
    logger.add(
        log_path / "errors_{time:YYYY-MM-DD}.log",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        level="ERROR",
        rotation="00:00",
        retention="90 days",  # Keep error logs longer
        compression="zip",
        enqueue=True,
        backtrace=True,
        diagnose=True
    )
    
    return logger


# Initialize logger
log_level = os.getenv("LOG_LEVEL", "INFO").upper()
logger = setup_logging(log_level=log_level)

