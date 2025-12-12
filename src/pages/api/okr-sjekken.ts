import type { APIRoute } from 'astro';

export const prerender = false;

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

// Anthropic API response types
interface AnthropicTextBlock {
  type: 'text';
  text: string;
}

interface AnthropicResponse {
  content: AnthropicTextBlock[];
}

interface AnthropicStreamDelta {
  type: 'content_block_delta';
  delta: {
    type: 'text_delta';
    text: string;
  };
}

interface AnthropicStreamEvent {
  type: string;
  delta?: {
    type: string;
    text?: string;
  };
}

interface AnthropicErrorResponse {
  error?: {
    message?: string;
  };
}

// Cache configuration
interface CacheEntry {
  output: string;
  timestamp: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute

// In-memory cache and rate limiter (persists across requests in the same Worker instance)
const cache = new Map<string, CacheEntry>();
const rateLimits = new Map<string, RateLimitEntry>();

// Simple hash function for cache keys
async function hashInput(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Clean up expired cache entries
function cleanCache(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      cache.delete(key);
    }
  }
}

// Check and update rate limit
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimits.get(ip);

  if (!limit || now > limit.resetTime) {
    // Create new rate limit window
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

// Get client IP from request
function getClientIP(request: Request): string {
  // Try Cloudflare headers first
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) return cfConnectingIP;

  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim();

  const xRealIP = request.headers.get('x-real-ip');
  if (xRealIP) return xRealIP;

  return 'unknown';
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { input, stream = false } = await request.json();

    if (!input?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Missing input' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting
    const clientIP = getClientIP(request);
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          details: 'Please wait a moment before trying again'
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60'
          }
        }
      );
    }

    // Check cache
    cleanCache(); // Clean up expired entries
    const cacheKey = await hashInput(input);
    const cachedEntry = cache.get(cacheKey);

    if (cachedEntry) {
      console.log('Cache hit for input hash:', cacheKey.substring(0, 8));
      return new Response(
        JSON.stringify({
          output: cachedEntry.output,
          cached: true
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'HIT'
          }
        }
      );
    }

    // Access environment variables from Cloudflare runtime
    const cloudflareEnv = (locals as App.Locals).runtime?.env;
    const apiKey = cloudflareEnv?.ANTHROPIC_API_KEY || import.meta.env.ANTHROPIC_API_KEY;
    const model = cloudflareEnv?.ANTHROPIC_MODEL || import.meta.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';

    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Server not configured: Missing API key' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Handle streaming response
    if (stream) {
      const encoder = new TextEncoder();
      let fullOutput = '';

      const customReadable = new ReadableStream({
        async start(controller) {
          try {
            const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
              },
              body: JSON.stringify({
                model,
                max_tokens: 1500,
                system: SYSTEM_PROMPT,
                stream: true,
                messages: [
                  {
                    role: 'user',
                    content: `Vurder følgende OKR-sett:\n\n${input.trim()}`,
                  },
                ],
              }),
            });

            if (!anthropicResponse.ok) {
              const errorData = await anthropicResponse.json() as AnthropicErrorResponse;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                error: true,
                message: errorData?.error?.message || 'API error'
              })}\n\n`));
              controller.close();
              return;
            }

            const reader = anthropicResponse.body?.getReader();
            if (!reader) {
              controller.close();
              return;
            }

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') continue;

                  try {
                    const event = JSON.parse(data) as AnthropicStreamEvent;
                    if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
                      const text = event.delta.text || '';
                      fullOutput += text;
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                    }
                  } catch (e) {
                    console.error('Error parsing SSE data:', e);
                  }
                }
              }
            }

            // Cache the complete output
            cache.set(cacheKey, {
              output: fullOutput,
              timestamp: Date.now(),
            });

            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            console.error('Streaming error:', error);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              error: true,
              message: 'Streaming failed'
            })}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(customReadable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Cache': 'MISS',
        },
      });
    }

    // Non-streaming response
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Vurder følgende OKR-sett:\n\n${input.trim()}`,
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorData = await anthropicResponse.json() as AnthropicErrorResponse;
      console.error('Anthropic API error:', anthropicResponse.status, errorData);
      return new Response(
        JSON.stringify({
          error: 'Failed to evaluate OKR',
          details: errorData?.error?.message || `API returned ${anthropicResponse.status}`,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await anthropicResponse.json() as AnthropicResponse;
    const output = data.content[0]?.type === 'text' ? data.content[0].text : '';

    // Cache the result
    cache.set(cacheKey, {
      output,
      timestamp: Date.now(),
    });

    return new Response(
      JSON.stringify({ output, cached: false }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'MISS'
        }
      }
    );

  } catch (err) {
    console.error('OKR review error:', err);

    if (err instanceof Error) {
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
    }

    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        error: 'Failed to evaluate OKR',
        details: errorMessage
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
