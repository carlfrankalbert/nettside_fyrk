import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aggregateEventMetrics, emptyMetrics, type EventMetadata } from './analytics-metrics';

// ============================================================================
// KV mock
// ============================================================================

function createMockKV(store: Record<string, string> = {}) {
  return {
    get: vi.fn(async (key: string) => store[key] ?? null),
    put: vi.fn(async (key: string, value: string) => {
      store[key] = value;
    }),
  } as unknown as KVNamespace;
}

// ============================================================================
// Tests: emptyMetrics
// ============================================================================

describe('emptyMetrics', () => {
  it('returns zeroed metrics object', () => {
    const m = emptyMetrics();
    expect(m.count).toBe(0);
    expect(m.totalCharCount).toBe(0);
    expect(m.totalProcessingTimeMs).toBe(0);
    expect(m.cachedCount).toBe(0);
    expect(m.freshCount).toBe(0);
    expect(m.uniqueSessionCount).toBe(0);
    expect(m.errorTypes).toEqual({});
    expect(m.sessionHashBuckets).toEqual({});
    expect(m.hourlyDistribution).toEqual({});
  });
});

// ============================================================================
// Tests: aggregateEventMetrics
// ============================================================================

describe('aggregateEventMetrics', () => {
  let kv: KVNamespace;

  beforeEach(() => {
    kv = createMockKV();
  });

  it('creates new metrics entry when none exists', async () => {
    const metadata: EventMetadata = { charCount: 100, processingTimeMs: 500 };
    await aggregateEventMetrics(kv, 'okr_submit', '2025-01-15', metadata, Date.now());

    expect(kv.put).toHaveBeenCalledWith(
      'metrics:okr_submit:2025-01-15',
      expect.any(String),
      expect.objectContaining({ expirationTtl: expect.any(Number) }),
    );

    const stored = JSON.parse((kv.put as ReturnType<typeof vi.fn>).mock.calls[0][1]);
    expect(stored.count).toBe(1);
    expect(stored.totalCharCount).toBe(100);
    expect(stored.totalProcessingTimeMs).toBe(500);
  });

  it('accumulates onto existing metrics', async () => {
    const existing = {
      ...emptyMetrics(),
      count: 5,
      totalCharCount: 1000,
      totalProcessingTimeMs: 2000,
    };
    kv = createMockKV({ 'metrics:test:2025-01-15': JSON.stringify(existing) });

    await aggregateEventMetrics(kv, 'test', '2025-01-15', { charCount: 200 }, Date.now());

    const stored = JSON.parse((kv.put as ReturnType<typeof vi.fn>).mock.calls[0][1]);
    expect(stored.count).toBe(6);
    expect(stored.totalCharCount).toBe(1200);
  });

  it('tracks cached and fresh counts', async () => {
    await aggregateEventMetrics(kv, 'test', '2025-01-15', { cached: true }, Date.now());

    let stored = JSON.parse((kv.put as ReturnType<typeof vi.fn>).mock.calls[0][1]);
    expect(stored.cachedCount).toBe(1);
    expect(stored.freshCount).toBe(0);

    // New KV for fresh request
    kv = createMockKV();
    await aggregateEventMetrics(kv, 'test', '2025-01-15', { cached: false }, Date.now());

    stored = JSON.parse((kv.put as ReturnType<typeof vi.fn>).mock.calls[0][1]);
    expect(stored.cachedCount).toBe(0);
    expect(stored.freshCount).toBe(1);
  });

  it('tracks error types', async () => {
    await aggregateEventMetrics(kv, 'test', '2025-01-15', { errorType: 'timeout' }, Date.now());

    const stored = JSON.parse((kv.put as ReturnType<typeof vi.fn>).mock.calls[0][1]);
    expect(stored.errorTypes.timeout).toBe(1);
  });

  it('tracks unique sessions via hash buckets', async () => {
    await aggregateEventMetrics(kv, 'test', '2025-01-15', { sessionId: 'abc123' }, Date.now());

    const stored = JSON.parse((kv.put as ReturnType<typeof vi.fn>).mock.calls[0][1]);
    expect(stored.uniqueSessionCount).toBe(1);
    expect(stored.sessionHashBuckets['ab']).toBe(true);
  });

  it('deduplicates sessions with same hash bucket', async () => {
    const existing = {
      ...emptyMetrics(),
      uniqueSessionCount: 1,
      sessionHashBuckets: { 'ab': true },
    };
    kv = createMockKV({ 'metrics:test:2025-01-15': JSON.stringify(existing) });

    await aggregateEventMetrics(kv, 'test', '2025-01-15', { sessionId: 'abXYZ' }, Date.now());

    const stored = JSON.parse((kv.put as ReturnType<typeof vi.fn>).mock.calls[0][1]);
    expect(stored.uniqueSessionCount).toBe(1); // Not incremented
  });

  it('tracks hourly distribution', async () => {
    const timestamp = new Date('2025-01-15T14:30:00Z').getTime();
    await aggregateEventMetrics(kv, 'test', '2025-01-15', { charCount: 50 }, timestamp);

    const stored = JSON.parse((kv.put as ReturnType<typeof vi.fn>).mock.calls[0][1]);
    expect(stored.hourlyDistribution['14']).toBe(1);
  });

  it('handles corrupt existing data gracefully', async () => {
    kv = createMockKV({ 'metrics:test:2025-01-15': 'not json' });

    await aggregateEventMetrics(kv, 'test', '2025-01-15', { charCount: 100 }, Date.now());

    const stored = JSON.parse((kv.put as ReturnType<typeof vi.fn>).mock.calls[0][1]);
    expect(stored.count).toBe(1);
    expect(stored.totalCharCount).toBe(100);
  });

  it('migrates old uniqueSessions array to count', async () => {
    const legacy = {
      ...emptyMetrics(),
      uniqueSessions: ['hash1', 'hash2', 'hash3'],
      uniqueSessionCount: 0,
    };
    kv = createMockKV({ 'metrics:test:2025-01-15': JSON.stringify(legacy) });

    await aggregateEventMetrics(kv, 'test', '2025-01-15', {}, Date.now());

    const stored = JSON.parse((kv.put as ReturnType<typeof vi.fn>).mock.calls[0][1]);
    expect(stored.uniqueSessionCount).toBe(3);
  });
});
