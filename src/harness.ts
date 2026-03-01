/**
 * Test Harness — Mocked Chrome APIs for unit testing
 */
export interface MockChrome { storage: any; tabs: any; runtime: any; alarms: any; }

export class TestHarness {
    private store: Record<string, any> = {};
    private tabs: any[] = [];
    private messages: any[] = [];
    private alarms: Record<string, any> = {};

    /** Create a mock chrome object for testing */
    createMockChrome(): MockChrome {
        return { storage: this.mockStorage(), tabs: this.mockTabs(), runtime: this.mockRuntime(), alarms: this.mockAlarms() };
    }

    private mockStorage(): any {
        return {
            local: {
                get: async (keys: string | string[]) => {
                    if (typeof keys === 'string') return { [keys]: this.store[keys] };
                    const result: Record<string, any> = {};
                    (Array.isArray(keys) ? keys : [keys]).forEach((k) => { if (this.store[k] !== undefined) result[k] = this.store[k]; });
                    return result;
                },
                set: async (items: Record<string, any>) => { Object.assign(this.store, items); },
                remove: async (keys: string | string[]) => {
                    (Array.isArray(keys) ? keys : [keys]).forEach((k) => delete this.store[k]);
                },
                clear: async () => { this.store = {}; },
            },
            sync: { get: async () => ({}), set: async () => { }, remove: async () => { }, clear: async () => { } },
        };
    }

    private mockTabs(): any {
        return {
            query: async (q: any) => this.tabs.filter((t) => {
                if (q.active !== undefined && t.active !== q.active) return false;
                if (q.url && !t.url.includes(q.url)) return false;
                return true;
            }),
            create: async (props: any) => { const tab = { id: this.tabs.length + 1, ...props }; this.tabs.push(tab); return tab; },
            remove: async (ids: number | number[]) => { const toRemove = Array.isArray(ids) ? ids : [ids]; this.tabs = this.tabs.filter((t) => !toRemove.includes(t.id)); },
            update: async (id: number, props: any) => { const tab = this.tabs.find((t) => t.id === id); if (tab) Object.assign(tab, props); return tab; },
            get: async (id: number) => this.tabs.find((t) => t.id === id),
        };
    }

    private mockRuntime(): any {
        return {
            sendMessage: async (msg: any) => { this.messages.push(msg); },
            getManifest: () => ({ name: 'Test Extension', version: '1.0.0', manifest_version: 3 }),
            onMessage: { addListener: () => { }, removeListener: () => { } },
            onInstalled: { addListener: () => { } },
        };
    }

    private mockAlarms(): any {
        return {
            create: (name: string, info: any) => { this.alarms[name] = info; },
            clear: async (name: string) => { delete this.alarms[name]; return true; },
            clearAll: async () => { this.alarms = {}; },
            get: async (name: string) => this.alarms[name],
            getAll: async () => Object.entries(this.alarms).map(([name, info]) => ({ name, ...info })),
            onAlarm: { addListener: () => { } },
        };
    }

    /** Seed mock tabs */
    seedTabs(tabs: any[]): this { this.tabs = tabs; return this; }
    /** Seed mock storage */
    seedStorage(data: Record<string, any>): this { this.store = { ...data }; return this; }
    /** Get sent messages */
    getSentMessages(): any[] { return [...this.messages]; }
    /** Get storage snapshot */
    getStorageSnapshot(): Record<string, any> { return { ...this.store }; }

    /** Assert helper */
    static assert(condition: boolean, message: string): void {
        if (!condition) throw new Error(`Assertion failed: ${message}`);
    }

    /** Assert equal */
    static assertEqual(actual: any, expected: any, message?: string): void {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(`${message || 'assertEqual failed'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
        }
    }
}
