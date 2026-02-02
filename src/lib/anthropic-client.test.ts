import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  sleep,
  calculateBackoffDelay,
  isRetryableStatusCode,
  createAnthropicHeaders,
  getClientIP,
  createAnthropicRequestBody,
  resolveAnthropicConfig,
  createCircuitBreaker,
  fetchWithRetry,
  RETRY_CONFIG,
  type RetryConfig,
} from './anthropic-client';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('sleep', () => {
  it('resolves after the specified duration', async () => {
    vi.useFakeTimers();
    const promise = sleep(500);
    vi.advanceTimersByTime(500);
    await expect(promise).resolves.toBeUndefined();
  });
});

describe('calculateBackoffDelay', () => {
  it('returns value in expected range for attempt 0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const delay = calculateBackoffDelay(0);
    // base=1000, jitter=0.5*0.3*1000=150, total=1150
    expect(delay).toBe(1150);
  });

  it('increases exponentially with attempt', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const d0 = calculateBackoffDelay(0);
    const d1 = calculateBackoffDelay(1);
    expect(d1).toBeGreaterThan(d0);
  });

  it('caps at MAX_DELAY_MS', () => {
    const delay = calculateBackoffDelay(10);
    expect(delay).toBeLessThanOrEqual(RETRY_CONFIG.MAX_DELAY_MS);
  });

  it('accepts custom config', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const custom = { ...RETRY_CONFIG, INITIAL_DELAY_MS: 100 } as unknown as RetryConfig;
    expect(calculateBackoffDelay(0, custom)).toBe(100);
  });
});

describe('isRetryableStatusCode', () => {
  it('returns true for retryable codes', () => {
    for (const code of [429, 500, 502, 503, 504]) {
      expect(isRetryableStatusCode(code)).toBe(true);
    }
  });

  it('returns false for non-retryable codes', () => {
    for (const code of [200, 400, 401, 403, 404]) {
      expect(isRetryableStatusCode(code)).toBe(false);
    }
  });
});

describe('createAnthropicHeaders', () => {
  it('returns correct headers with api key', () => {
    const headers = createAnthropicHeaders('test-key');
    expect(headers['x-api-key']).toBe('test-key');
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['anthropic-version']).toBe('2023-06-01');
  });
});

describe('getClientIP', () => {
  const makeRequest = (headers: Record<string, string>) =>
    new Request('http://test', { headers });

  it('uses cf-connecting-ip first', () => {
    const result = getClientIP(makeRequest({ 'cf-connecting-ip': '1.2.3.4' }));
    expect(result).not.toBe('unknown');
    expect(typeof result).toBe('string');
  });

  it('falls back to x-forwarded-for', () => {
    const result = getClientIP(makeRequest({ 'x-forwarded-for': '5.6.7.8, 9.10.11.12' }));
    expect(result).not.toBe('unknown');
  });

  it('falls back to x-real-ip', () => {
    const result = getClientIP(makeRequest({ 'x-real-ip': '13.14.15.16' }));
    expect(result).not.toBe('unknown');
  });

  it('returns unknown when no headers present', () => {
    expect(getClientIP(makeRequest({}))).toBe('unknown');
  });

  it('returns consistent hash for same IP', () => {
    const r1 = getClientIP(makeRequest({ 'cf-connecting-ip': '1.2.3.4' }));
    const r2 = getClientIP(makeRequest({ 'cf-connecting-ip': '1.2.3.4' }));
    expect(r1).toBe(r2);
  });

  it('returns different hash for different IPs', () => {
    const r1 = getClientIP(makeRequest({ 'cf-connecting-ip': '1.2.3.4' }));
    const r2 = getClientIP(makeRequest({ 'cf-connecting-ip': '5.6.7.8' }));
    expect(r1).not.toBe(r2);
  });
});

describe('createAnthropicRequestBody', () => {
  it('returns correct shape', () => {
    const body = createAnthropicRequestBody('system', 'user msg', 'claude-3', true);
    expect(body).toEqual({
      model: 'claude-3',
      max_tokens: 4096,
      system: 'system',
      messages: [{ role: 'user', content: 'user msg' }],
      stream: true,
    });
  });

  it('accepts custom maxTokens', () => {
    const body = createAnthropicRequestBody('s', 'u', 'm', false, 1024);
    expect(body.max_tokens).toBe(1024);
  });
});

describe('resolveAnthropicConfig', () => {
  it('uses cloudflare env when present', () => {
    const locals = {
      runtime: { env: { ANTHROPIC_API_KEY: 'cf-key', ANTHROPIC_MODEL: 'cf-model' } },
    } as unknown as App.Locals;
    const result = resolveAnthropicConfig(locals);
    expect(result.apiKey).toBe('cf-key');
    expect(result.model).toBe('cf-model');
  });

  it('uses default model when none set', () => {
    const locals = {
      runtime: { env: { ANTHROPIC_API_KEY: 'key' } },
    } as unknown as App.Locals;
    const result = resolveAnthropicConfig(locals);
    expect(result.model).toBe('claude-sonnet-4-5-20250929');
  });

  it('returns undefined apiKey when none available', () => {
    const locals = {} as unknown as App.Locals;
    const result = resolveAnthropicConfig(locals);
    expect(result.apiKey).toBeUndefined();
  });
});

describe('fetchWithRetry', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('returns response on success', async () => {
    mockFetch.mockResolvedValueOnce(new Response('ok', { status: 200 }));
    const res = await fetchWithRetry('http://test', {}, 5000);
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('returns non-retryable error without retry', async () => {
    mockFetch.mockResolvedValueOnce(new Response('bad', { status: 400 }));
    const res = await fetchWithRetry('http://test', {}, 5000);
    expect(res.status).toBe(400);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('retries on retryable status and returns last response', async () => {
    mockFetch
      .mockResolvedValueOnce(new Response('err', { status: 503 }))
      .mockResolvedValueOnce(new Response('err', { status: 503 }))
      .mockResolvedValueOnce(new Response('err', { status: 503 }));

    const config = { ...RETRY_CONFIG, INITIAL_DELAY_MS: 1 } as unknown as RetryConfig;
    const res = await fetchWithRetry('http://test', {}, 5000, { config });
    expect(res.status).toBe(503);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('retries and succeeds on second attempt', async () => {
    mockFetch
      .mockResolvedValueOnce(new Response('err', { status: 503 }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));

    const config = { ...RETRY_CONFIG, INITIAL_DELAY_MS: 1 } as unknown as RetryConfig;
    const res = await fetchWithRetry('http://test', {}, 5000, { config });
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('throws AbortError immediately without retry', async () => {
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValueOnce(abortError);

    await expect(fetchWithRetry('http://test', {}, 5000)).rejects.toThrow('Aborted');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('throws network error after retries exhausted', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const config = { ...RETRY_CONFIG, INITIAL_DELAY_MS: 1 } as unknown as RetryConfig;
    await expect(fetchWithRetry('http://test', {}, 5000, { config })).rejects.toThrow('Network error');
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
});

describe('createCircuitBreaker', () => {
  it('allows requests when closed', () => {
    const cb = createCircuitBreaker();
    expect(cb.check()).toBe(true);
  });

  it('opens after failure threshold', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const cb = createCircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 30000 });
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.check()).toBe(true);
    cb.recordFailure();
    expect(cb.check()).toBe(false);
  });

  it('resets after timeout (half-open)', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    const cb = createCircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 1000 });
    cb.recordFailure();
    expect(cb.check()).toBe(false);

    vi.spyOn(Date, 'now').mockReturnValue(now + 1001);
    expect(cb.check()).toBe(true);
  });

  it('recordSuccess resets state', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const cb = createCircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 30000 });
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.check()).toBe(false);
    cb.recordSuccess();
    expect(cb.check()).toBe(true);
    expect(cb.getState().failures).toBe(0);
  });

  it('getState returns copy of state', () => {
    const cb = createCircuitBreaker();
    const state = cb.getState();
    expect(state).toEqual({ failures: 0, lastFailure: 0, isOpen: false });
  });
});
