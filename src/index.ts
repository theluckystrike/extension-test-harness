/**
 * extension-test-harness
 * Testing utilities with mocked Chrome APIs for reliable unit testing
 */

export interface MockChromeStorage {
  data: Record<string, unknown>;
  listeners: Record<string, ((changes: Record<string, { oldValue?: unknown; newValue?: unknown }>) => void)[]>;
}

export class MockChromeStorage {
  constructor() {
    this.data = {};
    this.listeners = {};
  }

  get(keys?: string | string[] | Record<string, unknown>): Promise<Record<string, unknown>> {
    return new Promise((resolve) => {
      const result: Record<string, unknown> = {};
      
      if (!keys) {
        resolve({ ...this.data });
        return;
      }

      if (typeof keys === 'string') {
        resolve({ [keys]: this.data[keys] });
        return;
      }

      if (Array.isArray(keys)) {
        keys.forEach(key => {
          if (this.data[key] !== undefined) {
            result[key] = this.data[key];
          }
        });
        resolve(result);
        return;
      }

      Object.keys(keys).forEach(key => {
        if (this.data[key] !== undefined) {
          result[key] = this.data[key];
        } else {
          result[key] = keys[key];
        }
      });

      resolve(result);
    });
  }

  set(items: Record<string, unknown>): Promise<void> {
    return new Promise((resolve) => {
      const changes: Record<string, { oldValue?: unknown; newValue?: unknown }> = {};
      
      Object.keys(items).forEach(key => {
        changes[key] = {
          oldValue: this.data[key],
          newValue: items[key]
        };
        this.data[key] = items[key];
      });

      Object.keys(this.listeners).forEach(key => {
        if (this.listeners[key]) {
          this.listeners[key].forEach(listener => listener(changes));
        }
      });

      resolve();
    });
  }

  remove(keys: string | string[]): Promise<void> {
    return new Promise((resolve) => {
      const changes: Record<string, { oldValue?: unknown; newValue?: undefined }> = {};
      const keyList = Array.isArray(keys) ? keys : [keys];

      keyList.forEach(key => {
        changes[key] = { oldValue: this.data[key], newValue: undefined };
        delete this.data[key];
      });

      Object.keys(this.listeners).forEach(key => {
        if (this.listeners[key]) {
          this.listeners[key].forEach(listener => listener(changes));
        }
      });

      resolve();
    });
  }

  clear(): Promise<void> {
    return new Promise((resolve) => {
      const changes: Record<string, { oldValue?: unknown; newValue?: undefined }> = {};
      
      Object.keys(this.data).forEach(key => {
        changes[key] = { oldValue: this.data[key], newValue: undefined };
      });

      this.data = {};

      Object.keys(this.listeners).forEach(key => {
        if (this.listeners[key]) {
          this.listeners[key].forEach(listener => listener(changes));
        }
      });

      resolve();
    });
  }

  onChanged: {
    addListener: (callback: (changes: Record<string, { oldValue?: unknown; newValue?: unknown }>) => void) => void;
    removeListener: (callback: (changes: Record<string, { oldValue?: unknown; newValue?: unknown }>) => void) => void;
    hasListener: (callback: (changes: Record<string, { oldValue?: unknown; newValue?: unknown }>) => void) => boolean;
  } = {
    addListener: (callback) => {
      const key = callback.toString();
      if (!this.listeners[key]) {
        this.listeners[key] = [];
      }
      this.listeners[key].push(callback);
    },
    removeListener: (callback) => {
      const key = callback.toString();
      if (this.listeners[key]) {
        this.listeners[key] = this.listeners[key].filter(cb => cb !== callback);
      }
    },
    hasListener: (callback) => {
      const key = callback.toString();
      return this.listeners[key]?.some(cb => cb === callback) || false;
    }
  };
}

export class MockTabsAPI {
  private tabs: Map<number, chrome.tabs.Tab> = new Map();
  private nextId = 1;
  private listeners: Map<string, ((...args: unknown[]) => void)[]> = new Map();

  constructor() {
    this.createTab({ url: 'about:blank', active: true });
  }

  createTab(properties?: chrome.tabs.CreateProperties): Promise<chrome.tabs.Tab> {
    return new Promise((resolve) => {
      const id = this.nextId++;
      const tab: chrome.tabs.Tab = {
        id,
        windowId: 1,
        url: properties?.url || 'about:blank',
        title: 'Test Tab',
        favIconUrl: '',
        pinned: properties?.pinned || false,
        active: properties?.active || false,
        index: properties?.index || 0,
        highlighted: properties?.active || false,
        incognito: false,
        mutedInfo: { muted: false },
        autoDiscardable: true,
        discardReason: 'automatic',
        groupId: -1,
        status: 'complete'
      };

      this.tabs.set(id, tab);
      this.emit('created', tab);
      resolve(tab);
    });
  }

  get(tabId: number): Promise<chrome.tabs.Tab> {
    return new Promise((resolve, reject) => {
      const tab = this.tabs.get(tabId);
      if (tab) {
        resolve(tab);
      } else {
        reject(new Error(`Tab ${tabId} not found`));
      }
    });
  }

  query(queryInfo: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]> {
    return new Promise((resolve) => {
      const results = Array.from(this.tabs.values()).filter(tab => {
        if (queryInfo.active !== undefined && tab.active !== queryInfo.active) return false;
        if (queryInfo.pinned !== undefined && tab.pinned !== queryInfo.pinned) return false;
        if (queryInfo.url !== undefined && !this.matchUrl(tab.url || '', queryInfo.url)) return false;
        if (queryInfo.title !== undefined && !tab.title?.includes(queryInfo.title)) return false;
        return true;
      });
      resolve(results);
    });
  }

  update(tabId: number, properties: chrome.tabs.UpdateProperties): Promise<chrome.tabs.Tab> {
    return new Promise((resolve, reject) => {
      const tab = this.tabs.get(tabId);
      if (!tab) {
        reject(new Error(`Tab ${tabId} not found`));
        return;
      }

      const updated = { ...tab, ...properties };
      this.tabs.set(tabId, updated);
      this.emit('updated', tabId, updated);
      resolve(updated);
    });
  }

  remove(tabIds: number | number[]): Promise<void> {
    return new Promise((resolve) => {
      const ids = Array.isArray(tabIds) ? tabIds : [tabIds];
      ids.forEach(id => {
        this.tabs.delete(id);
        this.emit('removed', id);
      });
      resolve();
    });
  }

  reload(tabId?: number): Promise<void> {
    return new Promise((resolve) => {
      const tab = this.tabs.get(tabId || 1);
      if (tab) {
        this.emit('replaced', tab.id, tab.id);
      }
      resolve();
    });
  }

  private matchUrl(url: string, pattern: string): boolean {
    if (pattern === '<all_urls>') return true;
    try {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(url);
    } catch {
      return url.includes(pattern);
    }
  }

  onCreated: {
    addListener: (callback: (tab: chrome.tabs.Tab) => void) => void;
    removeListener: (callback: (tab: chrome.tabs.Tab) => void) => void;
  } = this.createListener<chrome.tabs.Tab>('created');

  onUpdated: {
    addListener: (callback: (tabId: number, changeInfo: chrome.tabs.ChangeInfo, tab: chrome.tabs.Tab) => void) => void;
    removeListener: (callback: (tabId: number, changeInfo: chrome.tabs.ChangeInfo, tab: chrome.tabs.Tab) => void) => void;
  } = this.createListener('updated');

  onRemoved: {
    addListener: (callback: (tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) => void) => void;
    removeListener: (callback: (tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) => void) => void;
  } = this.createListener('removed');

  private createListener<T>(event: string) {
    return {
      addListener: (callback: T) => {
        if (!this.listeners.has(event)) {
          this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(callback as (...args: unknown[]) => void);
      },
      removeListener: (callback: T) => {
        const listeners = this.listeners.get(event);
        if (listeners) {
          const index = listeners.indexOf(callback as (...args: unknown[]) => void);
          if (index > -1) listeners.splice(index, 1);
        }
      }
    };
  }

  private emit(event: string, ...args: unknown[]): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(cb => cb(...args));
    }
  }
}

export class MockRuntimeAPI {
  private messages: Array<{ from: string; to: string; message: unknown }> = [];
  private listeners: Map<string, ((...args: unknown[]) => void)[]> = new Map();

  constructor(
    public extensionId: string = 'test-extension-id',
    public lastError: string | null = null
  ) {}

  getURL(path: string): string {
    return `chrome-extension://${this.extensionId}/${path}`;
  }

  getManifest(): chrome.runtime.Manifest {
    return {
      manifest_version: 3,
      name: 'Test Extension',
      version: '1.0.0',
      permissions: [],
      host_permissions: []
    };
  }

  sendMessage(message: unknown, responseCallback?: (response: unknown) => void): void {
    this.messages.push({
      from: this.extensionId,
      to: 'background',
      message
    });

    if (responseCallback) {
      setTimeout(() => responseCallback({ received: true }), 0);
    }
  }

  sendNativeMessage(application: string, message: unknown): Promise<unknown> {
    return Promise.resolve({ native: true, application, message });
  }

  onMessage: {
    addListener: (callback: (message: unknown, sender: chrome.runtime.MessageSender, sendResponse: (response?: unknown) => void) => void) => void;
    removeListener: (callback: (message: unknown, sender: chrome.runtime.MessageSender, sendResponse: (response?: unknown) => void) => void) => void;
  } = {
    addListener: (callback) => this.addEventListener('message', callback),
    removeListener: (callback) => this.removeEventListener('message', callback)
  };

  onInstalled: {
    addListener: (callback: (details: chrome.runtime.InstalledDetails) => void) => void;
    removeListener: (callback: (details: chrome.runtime.InstalledDetails) => void) => void;
  } = {
    addListener: (callback) => this.addEventListener('installed', callback),
    removeListener: (callback) => this.removeEventListener('installed', callback)
  };

  private addEventListener(event: string, callback: (...args: unknown[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  private removeEventListener(event: string, callback: (...args: unknown[]) => void): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) listeners.splice(index, 1);
    }
  }

  private emit(event: string, ...args: unknown[]): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(cb => cb(...args));
    }
  }
}

export class MockAlarmsAPI {
  private alarms: Map<string, chrome.alarms.Alarm> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  create(name: string, alarmInfo?: chrome.alarms.AlarmCreateInfo): void {
    const alarm: chrome.alarms.Alarm = {
      name,
      scheduledTime: alarmInfo?.when || Date.now() + (alarmInfo?.delayInMinutes || 1) * 60000,
      periodInMinutes: alarmInfo?.periodInMinutes
    };

    this.alarms.set(name, alarm);

    const delay = alarm.scheduledTime - Date.now();
    const timer = setTimeout(() => {
      this.emit('alarm', alarm);
      if (alarm.periodInMinutes) {
        this.create(name, { periodInMinutes: alarm.periodInMinutes });
      }
    }, delay);

    this.timers.set(name, timer);
  }

  get(name: string): Promise<chrome.alarms.Alarm | undefined> {
    return Promise.resolve(this.alarms.get(name));
  }

  getAll(): Promise<chrome.alarms.Alarm[]> {
    return Promise.resolve(Array.from(this.alarms.values()));
  }

  clear(name: string): Promise<boolean> {
    const timer = this.timers.get(name);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(name);
    }
    const existed = this.alarms.has(name);
    this.alarms.delete(name);
    return Promise.resolve(existed);
  }

  clearAll(): Promise<void> {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    this.alarms.clear();
    return Promise.resolve();
  }

  onAlarm: {
    addListener: (callback: (alarm: chrome.alarms.Alarm) => void) => void;
    removeListener: (callback: (alarm: chrome.alarms.Alarm) => void) => void;
  } = {
    addListener: (callback) => this.addEventListener('alarm', callback),
    removeListener: (callback) => this.removeEventListener('alarm', callback)
  };

  private listeners: Map<string, ((...args: unknown[]) => void)[]> = new Map();

  private addEventListener(event: string, callback: (...args: unknown[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  private removeEventListener(event: string, callback: (...args: unknown[]) => void): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) listeners.splice(index, 1);
    }
  }

  private emit(event: string, ...args: unknown[]): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(cb => cb(...args));
    }
  }
}

export interface ChromeMocks {
  storage: { local: MockChromeStorage; sync: MockChromeStorage };
  tabs: MockTabsAPI;
  runtime: MockRuntimeAPI;
  alarms: MockAlarmsAPI;
}

export function createChromeMocks(): ChromeMocks {
  return {
    storage: {
      local: new MockChromeStorage(),
      sync: new MockChromeStorage()
    },
    tabs: new MockTabsAPI(),
    runtime: new MockRuntimeAPI(),
    alarms: new MockAlarmsAPI()
  };
}

export function installChromeMocks(mocks: ChromeMocks): void {
  (global as unknown as { chrome: typeof chrome }).chrome = {
    storage: mocks.storage,
    tabs: mocks.tabs as unknown as typeof chrome.tabs,
    runtime: mocks.runtime as unknown as typeof chrome.runtime,
    alarms: mocks.alarms as unknown as typeof chrome.alarms
  };
}

export class AssertionHelper {
  static equal(actual: unknown, expected: unknown, message?: string): void {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected} but got ${actual}`);
    }
  }

  static notEqual(actual: unknown, expected: unknown, message?: string): void {
    if (actual === expected) {
      throw new Error(message || `Expected ${actual} to not equal ${expected}`);
    }
  }

  static deepEqual(actual: unknown, expected: unknown, message?: string): void {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr !== expectedStr) {
      throw new Error(message || `Expected ${expectedStr} but got ${actualStr}`);
    }
  }

  static truthy(value: unknown, message?: string): void {
    if (!value) {
      throw new Error(message || `Expected truthy value but got ${value}`);
    }
  }

  static falsy(value: unknown, message?: string): void {
    if (value) {
      throw new Error(message || `Expected falsy value but got ${value}`);
    }
  }

  static throws(fn: () => void, message?: string): void {
    try {
      fn();
      throw new Error(message || 'Expected function to throw');
    } catch (e) {
      if (e instanceof Error && message && e.message === message) {
        throw e;
      }
    }
  }
}

export function createTestSuite(name: string) {
  const tests: Array<{ name: string; fn: () => Promise<void> | void }> = [];

  return {
    test(name: string, fn: () => Promise<void> | void) {
      tests.push({ name, fn });
    },

    async run() {
      console.log(`\nRunning test suite: ${name}`);
      let passed = 0;
      let failed = 0;

      for (const test of tests) {
        try {
          await test.fn();
          console.log(`  ✓ ${test.name}`);
          passed++;
        } catch (e) {
          console.log(`  ✗ ${test.name}: ${(e as Error).message}`);
          failed++;
        }
      }

      console.log(`\nResults: ${passed} passed, ${failed} failed`);
      return { passed, failed };
    }
  };
}
