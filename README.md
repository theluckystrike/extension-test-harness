# extension-test-harness

A unit testing harness for Chrome extensions that provides mocked Chrome APIs, fake storage, tabs, runtime, and assertion helpers without requiring a browser.

## Installation

```bash
npm install extension-test-harness --save-dev
```

## Usage

### Basic Setup

```typescript
import { TestHarness } from 'extension-test-harness';

const harness = new TestHarness();
const chrome = harness.createMockChrome();
```

### Testing Storage Operations

```typescript
import { TestHarness } from 'extension-test-harness';

describe('My Extension Storage', () => {
    const harness = new TestHarness();

    beforeEach(() => {
        harness.seedStorage({ theme: 'dark', language: 'en' });
    });

    test('retrieves stored values', async () => {
        const chrome = harness.createMockChrome();
        const result = await chrome.storage.local.get('theme');
        expect(result.theme).toBe('dark');
    });

    test('sets storage values', async () => {
        const chrome = harness.createMockChrome();
        await chrome.storage.local.set({ theme: 'light' });
        const result = await chrome.storage.local.get('theme');
        expect(result.theme).toBe('light');
    });
});
```

### Testing Tab Operations

```typescript
import { TestHarness } from 'extension-test-harness';

describe('Tab Management', () => {
    const harness = new TestHarness();

    beforeEach(() => {
        harness.seedTabs([
            { id: 1, url: 'https://example.com', active: true },
            { id: 2, url: 'https://other.com', active: false },
        ]);
    });

    test('queries tabs by active status', async () => {
        const chrome = harness.createMockChrome();
        const activeTabs = await chrome.tabs.query({ active: true });
        expect(activeTabs).toHaveLength(1);
        expect(activeTabs[0].url).toBe('https://example.com');
    });

    test('creates new tabs', async () => {
        const chrome = harness.createMockChrome();
        const newTab = await chrome.tabs.create({ url: 'https://new.com' });
        expect(newTab.id).toBe(3);
    });
});
```

### Testing Runtime Messages

```typescript
import { TestHarness } from 'extension-test-harness';

describe('Message Passing', () => {
    const harness = new TestHarness();

    test('sends messages to runtime', async () => {
        const chrome = harness.createMockChrome();
        await chrome.runtime.sendMessage({ type: 'GET_CONFIG' });
        const messages = harness.getSentMessages();
        expect(messages).toHaveLength(1);
        expect(messages[0].type).toBe('GET_CONFIG');
    });

    test('retrieves manifest', () => {
        const chrome = harness.createMockChrome();
        const manifest = chrome.runtime.getManifest();
        expect(manifest.name).toBe('Test Extension');
        expect(manifest.manifest_version).toBe(3);
    });
});
```

### Testing Alarms

```typescript
import { TestHarness } from 'extension-test-harness';

describe('Alarm API', () => {
    const harness = new TestHarness();

    test('creates and clears alarms', async () => {
        const chrome = harness.createMockChrome();
        chrome.alarms.create('reminder', { delayInMinutes: 5 });
        
        const alarm = await chrome.alarms.get('reminder');
        expect(alarm).toBeDefined();
        
        await chrome.alarms.clear('reminder');
        const cleared = await chrome.alarms.get('reminder');
        expect(cleared).toBeUndefined();
    });
});
```

### Using Assertion Helpers

```typescript
import { TestHarness } from 'extension-test-harness';

TestHarness.assert(true, 'This should pass');
TestHarness.assertEqual({ a: 1 }, { a: 1 }, 'Objects should match');

// Throws on failure
TestHarness.assertEqual(1, 2, 'Numbers should match');
```

## API Reference

### TestHarness Class

#### constructor()

Creates a new test harness instance.

#### createMockChrome()

Returns a `MockChrome` object with mocked implementations of:
- `chrome.storage.local` - get, set, remove, clear
- `chrome.storage.sync` - get, set, remove, clear
- `chrome.tabs` - query, create, remove, update, get
- `chrome.runtime` - sendMessage, getManifest, onMessage, onInstalled
- `chrome.alarms` - create, clear, clearAll, get, getAll, onAlarm

#### seedTabs(tabs)

Seeds the mock tab store with predefined tabs. Returns `this` for chaining.

#### seedStorage(data)

Seeds the mock storage with predefined key-value pairs. Returns `this` for chaining.

#### getSentMessages()

Returns an array of all messages sent via `chrome.runtime.sendMessage`.

#### getStorageSnapshot()

Returns a copy of the current storage state.

### Static Methods

#### TestHarness.assert(condition, message)

Throws an error if condition is false.

#### TestHarness.assertEqual(actual, expected, message)

Throws an error if actual and expected values differ (using JSON comparison).

## Type Definitions

```typescript
export interface MockChrome {
    storage: {
        local: {
            get: (keys: string | string[]) => Promise<Record<string, any>>;
            set: (items: Record<string, any>) => Promise<void>;
            remove: (keys: string | string[]) => Promise<void>;
            clear: () => Promise<void>;
        };
        sync: {
            get: (keys: string | string[]) => Promise<Record<string, any>>;
            set: (items: Record<string, any>) => Promise<void>;
            remove: (keys: string | string[]) => Promise<void>;
            clear: () => Promise<void>;
        };
    };
    tabs: {
        query: (query: any) => Promise<any[]>;
        create: (props: any) => Promise<any>;
        remove: (ids: number | number[]) => Promise<void>;
        update: (id: number, props: any) => Promise<any>;
        get: (id: number) => Promise<any>;
    };
    runtime: {
        sendMessage: (msg: any) => Promise<void>;
        getManifest: () => any;
        onMessage: any;
        onInstalled: any;
    };
    alarms: {
        create: (name: string, info: any) => void;
        clear: (name: string) => Promise<boolean>;
        clearAll: () => Promise<void>;
        get: (name: string) => Promise<any>;
        getAll: () => Promise<any[]>;
        onAlarm: any;
    };
}
```

## Building

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist` directory.

## Requirements

- Node.js 18 or higher
- TypeScript 5.3.3

## About

extension-test-harness is maintained by theluckystrike. This project is part of the ecosystem around zovo.one, a platform for browser extension development and testing.

## License

MIT
