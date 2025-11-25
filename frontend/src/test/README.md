# Frontend Testing Guide

This directory contains comprehensive tests for the Prose & Pause frontend application.

## Test Structure

```
src/test/
├── setup.js                    # Test configuration and global setup
├── test-utils.jsx              # Test utilities and helpers
├── components/                 # Component tests
│   ├── AudioPlayer.test.jsx
│   ├── Toast.test.jsx
│   ├── ErrorBoundary.test.jsx
│   └── ConfirmationModal.test.jsx
├── integration/                # Integration tests
│   └── api-integration.test.js
└── utils/                      # Utility tests
    └── logger.test.js
```

## Running Tests

### Unit and Component Tests (Vitest)

```bash
# Run all tests
npm test

# Run in watch mode
npm test -- --watch

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- AudioPlayer.test.jsx

# Run tests matching pattern
npm test -- --grep "AudioPlayer"
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run specific test file
npx playwright test e2e/writing-creation.spec.js

# Run in specific browser
npx playwright test --project=chromium

# Run in headed mode (see browser)
npx playwright test --headed

# Run in debug mode
npx playwright test --debug
```

## Test Types

### 1. Component Tests

Test individual React components in isolation.

**Example:**
```javascript
import { render, screen } from '@testing-library/react';
import AudioPlayer from '../../components/AudioPlayer';

test('renders audio player', () => {
  render(<AudioPlayer audioUrl="blob:test" />);
  expect(screen.getByLabelText(/play/i)).toBeInTheDocument();
});
```

### 2. Integration Tests

Test interactions between components and API.

**Example:**
```javascript
import { getVoices } from '../../api';

test('fetches voices', async () => {
  const voices = await getVoices();
  expect(voices).toHaveProperty('voices');
});
```

### 3. E2E Tests

Test complete user flows from start to finish.

**Example:**
```javascript
test('creates a new writing', async ({ page }) => {
  await page.goto('/');
  const editor = page.locator('textarea').first();
  await editor.fill('Test writing');
  expect(editor).toContainText('Test writing');
});
```

## Test Utilities

### Mock API

```javascript
import { mockApi } from '../test-utils';

mockApi.getVoices.mockResolvedValue({ voices: ['af_bella'] });
```

### Mock LocalStorage

```javascript
import { mockLocalStorage } from '../test-utils';

const storage = mockLocalStorage();
storage.setItem('key', 'value');
```

### Custom Render

```javascript
import { renderWithProviders } from '../test-utils';

renderWithProviders(<MyComponent />);
```

## Writing Tests

### Component Test Template

```javascript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from '../../components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### E2E Test Template

```javascript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    // Test implementation
  });
});
```

## Best Practices

1. **Test Behavior, Not Implementation**
   - Test what users see and do, not internal implementation details

2. **Use Semantic Queries**
   - Prefer `getByRole`, `getByLabelText` over `getByTestId`

3. **Keep Tests Isolated**
   - Each test should be independent and not rely on other tests

4. **Use Descriptive Names**
   - Test names should clearly describe what is being tested

5. **Mock External Dependencies**
   - Mock API calls, timers, and browser APIs

6. **Test Accessibility**
   - Verify ARIA labels, keyboard navigation, and screen reader support

7. **Test Error States**
   - Don't just test happy paths, test error handling too

## Coverage Goals

- **Component Tests**: >80% coverage
- **Integration Tests**: >70% coverage
- **E2E Tests**: Cover all critical user flows

## Continuous Integration

Tests run automatically in CI/CD pipeline:
- Unit/component tests run on every commit
- E2E tests run on pull requests
- All tests must pass before merging

## Troubleshooting

### Tests Failing Locally

1. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Clear test cache:
   ```bash
   npm test -- --clearCache
   ```

3. Update Playwright browsers:
   ```bash
   npx playwright install
   ```

### E2E Tests Timing Out

- Increase timeout in test file
- Check if backend is running
- Verify network connectivity

### Component Tests Not Finding Elements

- Check if component is actually rendering
- Verify query selectors
- Check for async rendering (use `waitFor`)

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
