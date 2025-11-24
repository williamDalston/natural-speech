"""
Pytest configuration and fixtures for backend tests.
"""
import pytest
from unittest.mock import Mock, MagicMock
from fastapi.testclient import TestClient
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
def mock_tts_service():
    """Mock TTS service for testing."""
    mock_service = Mock()
    mock_service.generate_audio.return_value = (
        b"fake_audio_data",
        22050  # sample_rate
    )
    mock_service.get_voices.return_value = ["af_bella", "af_sarah", "am_michael"]
    return mock_service


@pytest.fixture
def mock_avatar_service():
    """Mock Avatar service for testing."""
    mock_service = Mock()
    mock_service.generate_avatar.return_value = "/tmp/test_video.mp4"
    return mock_service


@pytest.fixture
def sample_audio_data():
    """Sample audio data for testing."""
    return b"fake_audio_data"


@pytest.fixture
def sample_image_file():
    """Create a sample image file for testing."""
    # Create a minimal PNG file (1x1 pixel)
    png_data = (
        b'\x89PNG\r\n\x1a\n'
        b'\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde'
        b'\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00'
        b'\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'
    )
    return png_data

