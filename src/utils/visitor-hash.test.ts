import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getVisitorHash,
  addToVisitorSet,
  resetVisitorSaltCache,
  MAX_VISITORS_PER_SET,
} from './visitor-hash';

function createMockKV(store: Record<string, string> = {}) {
  return {
    get: vi.fn(async (key: string) => store[key] ?? null),
    put: vi.fn(async (key: string, value: string) => {
      store[key] = value;
    }),
  } as unknown as KVNamespace;
}

function requestFrom(ip: string, userAgent = 'Mozilla/5.0 (Macintosh) Safari/605'): Request {
  return new Request('https://fyrk.no/api/pageview', {
    method: 'POST',
    headers: { 'cf-connecting-ip': ip, 'user-agent': userAgent },
  });
}

describe('getVisitorHash', () => {
  beforeEach(() => resetVisitorSaltCache());

  it('returns the same 16-char hash for the same visitor on the same day', async () => {
    const kv = createMockKV();
    const a = await getVisitorHash(requestFrom('203.0.113.7'), kv, '2026-09-25');
    const b = await getVisitorHash(requestFrom('203.0.113.7'), kv, '2026-09-25');
    expect(a).toMatch(/^[0-9a-f]{16}$/);
    expect(a).toBe(b);
  });

  it('distinguishes visitors by IP and by user agent', async () => {
    const kv = createMockKV();
    const base = await getVisitorHash(requestFrom('203.0.113.7'), kv, '2026-09-25');
    const otherIp = await getVisitorHash(requestFrom('203.0.113.8'), kv, '2026-09-25');
    const otherUa = await getVisitorHash(requestFrom('203.0.113.7', 'Mozilla/5.0 (iPhone)'), kv, '2026-09-25');
    expect(otherIp).not.toBe(base);
    expect(otherUa).not.toBe(base);
  });

  it('cannot be linked across days: a new day gets a new random salt', async () => {
    const store: Record<string, string> = {};
    const kv = createMockKV(store);
    const day1 = await getVisitorHash(requestFrom('203.0.113.7'), kv, '2026-09-25');
    const day2 = await getVisitorHash(requestFrom('203.0.113.7'), kv, '2026-09-26');
    expect(day2).not.toBe(day1);
    expect(store['visitor_salt:2026-09-25']).not.toBe(store['visitor_salt:2026-09-26']);
  });

  it('stores the salt with a short TTL so old hashes become irreversible', async () => {
    const kv = createMockKV();
    await getVisitorHash(requestFrom('203.0.113.7'), kv, '2026-09-25');
    expect(kv.put).toHaveBeenCalledWith(
      'visitor_salt:2026-09-25',
      expect.stringMatching(/^[0-9a-f]{32}$/),
      { expirationTtl: 2 * 24 * 60 * 60 },
    );
  });

  it('reuses an existing salt from KV (shared across isolates)', async () => {
    const kv = createMockKV({ 'visitor_salt:2026-09-25': 'a'.repeat(32) });
    const first = await getVisitorHash(requestFrom('203.0.113.7'), kv, '2026-09-25');
    resetVisitorSaltCache();
    const second = await getVisitorHash(requestFrom('203.0.113.7'), kv, '2026-09-25');
    expect(second).toBe(first);
    expect(kv.put).not.toHaveBeenCalled();
  });
});

describe('addToVisitorSet', () => {
  it('reports a new visitor once and stores it', async () => {
    const store: Record<string, string> = {};
    const kv = createMockKV(store);
    expect(await addToVisitorSet(kv, 'visitors:okr:2026-09-25', 'abc')).toBe(true);
    expect(await addToVisitorSet(kv, 'visitors:okr:2026-09-25', 'abc')).toBe(false);
    expect(JSON.parse(store['visitors:okr:2026-09-25'])).toEqual(['abc']);
  });

  it('recovers from a corrupt set', async () => {
    const kv = createMockKV({ key: 'not json' });
    expect(await addToVisitorSet(kv, 'key', 'abc')).toBe(true);
  });

  it('stops storing once the set is full but still reports new visitors', async () => {
    const full = Array.from({ length: MAX_VISITORS_PER_SET }, (_, i) => `h${i}`);
    const kv = createMockKV({ key: JSON.stringify(full) });
    expect(await addToVisitorSet(kv, 'key', 'new')).toBe(true);
    expect(kv.put).not.toHaveBeenCalled();
  });
});
