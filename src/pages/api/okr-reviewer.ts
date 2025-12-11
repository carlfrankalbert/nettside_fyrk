import type { APIRoute } from 'astro';
import { hashInput } from '../../utils/crypto';
import { API_ERRORS } from '../../utils/messages';
import { createSSEBuffer, processSSEChunk, parseAnthropicStreamEvent } from '../../utils/sse';

export const prerender = false;

// ============================================================================
// Constants
// ============================================================================

const SYSTEM_PROMPT = `Du er OKR Reviewer for FYRK – en rolig, strukturert og svært kompetent produktleder.
Oppgaven din er å evaluere OKR-er med klarhet, presisjon og en jordnær skandinavisk tone.

Svar ALLTID på norsk (bokmål).

Følg disse reglene:

1. Returner output i nøyaktig fire seksjoner:
   1) Samlet vurdering (inkluder score 1-10)
   2) Hva fungerer bra
   3) Hva bør forbedres
   4) Forslag til forbedret OKR-sett

2. Vær kortfattet. Ingen lange avsnitt. Ingen buzzwords.

3. Vær ærlig, men konstruktiv. Unngå hype. Vær spesifikk om hva som er uklart eller svakt.

4. Score OKR-settet fra 1–10 basert på:
   - Er Objective resultatorientert og retningsgivende (ikke en aktivitet)?
   - Er Key Results målbare med konkrete tall?
   - Er de faktiske resultater (ikke aktiviteter eller oppgaver)?
   - Er det en tydelig tråd fra Objective til KR-er?

5. I "Hva fungerer bra" og "Hva bør forbedres":
   - Maks 3 kulepunkter hver
   - Hvert punkt = maks én setning

6. I det omskrevne OKR-settet:
   - Behold ÉN forbedret Objective
   - Inkluder 2–3 Key Results
   - Hver KR må være målbar med en numerisk terskel
   - Ingen aktiviteter forkledd som resultater`;

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929';

// ============================================================================
// Types
// ============================================================================

interface AnthropicTextBlock {
  type: 'text';
  text: string;
}

interface AnthropicResponse {
  content: AnthropicTextBlock[];
}

interface AnthropicErrorResponse {
  error?: {
    message?: string;
  };
}

interface CacheEntry {
  output: string;
  timestamp: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface ApiConfig {
  apiKey: string;
  model: string;
}

// ============================================================================
// In-memory storage (persists across requests in the same Worker instance)
// ============================================================================

const cache = new Map<string, CacheEntry>();
const rateLimits = new Map<string, RateLimitEntry>();

// ============================================================================
// Cache Management
// ============================================================================

function cleanExpiredCacheEntries(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      cache.delete(key);
    }
  }
}

function getCachedEntry(cacheKey: string): CacheEntry | undefined {
  return cache.get(cacheKey);
}

function setCacheEntry(cacheKey: string, output: string): void {
  cache.set(cacheKey, {
    output,
    timestamp: Date.now(),
  });
}

// ============================================================================
// Rate Limiting
// ============================================================================

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimits.get(ip);

  if (!limit || now > limit.resetTime) {
    rateLimits.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return true;
  }

  if (limit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  limit.count++;
  return true;
}

function getClientIP(request: Request): string {
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) return cfConnectingIP;

  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim();

  const xRealIP = request.headers.get('x-real-ip');
  if (xRealIP) return xRealIP;

  return 'unknown';
}

// ============================================================================
// Response Helpers
// ============================================================================

function jsonResponse(data: object, status: number, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

function errorResponse(error: string, status: number, details?: string, headers?: Record<string, string>): Response {
  return jsonResponse({ error, ...(details && { details }) }, status, headers);
}

// ============================================================================
// Anthropic API
// ============================================================================

function buildAnthropicRequest(input: string, config: ApiConfig, stream: boolean): RequestInit {
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      stream,
      messages: [
        {
          role: 'user',
          content: `Vurder følgende OKR-sett:\n\n${input.trim()}`,
        },
      ],
    }),
  };
}

async function callAnthropicAPI(input: string, config: ApiConfig, stream: boolean): Promise<globalThis.Response> {
  return fetch(ANTHROPIC_API_URL, buildAnthropicRequest(input, config, stream));
}

function extractTextFromResponse(data: AnthropicResponse): string {
  return data.content[0]?.type === 'text' ? data.content[0].text : '';
}

// ============================================================================
// Streaming Response Handler
// ============================================================================

function createStreamingResponse(input: string, config: ApiConfig, cacheKey: string): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let fullOutput = '';

      try {
        const anthropicResponse = await callAnthropicAPI(input, config, true);

        if (!anthropicResponse.ok) {
          const errorData = (await anthropicResponse.json()) as AnthropicErrorResponse;
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error: true,
                message: errorData?.error?.message || API_ERRORS.API_ERROR,
              })}\n\n`
            )
          );
          controller.close();
          return;
        }

        const reader = anthropicResponse.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const sseBuffer = createSSEBuffer();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const dataLines = processSSEChunk(sseBuffer, value);

          for (const dataLine of dataLines) {
            const text = parseAnthropicStreamEvent(dataLine);
            if (text !== null) {
              fullOutput += text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }
        }

        setCacheEntry(cacheKey, fullOutput);
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              error: true,
              message: 'Streaming failed',
            })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Cache': 'MISS',
    },
  });
}

// ============================================================================
// Non-Streaming Response Handler
// ============================================================================

async function handleNonStreamingRequest(
  input: string,
  config: ApiConfig,
  cacheKey: string
): Promise<Response> {
  const anthropicResponse = await callAnthropicAPI(input, config, false);

  if (!anthropicResponse.ok) {
    const errorData = (await anthropicResponse.json()) as AnthropicErrorResponse;
    return errorResponse(
      API_ERRORS.EVALUATION_FAILED,
      500,
      errorData?.error?.message || `API returned ${anthropicResponse.status}`
    );
  }

  const data = (await anthropicResponse.json()) as AnthropicResponse;
  const output = extractTextFromResponse(data);

  setCacheEntry(cacheKey, output);

  return jsonResponse(
    { output, cached: false },
    200,
    { 'X-Cache': 'MISS' }
  );
}

// ============================================================================
// Environment Configuration
// ============================================================================

function getApiConfig(locals: App.Locals): ApiConfig | null {
  const cloudflareEnv = locals.runtime?.env;
  const apiKey = cloudflareEnv?.ANTHROPIC_API_KEY || import.meta.env.ANTHROPIC_API_KEY;
  const model = cloudflareEnv?.ANTHROPIC_MODEL || import.meta.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    return null;
  }

  return { apiKey, model };
}

// ============================================================================
// Main API Route Handler
// ============================================================================

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { input, stream = false } = await request.json();

    // Validate input
    if (!input?.trim()) {
      return errorResponse(API_ERRORS.MISSING_INPUT, 400);
    }

    // Check rate limit
    const clientIP = getClientIP(request);
    if (!checkRateLimit(clientIP)) {
      return errorResponse(API_ERRORS.RATE_LIMIT, 429, API_ERRORS.RETRY_AFTER, {
        'Retry-After': '60',
      });
    }

    // Clean and check cache
    cleanExpiredCacheEntries();
    const cacheKey = await hashInput(input);
    const cachedEntry = getCachedEntry(cacheKey);

    if (cachedEntry) {
      return jsonResponse(
        { output: cachedEntry.output, cached: true },
        200,
        { 'X-Cache': 'HIT' }
      );
    }

    // Get API configuration
    const config = getApiConfig(locals as App.Locals);
    if (!config) {
      return errorResponse(API_ERRORS.API_KEY_MISSING, 500);
    }

    // Handle request
    if (stream) {
      return createStreamingResponse(input, config, cacheKey);
    }

    return handleNonStreamingRequest(input, config, cacheKey);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse(API_ERRORS.EVALUATION_FAILED, 500, errorMessage);
  }
};
