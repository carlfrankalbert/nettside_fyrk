import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { APIContext } from 'astro';
import { createAIToolHandler, type AIToolConfig } from './ai-tool-handler';

/**
 * These cover the guard rails a request passes through before any Anthropic
 * call is made: content type, origin, body shape, input length, and mock mode.
 * Every path asserted here returns without network access, which is the point
 * — they are what protects the API budget and blocks abuse.
 */

const VALID_INPUT = 'x'.repeat(50);

function baseConfig(overrides: Partial<AIToolConfig> = {}): AIToolConfig {
  return {
    toolName: 'okr',
    cacheKeyPrefix: 'test:v1',
    systemPrompt: 'system',
    createUserMessage: (input) => input,
    validateOutput: () => true,
    errorMessage: 'AI-kallet feilet',
    missingInputMessage: 'Mangler input',
    ...overrides,
  };
}

/** A request the handler will accept, unless a test overrides part of it. */
function post(
  body: unknown,
  { contentType = 'application/json', origin }: { contentType?: string | null; origin?: string } = {}
): APIContext {
  const headers: Record<string, string> = {};
  if (contentType) headers['content-type'] = contentType;
  if (origin) headers['origin'] = origin;
  headers['host'] = 'fyrk.no';
  headers['cf-connecting-ip'] = `10.0.0.${Math.floor(Math.random() * 255)}`;

  const request = {
    headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
    json: async () => {
      if (typeof body === 'string') throw new SyntaxError('Unexpected token');
      return body;
    },
  } as unknown as Request;

  return { request, locals: {} } as unknown as APIContext;
}

async function errorOf(response: Response): Promise<string> {
  const body = (await response.json()) as { error: string };
  return body.error;
}

beforeEach(() => {
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('createAIToolHandler — request gates', () => {
  it('rejects a non-JSON content type with 415', async () => {
    const res = await createAIToolHandler(baseConfig())(
      post({ input: VALID_INPUT }, { contentType: 'text/plain' })
    );

    expect(res.status).toBe(415);
    expect(await errorOf(res)).toMatch(/Content-Type/);
  });

  it('rejects a missing content type with 415', async () => {
    const res = await createAIToolHandler(baseConfig())(
      post({ input: VALID_INPUT }, { contentType: null })
    );

    expect(res.status).toBe(415);
  });

  it('rejects a cross-origin request with 403', async () => {
    const res = await createAIToolHandler(baseConfig())(
      post({ input: VALID_INPUT }, { origin: 'https://evil.example' })
    );

    expect(res.status).toBe(403);
    expect(await errorOf(res)).toBe('Forbidden');
  });

  it('allows a request from the production origin', async () => {
    const config = baseConfig({ getMockResponse: () => 'mocked' });
    const res = await createAIToolHandler(config)(
      post({ input: VALID_INPUT }, { origin: 'https://fyrk.no' })
    );

    expect(res.status).toBe(200);
  });

  it('rejects a malformed JSON body with 400', async () => {
    const res = await createAIToolHandler(baseConfig())(post('not json'));

    expect(res.status).toBe(400);
    expect(await errorOf(res)).toBe('Invalid request body');
  });

  it('rejects a body whose input is not a string with 400', async () => {
    const res = await createAIToolHandler(baseConfig())(post({ input: 42 }));

    expect(res.status).toBe(400);
    expect(await errorOf(res)).toBe('Invalid request body format');
  });

  it('rejects a body whose stream flag is not a boolean with 400', async () => {
    const res = await createAIToolHandler(baseConfig())(
      post({ input: VALID_INPUT, stream: 'yes' })
    );

    expect(res.status).toBe(400);
    expect(await errorOf(res)).toBe('Invalid request body format');
  });

  it('treats an unknown key as a missing input rather than a shape error', async () => {
    // isValidRequestBody only constrains input and stream, so a body without
    // input reaches the missing-input check.
    const res = await createAIToolHandler(baseConfig())(post({ notInput: 'x' }));

    expect(res.status).toBe(400);
    expect(await errorOf(res)).toBe('Mangler input');
  });

  it('reports missing input with the tool-specific message', async () => {
    const config = baseConfig({ missingInputMessage: 'Skriv inn OKR-ene dine' });
    const res = await createAIToolHandler(config)(post({ input: '   ' }));

    expect(res.status).toBe(400);
    expect(await errorOf(res)).toBe('Skriv inn OKR-ene dine');
  });

  it('rejects input below the minimum length', async () => {
    const res = await createAIToolHandler(baseConfig())(post({ input: 'too short' }));

    expect(res.status).toBe(400);
    expect(await errorOf(res)).toMatch(/minst \d+ tegn/);
  });

  it('rejects input above the tool-specific maximum length', async () => {
    const config = baseConfig({ maxInputLength: 100 });
    const res = await createAIToolHandler(config)(post({ input: 'x'.repeat(101) }));

    expect(res.status).toBe(400);
    expect(await errorOf(res)).toMatch(/ikke være lengre enn 100 tegn/);
  });

  it('measures length after trimming, so padding does not cause a false rejection', async () => {
    const config = baseConfig({ maxInputLength: 100, getMockResponse: () => 'mocked' });
    const res = await createAIToolHandler(config)(post({ input: `   ${'x'.repeat(100)}   ` }));

    expect(res.status).toBe(200);
  });

  it('carries a request id on error responses so a report can be traced', async () => {
    const res = await createAIToolHandler(baseConfig())(post({ input: 'too short' }));

    expect(res.headers.get('X-Request-ID')).toMatch(/^[0-9a-f-]{36}$/i);
  });
});

describe('createAIToolHandler — mock mode', () => {
  it('returns the mocked payload without calling the API', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const config = baseConfig({ getMockResponse: () => 'mocked analysis' });

    const res = await createAIToolHandler(config)(post({ input: VALID_INPUT }));

    expect(res.status).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('receives the trimmed input', async () => {
    const getMockResponse = vi.fn(() => 'mocked');
    const config = baseConfig({ getMockResponse });

    await createAIToolHandler(config)(post({ input: `  ${VALID_INPUT}  ` }));

    expect(getMockResponse).toHaveBeenCalledWith(VALID_INPUT);
  });

  it('falls through to the normal path when the mock returns null', async () => {
    const getMockResponse = vi.fn(() => null);
    const config = baseConfig({ getMockResponse });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'no key' } }), { status: 401 })
    );

    const res = await createAIToolHandler(config)(post({ input: VALID_INPUT }));

    expect(getMockResponse).toHaveBeenCalled();
    expect(res.status).not.toBe(200);
  });
});
