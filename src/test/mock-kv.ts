import { vi } from 'vitest';

/**
 * In-memory KVNamespace for tests. Supports single and bulk `get` (arrays of up
 * to 100 keys, like Cloudflare) and counts operations the way Workers does:
 * each call is one operation, however many keys it reads.
 */
export function createMockKV(store: Record<string, string> = {}) {
  const stats = { operations: 0 };

  const get = vi.fn(async (key: string | string[]) => {
    stats.operations++;
    if (Array.isArray(key)) {
      if (key.length > 100) throw new Error('KV bulk get: max 100 keys');
      return new Map(key.map((k) => [k, store[k] ?? null]));
    }
    return store[key] ?? null;
  });

  const put = vi.fn(async (key: string, value: string) => {
    stats.operations++;
    store[key] = value;
  });

  return { kv: { get, put } as unknown as KVNamespace, get, put, stats, store };
}
