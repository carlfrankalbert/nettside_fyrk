import { describe, it, expect } from 'vitest';
import {
  createJsonResponse,
  createErrorResponse,
  createCachedStreamingResponse,
} from './streaming-response';

/** Read a server-sent-events body into the list of decoded payloads. */
async function readSSE(response: Response): Promise<string[]> {
  const text = await response.text();
  return text
    .split('\n\n')
    .filter(Boolean)
    .map((line) => line.replace(/^data: /, ''));
}

describe('createJsonResponse', () => {
  it('serialises the payload with a JSON content type', async () => {
    const res = createJsonResponse({ result: 'ok' });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toMatch(/application\/json/);
    expect(await res.json()).toEqual({ result: 'ok' });
  });

  it('marks a cache miss by default and a hit when told', () => {
    expect(createJsonResponse({}).headers.get('X-Cache')).toBe('MISS');
    expect(createJsonResponse({}, { cacheStatus: 'HIT' }).headers.get('X-Cache')).toBe('HIT');
  });

  it('carries an explicit status and request id', () => {
    const res = createJsonResponse({}, { status: 202, requestId: 'req-1' });

    expect(res.status).toBe(202);
    expect(res.headers.get('X-Request-ID')).toBe('req-1');
  });

  it('omits the request id header when none is given', () => {
    expect(createJsonResponse({}).headers.get('X-Request-ID')).toBeNull();
  });
});

describe('createErrorResponse', () => {
  it('defaults to 500 and puts the message under `error`', async () => {
    const res = createErrorResponse('noe gikk galt');

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'noe gikk galt' });
  });

  it('includes details only when provided', async () => {
    expect(await createErrorResponse('feil', 400, 'for kort').json()).toEqual({
      error: 'feil',
      details: 'for kort',
    });
    expect(await createErrorResponse('feil', 400).json()).not.toHaveProperty('details');
  });

  it('carries the request id so a user report can be traced', () => {
    expect(createErrorResponse('feil', 400, undefined, 'req-9').headers.get('X-Request-ID')).toBe(
      'req-9'
    );
  });
});

describe('createCachedStreamingResponse', () => {
  it('announces itself as a cache hit over SSE', () => {
    const res = createCachedStreamingResponse('hei', { delayMs: 0 });

    expect(res.headers.get('X-Cache')).toBe('HIT');
    expect(res.headers.get('Content-Type')).toMatch(/event-stream/);
    expect(res.headers.get('Cache-Control')).toMatch(/no-cache/);
  });

  it('splits the cached text into chunks and terminates the stream', async () => {
    const res = createCachedStreamingResponse('abcdefghij', { chunkSize: 4, delayMs: 0 });
    const payloads = await readSSE(res);

    expect(payloads.at(-1)).toBe('[DONE]');
    expect(payloads.slice(0, -1).map((p) => JSON.parse(p).text)).toEqual(['abcd', 'efgh', 'ij']);
  });

  it('reassembles into exactly the cached text', async () => {
    const cached = 'Dette er et lengre svar som ble hentet fra cache.';
    const payloads = await readSSE(createCachedStreamingResponse(cached, { delayMs: 0 }));

    const rebuilt = payloads
      .slice(0, -1)
      .map((p) => JSON.parse(p).text)
      .join('');
    expect(rebuilt).toBe(cached);
  });

  it('still terminates for empty cached output', async () => {
    // The chunk regex matches nothing for an empty string, so the fallback
    // emits a single empty chunk. Harmless for a client that appends, but the
    // stream must still close with [DONE].
    const payloads = await readSSE(createCachedStreamingResponse('', { delayMs: 0 }));

    expect(payloads.at(-1)).toBe('[DONE]');
    expect(JSON.parse(payloads[0]).text).toBe('');
  });

  it('carries the request id', () => {
    const res = createCachedStreamingResponse('hei', { delayMs: 0, requestId: 'req-2' });

    expect(res.headers.get('X-Request-ID')).toBe('req-2');
  });
});
