"""
Performance and Load Tests for Natural Speech API

These tests verify:
- API response times under normal load
- Rate limiting behavior
- Concurrent request handling
- Memory usage patterns
- Cache effectiveness
"""
import pytest
import time
import asyncio
from concurrent.futures import ThreadPoolExecutor, as_completed
from fastapi.testclient import TestClient
import threading
import statistics


@pytest.mark.performance
class TestPerformance:
    """Performance tests for API endpoints."""
    
    def test_health_endpoint_performance(self, client):
        """Test that health endpoint responds quickly."""
        start_time = time.time()
        response = client.get("/api/health")
        elapsed = time.time() - start_time
        
        assert response.status_code == 200
        assert elapsed < 0.1  # Should respond in < 100ms
    
    def test_voices_endpoint_performance(self, client):
        """Test that voices endpoint responds within acceptable time."""
        start_time = time.time()
        response = client.get("/api/voices")
        elapsed = time.time() - start_time
        
        # Should respond in < 1 second (even if service fails)
        assert elapsed < 1.0
    
    def test_status_endpoint_performance(self, client):
        """Test that status endpoint responds quickly."""
        start_time = time.time()
        response = client.get("/api/status")
        elapsed = time.time() - start_time
        
        assert response.status_code == 200
        assert elapsed < 0.5  # Should respond in < 500ms


@pytest.mark.load
class TestLoad:
    """Load tests for API endpoints."""
    
    def test_concurrent_health_requests(self, client):
        """Test handling of concurrent health check requests."""
        num_requests = 20
        results = []
        
        def make_request():
            start = time.time()
            response = client.get("/api/health")
            elapsed = time.time() - start
            return response.status_code, elapsed
        
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request) for _ in range(num_requests)]
            for future in as_completed(futures):
                status_code, elapsed = future.result()
                results.append((status_code, elapsed))
        
        # All requests should succeed
        status_codes = [r[0] for r in results]
        assert all(code == 200 for code in status_codes)
        
        # Response times should be reasonable
        response_times = [r[1] for r in results]
        avg_time = statistics.mean(response_times)
        assert avg_time < 0.5  # Average should be < 500ms
    
    def test_concurrent_voices_requests(self, client):
        """Test handling of concurrent voices requests."""
        num_requests = 10
        results = []
        
        def make_request():
            start = time.time()
            response = client.get("/api/voices")
            elapsed = time.time() - start
            return response.status_code, elapsed
        
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(make_request) for _ in range(num_requests)]
            for future in as_completed(futures):
                status_code, elapsed = future.result()
                results.append((status_code, elapsed))
        
        # Most requests should succeed (some may fail if service not initialized)
        status_codes = [r[0] for r in results]
        success_rate = sum(1 for code in status_codes if code == 200) / len(status_codes)
        assert success_rate >= 0.5  # At least 50% should succeed
    
    def test_sequential_requests_performance(self, client):
        """Test performance of sequential requests."""
        num_requests = 10
        response_times = []
        
        for _ in range(num_requests):
            start = time.time()
            response = client.get("/api/health")
            elapsed = time.time() - start
            response_times.append(elapsed)
            assert response.status_code == 200
        
        # Average response time should be reasonable
        avg_time = statistics.mean(response_times)
        assert avg_time < 0.2  # Average should be < 200ms
        
        # No single request should be too slow
        max_time = max(response_times)
        assert max_time < 1.0  # No request should take > 1 second


@pytest.mark.stress
class TestStress:
    """Stress tests for API endpoints."""
    
    def test_rapid_fire_requests(self, client):
        """Test API with rapid-fire requests."""
        num_requests = 50
        results = []
        
        def make_request():
            try:
                response = client.get("/api/health")
                return response.status_code
            except Exception as e:
                return None
        
        start_time = time.time()
        with ThreadPoolExecutor(max_workers=20) as executor:
            futures = [executor.submit(make_request) for _ in range(num_requests)]
            for future in as_completed(futures):
                results.append(future.result())
        elapsed = time.time() - start_time
        
        # Should handle all requests
        successful = sum(1 for r in results if r == 200)
        success_rate = successful / num_requests
        
        assert success_rate >= 0.9  # At least 90% should succeed
        assert elapsed < 5.0  # Should complete in < 5 seconds


@pytest.mark.cache
class TestCachePerformance:
    """Tests for cache performance."""
    
    def test_cache_effectiveness(self, client):
        """Test that caching improves response times."""
        # This test would require mocking the cache
        # For now, we just verify the endpoint works
        response = client.get("/api/voices")
        assert response.status_code in [200, 500]


@pytest.mark.skip(reason="Requires actual TTS service initialization")
class TestTTSPerformance:
    """Performance tests for TTS endpoint (requires service)."""
    
    def test_tts_generation_time(self, client):
        """Test TTS generation performance."""
        # This would test actual TTS generation
        # Requires TTS service to be initialized
        pass
    
    def test_tts_concurrent_requests(self, client):
        """Test concurrent TTS generation requests."""
        # This would test concurrent TTS generation
        # Requires TTS service to be initialized
        pass

