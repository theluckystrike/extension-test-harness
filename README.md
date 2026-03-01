# extension-test-harness — Mocked Chrome APIs for Testing
> **Built by [Zovo](https://zovo.one)** | `npm i extension-test-harness`

Mock chrome.storage, chrome.tabs, chrome.runtime, and chrome.alarms with data seeding and assertions.

```typescript
import { TestHarness } from 'extension-test-harness';
const harness = new TestHarness();
harness.seedTabs([{ id: 1, url: 'https://example.com', active: true }]);
const mock = harness.createMockChrome();
const tabs = await mock.tabs.query({ active: true });
TestHarness.assertEqual(tabs.length, 1);
```
MIT License
