"""
Performance tests for the Natural Speech API.

These tests measure response times and resource usage for various operations.
Run with: pytest tests/test_performance.py -m performance
"""
import pytest
import time
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app


@pytest.mark.performance
class TestPerformance:
    """Performance tests for API endpoints."""
    
    @pytest.fixture
    def client(self):
        """Create a test client."""
        return TestClient(app)
    
    def test_health_endpoint_performance(self, client):
        """Test that health endpoint responds quickly."""
        start = time.time()
        response = client.get("/api/health")
        duration = time.time() - start
        
        assert response.status_code == 200
        assert duration < 0.1  # Should respond in < 100ms
    
    def test_voices_endpoint_performance(self, client):
        """Test that voices endpoint responds within acceptable time."""
        start = time.time()
        response = client.get("/api/voices")
        duration = time.time() - start
        
        # Should respond quickly even if service not initialized
        assert duration < 1.0  # Should respond in < 1 second
    
    def test_root_endpoint_performance(self, client):
        """Test root endpoint performance."""
        start = time.time()
        response = client.get("/")
        duration = time.time() - start
        
        assert response.status_code == 200
        assert duration < 0.1  # Should respond in < 100ms
    
    def test_concurrent_requests(self, client):
        """Test handling of concurrent requests."""
        import concurrent.futures
        
        def make_request():
            return client.get("/api/health")
        
        start = time.time()
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request) for _ in range(20)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]
        duration = time.time() - start
        
        # All requests should succeed
        assert all(r.status_code == 200 for r in results)
        # Should handle 20 concurrent requests in reasonable time
        assert duration < 5.0

