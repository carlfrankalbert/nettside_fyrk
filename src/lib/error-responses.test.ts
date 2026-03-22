import { describe, it, expect } from 'vitest';
import { createRateLimitResponse, createCircuitBreakerResponse, createDailyBudgetResponse } from './error-responses';

describe('createRateLimitResponse', () => {
  it('returns 429 with Retry-After 60', async () => {
    const res = createRateLimitResponse();
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('60');
    const body = (await res.json()) as { error: string; details: string };
    expect(body.error).toBeTruthy();
    expect(body.details).toBeTruthy();
  });

  it('includes X-Request-ID when provided', () => {
    const res = createRateLimitResponse('req-123');
    expect(res.headers.get('X-Request-ID')).toBe('req-123');
  });

  it('omits X-Request-ID when not provided', () => {
    const res = createRateLimitResponse();
    expect(res.headers.get('X-Request-ID')).toBeNull();
  });
});

describe('createCircuitBreakerResponse', () => {
  it('returns 503 with Retry-After 30', async () => {
    const res = createCircuitBreakerResponse();
    expect(res.status).toBe(503);
    expect(res.headers.get('Retry-After')).toBe('30');
    const body = (await res.json()) as { error: string };
    expect(body.error).toBeTruthy();
  });

  it('includes X-Request-ID when provided', () => {
    const res = createCircuitBreakerResponse('req-456');
    expect(res.headers.get('X-Request-ID')).toBe('req-456');
  });
});

describe('createDailyBudgetResponse', () => {
  it('returns 429 with Retry-After 3600', async () => {
    const res = createDailyBudgetResponse();
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('3600');
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain('grense');
  });

  it('includes X-Request-ID when provided', () => {
    const res = createDailyBudgetResponse('req-789');
    expect(res.headers.get('X-Request-ID')).toBe('req-789');
  });
});
