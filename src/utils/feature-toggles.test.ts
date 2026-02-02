import { describe, it, expect, vi } from 'vitest';
import {
  hasBetaAccess,
  isFeatureEnabled,
  getFeatureToggles,
  DEFAULT_FEATURES,
  BETA_COOKIE_NAME,
  FEATURE_TOGGLES_KV_KEY,
} from './feature-toggles';

function mockCookies(values: Record<string, string> = {}) {
  return {
    get(name: string) {
      if (name in values) {
        return { value: values[name] };
      }
      return undefined;
    },
  };
}

function mockKV(data: Record<string, string> = {}) {
  return {
    get: vi.fn(async (key: string) => data[key] ?? null),
    put: vi.fn(async () => {}),
  } as unknown as KVNamespace;
}

describe('hasBetaAccess', () => {
  it('returns true when beta cookie is set to true', () => {
    expect(hasBetaAccess(mockCookies({ [BETA_COOKIE_NAME]: 'true' }))).toBe(true);
  });

  it('returns false when beta cookie is missing', () => {
    expect(hasBetaAccess(mockCookies())).toBe(false);
  });

  it('returns false when beta cookie has wrong value', () => {
    expect(hasBetaAccess(mockCookies({ [BETA_COOKIE_NAME]: 'false' }))).toBe(false);
  });
});

describe('getFeatureToggles', () => {
  it('returns defaults when KV is empty', async () => {
    const kv = mockKV();
    const result = await getFeatureToggles(kv);
    expect(result.features).toEqual(DEFAULT_FEATURES);
  });

  it('returns stored data merged with defaults', async () => {
    const stored = {
      features: [{ id: 'okr-sjekken', name: 'OKR', description: 'test', status: 'off' as const }],
      updatedAt: '2026-01-01T00:00:00Z',
    };
    const kv = mockKV({ [FEATURE_TOGGLES_KV_KEY]: JSON.stringify(stored) });
    const result = await getFeatureToggles(kv);

    // okr-sjekken should have stored status 'off' instead of default 'on'
    const okr = result.features.find((f) => f.id === 'okr-sjekken');
    expect(okr?.status).toBe('off');

    // Other features should have default status
    const konseptspeil = result.features.find((f) => f.id === 'konseptspeilet');
    expect(konseptspeil?.status).toBe('on');
  });

  it('returns defaults when stored data is invalid JSON', async () => {
    const kv = mockKV({ [FEATURE_TOGGLES_KV_KEY]: 'not json' });
    const result = await getFeatureToggles(kv);
    expect(result.features).toEqual(DEFAULT_FEATURES);
  });
});

describe('isFeatureEnabled', () => {
  it('returns false when KV is undefined', async () => {
    expect(await isFeatureEnabled('okr-sjekken', undefined, mockCookies())).toBe(false);
  });

  it('returns true for on features', async () => {
    const kv = mockKV();
    expect(await isFeatureEnabled('okr-sjekken', kv, mockCookies())).toBe(true);
  });

  it('returns false for unknown feature', async () => {
    const kv = mockKV();
    expect(await isFeatureEnabled('nonexistent', kv, mockCookies())).toBe(false);
  });

  it('returns true for beta feature with beta cookie', async () => {
    const kv = mockKV();
    const cookies = mockCookies({ [BETA_COOKIE_NAME]: 'true' });
    expect(await isFeatureEnabled('pre-mortem', kv, cookies)).toBe(true);
  });

  it('returns false for beta feature without beta cookie', async () => {
    const kv = mockKV();
    expect(await isFeatureEnabled('pre-mortem', kv, mockCookies())).toBe(false);
  });

  it('returns false for off feature', async () => {
    const stored = {
      features: [{ id: 'okr-sjekken', name: 'OKR', description: 'test', status: 'off' as const }],
      updatedAt: '2026-01-01T00:00:00Z',
    };
    const kv = mockKV({ [FEATURE_TOGGLES_KV_KEY]: JSON.stringify(stored) });
    expect(await isFeatureEnabled('okr-sjekken', kv, mockCookies())).toBe(false);
  });
});
