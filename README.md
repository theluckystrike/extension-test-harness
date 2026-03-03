# extension-test-harness

Testing utilities for Chrome extensions with Jest and Playwright.

## Overview

extension-test-harness provides utilities to make testing Chrome extensions easier. It sets up the environment, mocks Chrome APIs, and provides helpers for integration testing.

## Installation

```bash
npm install extension-test-harness --save-dev
```

## Usage

### Jest Setup

```javascript
// jest.setup.js
import { setupChromeMocks } from 'extension-test-harness';

setupChromeMocks();
```

### Unit Testing

```javascript
import { mockChrome } from 'extension-test-harness';

describe('My Extension', () => {
  beforeEach(() => {
    mockChrome();
  });

  test('gets storage value', async () => {
    const value = await chrome.storage.local.get('theme');
    expect(value.theme).toBe('dark');
  });
});
```

### Integration Testing with Playwright

```javascript
import { loadExtension } from 'extension-test-harness';

test('popup opens correctly', async () => {
  const { popup } = await loadExtension({
    manifest: manifestV3,
    popup: 'popup.html',
  });

  await popup.click('#open-modal');
  const modal = await popup.locator('#modal');
  await expect(modal).toBeVisible();
});
```

### Background Worker Testing

```javascript
import { mockMessages } from 'extension-test-harness';

test('background handles messages', async () => {
  const response = await mockMessages.sendMessage({
    type: 'GET_SETTINGS',
  });
  
  expect(response.settings).toBeDefined();
});
```

## API

### setupChromeMocks()

Sets up Jest mocks for Chrome APIs. Call in `jest.setup.js`.

### mockChrome()

Resets Chrome API mocks. Use in `beforeEach`.

### loadExtension(options)

Loads extension in Playwright for integration testing.

| Option | Type | Description |
|--------|------|-------------|
| manifest | object | Extension manifest |
| popup | string | Popup HTML file |
| background | string | Background script |

### mockMessages

Helper for testing message passing between extension components.

## Mocked APIs

- `chrome.storage` - Local and sync storage
- `chrome.runtime` - Runtime messages and management
- `chrome.tabs` - Tab operations
- `chrome.runtime` - Extension context
- `chrome.alarms` - Alarm API

## Running Tests

```bash
# Unit tests
npm test

# Integration tests  
npx playwright test

# With coverage
npm test -- --coverage
```

## Browser Support

- Chrome 90+ (testing)
- Edge 90+

## License

MIT
