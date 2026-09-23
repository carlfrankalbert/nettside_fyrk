import { describe, it, expect, vi, afterEach } from 'vitest';
import { logger, createContextLogger } from './structured-logger';

function captured(spy: ReturnType<typeof vi.spyOn>) {
  return JSON.parse(spy.mock.calls[0][0] as string);
}

afterEach(() => vi.restoreAllMocks());

describe('logger', () => {
  it('writes a JSON entry with level, message and timestamp', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logger.info('tool completed');

    const entry = captured(spy);
    expect(entry.level).toBe('info');
    expect(entry.message).toBe('tool completed');
    expect(Number.isNaN(Date.parse(entry.timestamp))).toBe(false);
  });

  it('routes each level to its console method', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    logger.warn('slow');
    logger.error('failed');

    expect(captured(warn).level).toBe('warn');
    expect(captured(error).level).toBe('error');
  });

  it('includes context when present', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logger.info('done', { requestId: 'abc', durationMs: 42 });

    expect(captured(spy).context).toEqual({ requestId: 'abc', durationMs: 42 });
  });

  it('omits the context key entirely when empty', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logger.info('done', {});

    expect(captured(spy)).not.toHaveProperty('context');
  });

  it('drops undefined context values rather than logging nulls', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logger.info('done', { requestId: 'abc', tool: undefined });

    const { context } = captured(spy);
    expect(context).toEqual({ requestId: 'abc' });
    expect('tool' in context).toBe(false);
  });
});

describe('createContextLogger', () => {
  it('merges the preset context into every entry', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    createContextLogger({ requestId: 'r-1', tool: 'okr' }).info('started');

    expect(captured(spy).context).toEqual({ requestId: 'r-1', tool: 'okr' });
  });

  it('lets a per-call value override the preset', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    createContextLogger({ tool: 'okr', statusCode: 200 }).warn('retry', { statusCode: 429 });

    expect(captured(spy).context).toEqual({ tool: 'okr', statusCode: 429 });
  });
});
