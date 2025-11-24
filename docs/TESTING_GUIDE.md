# Testing Guide

This guide covers all aspects of testing in the Natural Speech project.

## Table of Contents

1. [Backend Testing](#backend-testing)
2. [Frontend Testing](#frontend-testing)
3. [E2E Testing](#e2e-testing)
4. [Performance Testing](#performance-testing)
5. [Running Tests](#running-tests)
6. [Writing Tests](#writing-tests)
7. [Test Coverage](#test-coverage)

## Backend Testing

### Test Structure

```
backend/tests/
├── __init__.py
├── conftest.py          # Pytest fixtures and configuration
├── test_main.py        # API endpoint integration tests
├── test_tts_service.py # TTS service unit tests
├── test_avatar_service.py # Avatar service unit tests
└── test_performance.py # Performance tests
```

### Running Backend Tests

```bash
# Run all tests
cd backend
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_main.py

# Run specific test
pytest tests/test_main.py::TestRootEndpoint::test_root_endpoint

# Run with coverage
pytest --cov=. --cov-report=html

# Run only unit tests
pytest -m unit

# Run only integration tests
pytest -m integration

# Run performance tests
pytest -m performance
```

### Test Markers

Tests are marked with categories:
- `@pytest.mark.unit` - Unit tests
- `@pytest.mark.integration` - Integration tests
- `@pytest.mark.performance` - Performance tests
- `@pytest.mark.slow` - Slow-running tests

## Frontend Testing

### Test Structure

```
frontend/src/test/
├── setup.js           # Test configuration
├── api.test.js        # API client tests
├── TextInput.test.jsx # Component tests
└── Controls.test.jsx  # Component tests
```

### Running Frontend Tests

```bash
# Run all tests
cd frontend
npm test

# Run in watch mode
npm test -- --watch

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- TextInput.test.jsx
```

## E2E Testing

### Setup

E2E tests use Playwright for end-to-end testing.

```bash
# Install Playwright
cd frontend
npx playwright install

# Install dependencies
npm install --save-dev @playwright/test
```

### Running E2E Tests

```bash
# Run all E2E tests
npx playwright test

# Run in UI mode
npx playwright test --ui

# Run specific test
npx playwright test e2e/example.spec.js

# Run in headed mode (see browser)
npx playwright test --headed

# Generate test report
npx playwright show-report
```

### E2E Test Structure

```
frontend/e2e/
└── example.spec.js  # Example E2E tests
```

**Note:** E2E tests require both backend and frontend servers to be running.

## Performance Testing

Performance tests are included in the backend test suite.

```bash
# Run performance tests
cd backend
pytest -m performance tests/test_performance.py
```

Performance tests check:
- Response times for endpoints
- Concurrent request handling
- Resource usage

## Running Tests

### Quick Commands

```bash
# Using Makefile (recommended)
make test              # Run all tests
make test-backend      # Backend only
make test-frontend     # Frontend only
make test-coverage     # With coverage

# Direct commands
cd backend && pytest
cd frontend && npm test
```

### CI/CD

Tests run automatically on:
- Push to main/develop branches
- Pull requests
- Via GitHub Actions (`.github/workflows/ci.yml`)

## Writing Tests

### Backend Test Example

```python
import pytest
from fastapi.testclient import TestClient

def test_tts_endpoint(client):
    """Test TTS endpoint with valid request."""
    response = client.post(
        "/api/tts",
        json={
            "text": "Hello, world!",
            "voice": "af_bella",
            "speed": 1.0
        }
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "audio/wav"
```

### Frontend Test Example

```javascript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TextInput from '../components/TextInput';

describe('TextInput', () => {
  it('renders textarea', () => {
    render(<TextInput text="" setText={vi.fn()} />);
    expect(screen.getByPlaceholderText(/script/i)).toBeInTheDocument();
  });
});
```

### E2E Test Example

```javascript
import { test, expect } from '@playwright/test';

test('should load application', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h2')).toContainText('Text to Speech');
});
```

## Test Coverage

### Viewing Coverage

**Backend:**
```bash
cd backend
pytest --cov=. --cov-report=html
open htmlcov/index.html
```

**Frontend:**
```bash
cd frontend
npm run test:coverage
open coverage/index.html
```

### Coverage Goals

- **Backend:** Aim for >80% coverage
- **Frontend:** Aim for >70% coverage
- **Critical paths:** 100% coverage

### Coverage Reports

Coverage reports are generated in:
- Backend: `backend/htmlcov/index.html`
- Frontend: `frontend/coverage/index.html`

## Best Practices

### 1. Test Organization

- Group related tests in classes
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### 2. Test Data

- Use fixtures for reusable data
- Create test data factories
- Clean up after tests

### 3. Mocking

- Mock external services
- Mock file system operations
- Mock network requests

### 4. Test Independence

- Tests should not depend on each other
- Tests should be runnable in any order
- Clean up state between tests

### 5. Performance

- Keep unit tests fast (< 1 second)
- Mark slow tests appropriately
- Use test markers to skip slow tests in CI

## Troubleshooting

### Tests Failing

1. **Check test output:**
   ```bash
   pytest -v  # Verbose output
   pytest --pdb  # Drop into debugger
   ```

2. **Check dependencies:**
   ```bash
   pip install -r requirements-dev.txt  # Backend
   npm install  # Frontend
   ```

3. **Clear cache:**
   ```bash
   rm -rf .pytest_cache  # Backend
   rm -rf node_modules/.vite  # Frontend
   ```

### Common Issues

- **Import errors:** Check PYTHONPATH and sys.path
- **Missing fixtures:** Check conftest.py
- **Timeout errors:** Increase timeout or mark as slow
- **Flaky tests:** Add retries or fix race conditions

## Continuous Integration

Tests run automatically in CI/CD pipeline:
- All tests must pass
- Coverage thresholds enforced
- Code quality checks run
- Security scanning performed

See `.github/workflows/ci.yml` for configuration.

