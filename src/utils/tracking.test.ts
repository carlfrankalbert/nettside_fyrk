import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { trackClick, logEvent } from './tracking';

// Mock dependencies
vi.mock('./request-signing', () => ({
  signRequest: vi.fn((payload: unknown) => payload),
}));

vi.mock('./fetch-retry', () => ({
  fetchWithRetryFireAndForget: vi.fn(),
}));

import { fetchWithRetryFireAndForget } from './fetch-retry';

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  localStorage.clear();
});

describe('trackClick', () => {
  it('sends POST request with buttonId', () => {
    trackClick('test_button');

    expect(fetchWithRetryFireAndForget).toHaveBeenCalledWith(
      '/api/track',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const body = JSON.parse(
      (fetchWithRetryFireAndForget as ReturnType<typeof vi.fn>).mock.calls[0][1].body
    );
    expect(body.buttonId).toBe('test_button');
  });

  it('includes sessionId in metadata', () => {
    trackClick('test_button');

    const body = JSON.parse(
      (fetchWithRetryFireAndForget as ReturnType<typeof vi.fn>).mock.calls[0][1].body
    );
    expect(body.metadata.sessionId).toBeDefined();
    expect(typeof body.metadata.sessionId).toBe('string');
    expect(body.metadata.sessionId.length).toBeGreaterThan(0);
  });

  it('uses same sessionId across calls', () => {
    trackClick('button1');
    trackClick('button2');

    const body1 = JSON.parse(
      (fetchWithRetryFireAndForget as ReturnType<typeof vi.fn>).mock.calls[0][1].body
    );
    const body2 = JSON.parse(
      (fetchWithRetryFireAndForget as ReturnType<typeof vi.fn>).mock.calls[1][1].body
    );
    expect(body1.metadata.sessionId).toBe(body2.metadata.sessionId);
  });
});

describe('logEvent', () => {
  it('sends event with metadata', () => {
    logEvent('check_success', { processingTimeMs: 1500, charCount: 200 });

    const body = JSON.parse(
      (fetchWithRetryFireAndForget as ReturnType<typeof vi.fn>).mock.calls[0][1].body
    );
    expect(body.buttonId).toBe('check_success');
    expect(body.metadata.processingTimeMs).toBe(1500);
    expect(body.metadata.charCount).toBe(200);
    expect(body.metadata.sessionId).toBeDefined();
  });

  it('works without metadata', () => {
    logEvent('simple_event');

    const body = JSON.parse(
      (fetchWithRetryFireAndForget as ReturnType<typeof vi.fn>).mock.calls[0][1].body
    );
    expect(body.buttonId).toBe('simple_event');
    expect(body.metadata.sessionId).toBeDefined();
  });
});
