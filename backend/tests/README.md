# Backend Tests

This directory contains all backend tests for the Natural Speech API.

## Test Structure

- `conftest.py` - Pytest configuration and shared fixtures
- `test_main.py` - Integration tests for API endpoints
- `test_tts_service.py` - Unit tests for TTS service
- `test_avatar_service.py` - Unit tests for Avatar service
- `test_performance.py` - Performance and load tests

## Running Tests

```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_main.py

# Run with coverage
pytest --cov=. --cov-report=html

# Run only unit tests
pytest -m unit

# Run only integration tests
pytest -m integration

# Run performance tests
pytest -m performance
```

## Test Markers

Tests are organized using pytest markers:
- `@pytest.mark.unit` - Fast unit tests
- `@pytest.mark.integration` - Integration tests
- `@pytest.mark.performance` - Performance tests
- `@pytest.mark.slow` - Slow-running tests

## Writing Tests

### Example Unit Test

```python
@pytest.mark.unit
def test_service_method():
    service = MyService()
    result = service.method()
    assert result == expected
```

### Example Integration Test

```python
@pytest.mark.integration
def test_api_endpoint(client):
    response = client.post("/api/endpoint", json={"data": "test"})
    assert response.status_code == 200
```

## Fixtures

Common fixtures are defined in `conftest.py`:
- `client` - FastAPI test client
- `mock_tts_service` - Mock TTS service
- `mock_avatar_service` - Mock Avatar service
- `sample_audio_data` - Sample audio for testing
- `sample_image_file` - Sample image for testing

## Coverage

Target coverage: >80%

View coverage report:
```bash
pytest --cov=. --cov-report=html
open htmlcov/index.html
```

