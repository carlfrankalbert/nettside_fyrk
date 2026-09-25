import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { trackClick, logEvent } from './tracking';

// Mock dependencies
vi.mock('./request-signing', () => ({
  signRequest: vi.fn((payload: unknown) => payload),
}));

vi.mock('./fetch-retry', () => ({
  fetchWithRetryFireAndForget: vi.fn(),
}));

vi.mock('../scripts/tracking-exclusion', () => ({
  shouldExcludeFromTracking: vi.fn(() => false),
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

  it('sends no metadata and stores nothing on the device', () => {
    trackClick('test_button');

    const body = JSON.parse(
      (fetchWithRetryFireAndForget as ReturnType<typeof vi.fn>).mock.calls[0][1].body
    );
    expect(body.metadata).toBeUndefined();
    expect(localStorage.length).toBe(0);
  });
});

describe('logEvent', () => {
  it('sends event with metadata', () => {
    logEvent('okr_success', { processingTimeMs: 1500, charCount: 200 });

    const body = JSON.parse(
      (fetchWithRetryFireAndForget as ReturnType<typeof vi.fn>).mock.calls[0][1].body
    );
    expect(body.buttonId).toBe('okr_success');
    expect(body.metadata.processingTimeMs).toBe(1500);
    expect(body.metadata.charCount).toBe(200);
  });

  it('works without metadata', () => {
    logEvent('simple_event');

    const body = JSON.parse(
      (fetchWithRetryFireAndForget as ReturnType<typeof vi.fn>).mock.calls[0][1].body
    );
    expect(body.buttonId).toBe('simple_event');
    expect(body.metadata).toBeUndefined();
  });
});
