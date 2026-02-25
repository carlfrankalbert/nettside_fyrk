import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing module under test
vi.mock('./tracking-exclusion', () => ({
  shouldExcludeFromTracking: vi.fn(() => false),
}));

vi.mock('../utils/request-signing', () => ({
  signRequest: vi.fn((payload: unknown) => ({ payload, _ts: 123, _sig: 'mock' })),
}));

vi.mock('../utils/fetch-retry', () => ({
  fetchWithRetryFireAndForget: vi.fn(),
}));

import { initPageViewTracking } from './pageview-tracking';
import { fetchWithRetryFireAndForget } from '../utils/fetch-retry';
import { shouldExcludeFromTracking } from './tracking-exclusion';

function getLastPayload(): Record<string, unknown> {
  const mock = fetchWithRetryFireAndForget as ReturnType<typeof vi.fn>;
  const body = mock.mock.calls[0][1].body;
  return JSON.parse(body).payload;
}

beforeEach(() => {
  vi.clearAllMocks();

  // Default: no referrer, no UTM params
  Object.defineProperty(document, 'referrer', { value: '', writable: true, configurable: true });
  Object.defineProperty(window, 'location', {
    value: { hostname: 'fyrk.no', search: '' },
    writable: true,
    configurable: true,
  });
});

describe('referrer handling', () => {
  it('includes external referrer domain in payload', () => {
    Object.defineProperty(document, 'referrer', { value: 'https://google.com/search?q=fyrk', configurable: true });

    initPageViewTracking('home');

    expect(getLastPayload().referrer).toBe('google.com');
  });

  it('strips www. prefix from referrer', () => {
    Object.defineProperty(document, 'referrer', { value: 'https://www.linkedin.com/feed', configurable: true });

    initPageViewTracking('okr');

    expect(getLastPayload().referrer).toBe('linkedin.com');
  });

  it('skips internal referrer (same hostname)', () => {
    Object.defineProperty(document, 'referrer', { value: 'https://fyrk.no/okr-sjekken', configurable: true });

    initPageViewTracking('home');

    expect(getLastPayload().referrer).toBeUndefined();
  });

  it('handles missing referrer', () => {
    initPageViewTracking('home');

    expect(getLastPayload().referrer).toBeUndefined();
  });
});

describe('UTM handling', () => {
  it('captures utm_source, utm_medium, utm_campaign from URL', () => {
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'fyrk.no',
        search: '?utm_source=linkedin&utm_medium=social&utm_campaign=launch',
      },
      configurable: true,
    });

    initPageViewTracking('home');

    const payload = getLastPayload();
    expect(payload.utmSource).toBe('linkedin');
    expect(payload.utmMedium).toBe('social');
    expect(payload.utmCampaign).toBe('launch');
  });

  it('lowercases UTM values', () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'fyrk.no', search: '?utm_source=LinkedIn' },
      configurable: true,
    });

    initPageViewTracking('home');

    expect(getLastPayload().utmSource).toBe('linkedin');
  });

  it('omits absent UTM params', () => {
    initPageViewTracking('home');

    const payload = getLastPayload();
    expect(payload.utmSource).toBeUndefined();
    expect(payload.utmMedium).toBeUndefined();
    expect(payload.utmCampaign).toBeUndefined();
  });
});

describe('integration', () => {
  it('sends payload to /api/pageview', () => {
    initPageViewTracking('konseptspeil');

    expect(fetchWithRetryFireAndForget).toHaveBeenCalledWith(
      '/api/pageview',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  it('includes pageId in payload', () => {
    initPageViewTracking('okr');

    expect(getLastPayload().pageId).toBe('okr');
  });

  it('skips when excluded from tracking', () => {
    (shouldExcludeFromTracking as ReturnType<typeof vi.fn>).mockReturnValue(true);

    initPageViewTracking('home');

    expect(fetchWithRetryFireAndForget).not.toHaveBeenCalled();
  });
});
