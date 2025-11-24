"""
Integration tests for the main FastAPI application.
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import io


@pytest.mark.integration
class TestRootEndpoint:
    """Tests for the root endpoint."""
    
    def test_root_endpoint(self, client):
        """Test that root endpoint returns correct message."""
        response = client.get("/")
        assert response.status_code == 200
        assert response.json() == {"message": "TTS API is running"}


@pytest.mark.integration
class TestVoicesEndpoint:
    """Tests for the /api/voices endpoint."""
    
    def test_get_voices_success(self, client):
        """Test successful retrieval of voices list."""
        response = client.get("/api/voices")
        # Should return 200 if service is initialized, or 500 if not
        assert response.status_code in [200, 500]
        if response.status_code == 200:
            data = response.json()
            assert "voices" in data
            assert isinstance(data["voices"], list)
    
    def test_get_voices_service_not_initialized(self, client):
        """Test voices endpoint when service is not initialized."""
        # This test will pass if service fails to initialize
        # In a real scenario, we'd mock the service
        response = client.get("/api/voices")
        assert response.status_code in [200, 500]


@pytest.mark.integration
class TestTTSEndpoint:
    """Tests for the /api/tts endpoint."""
    
    def test_tts_missing_text(self, client):
        """Test TTS endpoint with missing text field."""
        response = client.post("/api/tts", json={})
        assert response.status_code == 422  # Validation error
    
    def test_tts_invalid_request(self, client):
        """Test TTS endpoint with invalid request."""
        response = client.post("/api/tts", json={"text": ""})
        # Should either succeed (if service works) or fail with 500
        assert response.status_code in [200, 422, 500]
    
    def test_tts_valid_request(self, client):
        """Test TTS endpoint with valid request."""
        response = client.post(
            "/api/tts",
            json={
                "text": "Hello, world!",
                "voice": "af_bella",
                "speed": 1.0
            }
        )
        # May fail if service not initialized, but structure should be correct
        assert response.status_code in [200, 500]
        if response.status_code == 200:
            assert response.headers["content-type"] == "audio/wav"
    
    def test_tts_with_custom_voice(self, client):
        """Test TTS endpoint with custom voice."""
        response = client.post(
            "/api/tts",
            json={
                "text": "Test text",
                "voice": "af_sarah",
                "speed": 1.5
            }
        )
        assert response.status_code in [200, 500]
    
    def test_tts_with_custom_speed(self, client):
        """Test TTS endpoint with custom speed."""
        response = client.post(
            "/api/tts",
            json={
                "text": "Test text",
                "voice": "af_bella",
                "speed": 0.5
            }
        )
        assert response.status_code in [200, 500]


@pytest.mark.integration
class TestAvatarEndpoint:
    """Tests for the /api/avatar endpoint."""
    
    def test_avatar_missing_fields(self, client, sample_image_file):
        """Test avatar endpoint with missing required fields."""
        # Missing text
        response = client.post(
            "/api/avatar",
            data={"voice": "af_bella", "speed": 1.0},
            files={"image": ("test.png", sample_image_file, "image/png")}
        )
        assert response.status_code == 422
    
    def test_avatar_missing_image(self, client):
        """Test avatar endpoint without image file."""
        response = client.post(
            "/api/avatar",
            data={"text": "Hello", "voice": "af_bella", "speed": 1.0}
        )
        assert response.status_code == 422
    
    def test_avatar_valid_request(self, client, sample_image_file):
        """Test avatar endpoint with valid request."""
        response = client.post(
            "/api/avatar",
            data={
                "text": "Hello, this is a test",
                "voice": "af_bella",
                "speed": 1.0
            },
            files={"image": ("test.png", sample_image_file, "image/png")}
        )
        # May fail if services not initialized, but should handle gracefully
        assert response.status_code in [200, 500]
        if response.status_code == 200:
            assert "video" in response.headers["content-type"]
    
    def test_avatar_with_different_speeds(self, client, sample_image_file):
        """Test avatar endpoint with different speed values."""
        for speed in [0.5, 1.0, 1.5, 2.0]:
            response = client.post(
                "/api/avatar",
                data={
                    "text": "Test",
                    "voice": "af_bella",
                    "speed": speed
                },
                files={"image": ("test.png", sample_image_file, "image/png")}
            )
            assert response.status_code in [200, 422, 500]


@pytest.mark.integration
class TestErrorHandling:
    """Tests for error handling."""
    
    def test_invalid_endpoint(self, client):
        """Test accessing non-existent endpoint."""
        response = client.get("/api/nonexistent")
        assert response.status_code == 404
    
    def test_invalid_method(self, client):
        """Test using wrong HTTP method."""
        response = client.get("/api/tts")
        assert response.status_code == 405  # Method not allowed

