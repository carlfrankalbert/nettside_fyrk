import { describe, it, expect } from 'vitest';
import { getMany, parseCount, parseJson, parseHashes, KV_BULK_GET_MAX } from './kv-batch';
import { createMockKV } from '../test/mock-kv';

describe('getMany', () => {
  it('returns every requested key, with null for missing ones', async () => {
    const { kv } = createMockKV({ a: '1', c: '3' });
    const values = await getMany(kv, ['a', 'b', 'c']);
    expect([...values]).toEqual([['a', '1'], ['b', null], ['c', '3']]);
  });

  it('reads 100 keys per operation and dedupes', async () => {
    const keys = Array.from({ length: 250 }, (_, i) => `k${i}`);
    const { kv, stats } = createMockKV(Object.fromEntries(keys.map((k) => [k, '1'])));

    const values = await getMany(kv, [...keys, ...keys]);

    expect(values.size).toBe(250);
    expect(stats.operations).toBe(Math.ceil(250 / KV_BULK_GET_MAX));
  });

  it('makes no calls for no keys', async () => {
    const { kv, stats } = createMockKV();
    expect((await getMany(kv, [])).size).toBe(0);
    expect(stats.operations).toBe(0);
  });
});

describe('parsers', () => {
  it('parseCount treats missing and garbage as 0', () => {
    expect(parseCount('42')).toBe(42);
    expect(parseCount(null)).toBe(0);
    expect(parseCount(undefined)).toBe(0);
    expect(parseCount('abc')).toBe(0);
  });

  it('parseJson falls back on missing or corrupt values', () => {
    expect(parseJson('{"a":1}', {})).toEqual({ a: 1 });
    expect(parseJson(null, { x: 0 })).toEqual({ x: 0 });
    expect(parseJson('{broken', [])).toEqual([]);
  });

  it('parseHashes keeps only string arrays', () => {
    expect(parseHashes('["a","b"]')).toEqual(['a', 'b']);
    expect(parseHashes('["a",1,null]')).toEqual(['a']);
    expect(parseHashes('{"a":1}')).toEqual([]);
    expect(parseHashes('nope')).toEqual([]);
    expect(parseHashes(null)).toEqual([]);
  });
});
