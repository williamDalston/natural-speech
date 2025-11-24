# Frontend Tests

This directory contains all frontend tests for the Natural Speech application.

## Test Structure

- `setup.js` - Test configuration and global setup
- `api.test.js` - API client tests
- `TextInput.test.jsx` - TextInput component tests
- `Controls.test.jsx` - Controls component tests

## Running Tests

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
npm test -- TextInput.test.jsx
```

## Writing Tests

### Example Component Test

```javascript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from '../components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Example API Test

```javascript
import { describe, it, expect, vi } from 'vitest';
import { getVoices } from '../api';

describe('API Client', () => {
  it('fetches voices', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ voices: ['voice1'] }),
    });
    
    const result = await getVoices();
    expect(result.voices).toContain('voice1');
  });
});
```

## Test Utilities

- `@testing-library/react` - Component testing
- `@testing-library/user-event` - User interaction simulation
- `@testing-library/jest-dom` - DOM matchers
- `vitest` - Test runner

## Coverage

Target coverage: >70%

View coverage report:
```bash
npm run test:coverage
open coverage/index.html
```

