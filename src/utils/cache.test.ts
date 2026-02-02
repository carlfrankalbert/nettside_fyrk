import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CACHE_CONFIG,
  hashInput,
  isCacheExpired,
  createServerCacheManager,
  createRateLimiter,
  localStorageCache,
} from './cache';

describe('hashInput', () => {
  it('returns a hex string', async () => {
    const hash = await hashInput('test input');
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it('returns same hash for same input', async () => {
    const a = await hashInput('hello');
    const b = await hashInput('hello');
    expect(a).toBe(b);
  });

  it('is case-insensitive', async () => {
    const a = await hashInput('Hello');
    const b = await hashInput('hello');
    expect(a).toBe(b);
  });

  it('trims whitespace', async () => {
    const a = await hashInput('  hello  ');
    const b = await hashInput('hello');
    expect(a).toBe(b);
  });

  it('returns different hashes for different inputs', async () => {
    const a = await hashInput('hello');
    const b = await hashInput('world');
    expect(a).not.toBe(b);
  });
});

describe('isCacheExpired', () => {
  it('returns false for fresh entry', () => {
    expect(isCacheExpired(Date.now())).toBe(false);
  });

  it('returns true for old entry', () => {
    const twoHoursAgo = Date.now() - CACHE_CONFIG.TTL_MS - 1;
    expect(isCacheExpired(twoHoursAgo)).toBe(true);
  });

  it('respects custom TTL', () => {
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    expect(isCacheExpired(fiveMinAgo, 10 * 60 * 1000)).toBe(false);
    expect(isCacheExpired(fiveMinAgo, 1 * 60 * 1000)).toBe(true);
  });
});

describe('createServerCacheManager', () => {
  it('stores and retrieves entries', () => {
    const cache = createServerCacheManager();
    cache.set('key1', 'value1');
    const entry = cache.get('key1');
    expect(entry).not.toBeNull();
    expect(entry!.output).toBe('value1');
  });

  it('returns null for missing key', () => {
    const cache = createServerCacheManager();
    expect(cache.get('nonexistent')).toBeNull();
  });

  it('returns null for expired entries', () => {
    const cache = createServerCacheManager();
    cache.set('key1', 'value1');

    // Manually expire the entry
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + CACHE_CONFIG.TTL_MS + 1);
    expect(cache.get('key1')).toBeNull();
    vi.restoreAllMocks();
  });

  it('tracks size', () => {
    const cache = createServerCacheManager();
    expect(cache.size()).toBe(0);
    cache.set('key1', 'value1');
    expect(cache.size()).toBe(1);
  });

  it('cleanup removes expired entries', () => {
    const cache = createServerCacheManager();
    cache.set('key1', 'value1');

    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + CACHE_CONFIG.TTL_MS + 1);
    cache.cleanup();
    expect(cache.size()).toBe(0);
    vi.restoreAllMocks();
  });
});

describe('createRateLimiter', () => {
  it('allows requests within limit', () => {
    const limiter = createRateLimiter();
    for (let i = 0; i < CACHE_CONFIG.RATE_LIMIT_MAX_REQUESTS; i++) {
      expect(limiter.checkAndUpdate('user1')).toBe(true);
    }
  });

  it('blocks requests over limit', () => {
    const limiter = createRateLimiter();
    for (let i = 0; i < CACHE_CONFIG.RATE_LIMIT_MAX_REQUESTS; i++) {
      limiter.checkAndUpdate('user1');
    }
    expect(limiter.checkAndUpdate('user1')).toBe(false);
  });

  it('resets after window expires', () => {
    const limiter = createRateLimiter();
    for (let i = 0; i < CACHE_CONFIG.RATE_LIMIT_MAX_REQUESTS; i++) {
      limiter.checkAndUpdate('user1');
    }
    expect(limiter.checkAndUpdate('user1')).toBe(false);

    // Move past the rate limit window
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + CACHE_CONFIG.RATE_LIMIT_WINDOW_MS + 1);
    expect(limiter.checkAndUpdate('user1')).toBe(true);
    vi.restoreAllMocks();
  });

  it('tracks different users independently', () => {
    const limiter = createRateLimiter();
    for (let i = 0; i < CACHE_CONFIG.RATE_LIMIT_MAX_REQUESTS; i++) {
      limiter.checkAndUpdate('user1');
    }
    expect(limiter.checkAndUpdate('user1')).toBe(false);
    expect(limiter.checkAndUpdate('user2')).toBe(true);
  });

  it('tracks size', () => {
    const limiter = createRateLimiter();
    limiter.checkAndUpdate('user1');
    limiter.checkAndUpdate('user2');
    expect(limiter.size()).toBe(2);
  });
});

describe('localStorageCache', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset the cached availability check
    (localStorageCache as unknown as { _available: boolean | null })._available = null;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('stores and retrieves values', () => {
    localStorageCache.set('test-key', 'test-value');
    expect(localStorageCache.get('test-key')).toBe('test-value');
  });

  it('returns null for missing key', () => {
    expect(localStorageCache.get('nonexistent')).toBeNull();
  });

  it('returns null for expired entry', () => {
    localStorageCache.set('test-key', 'test-value');

    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + CACHE_CONFIG.TTL_MS + 1);
    expect(localStorageCache.get('test-key')).toBeNull();
    vi.restoreAllMocks();
  });

  it('removes entries', () => {
    localStorageCache.set('test-key', 'test-value');
    localStorageCache.remove('test-key');
    expect(localStorageCache.get('test-key')).toBeNull();
  });

  it('tracks size', () => {
    expect(localStorageCache.size()).toBe(0);
    localStorageCache.set('key1', 'value1');
    expect(localStorageCache.size()).toBe(1);
  });
});
