/**
 * AI Tool API Handler Factory
 *
 * Consolidates the common request/response flow for AI-powered tools:
 * - Input validation (Content-Type, length)
 * - Rate limiting with logging
 * - Circuit breaker protection
 * - Caching (read and write)
 * - Streaming and non-streaming responses
 * - Error handling
 *
 * Used by: okr-sjekken, konseptspeilet, antakelseskart
 */

import type { APIContext } from 'astro';
import type { AnthropicResponse, AnthropicErrorResponse } from '../types';
import { hashInput, createServerCacheManager, createRateLimiter } from '../utils/cache';
import { ERROR_MESSAGES, ANTHROPIC_CONFIG, HTTP_HEADERS, INPUT_VALIDATION } from '../utils/constants';
import {
  createAnthropicHeaders,
  getClientIP,
  fetchWithRetry,
  resolveAnthropicConfig,
  createCircuitBreaker,
} from './anthropic-client';
import { logRateLimitHit } from '../utils/rate-limit-logger';
import {
  createAnthropicStreamingResponse,
  createCachedStreamingResponse,
  createJsonResponse,
  createErrorResponse,
} from './streaming-response';

/**
 * Tool name type for rate limit logging
 */
export type ToolName = 'okr' | 'konseptspeil' | 'antakelseskart' | 'pre-mortem';

/**
 * Configuration for an AI tool handler
 */
export interface AIToolConfig {
  /** Tool identifier for logging and cache keys */
  toolName: ToolName;
  /** Cache key prefix (e.g., 'konseptspeil:v2') */
  cacheKeyPrefix: string;
  /** System prompt for the AI model */
  systemPrompt: string;
  /** Transform user input into the message sent to the AI */
  createUserMessage: (input: string) => string;
  /** Validate AI output format. Return false to reject response. */
  validateOutput: (output: string) => boolean;
  /** Error message when AI call fails */
  errorMessage: string;
  /** Error message when input is missing */
  missingInputMessage: string;
  /** Whether to use circuit breaker (default: true) */
  useCircuitBreaker?: boolean;
  /** Custom streaming timeout in ms (default: ANTHROPIC_CONFIG.REQUEST_TIMEOUT_MS) */
  streamingTimeoutMs?: number;
  /** Custom max input length (default: INPUT_VALIDATION.MAX_LENGTH) */
  maxInputLength?: number;
  /** Mock mode getter (optional, for testing) */
  getMockResponse?: (input: string) => string | null;
}

/**
 * State shared across requests for a tool instance
 */
interface ToolState {
  cacheManager: ReturnType<typeof createServerCacheManager>;
  rateLimiter: ReturnType<typeof createRateLimiter>;
  circuitBreaker: ReturnType<typeof createCircuitBreaker>;
  lastCleanupTime: number;
}

/**
 * Creates a POST handler for an AI-powered tool
 */
export function createAIToolHandler(config: AIToolConfig) {
  const {
    toolName,
    cacheKeyPrefix,
    systemPrompt,
    createUserMessage,
    validateOutput,
    errorMessage,
    missingInputMessage,
    useCircuitBreaker = true,
    streamingTimeoutMs,
    maxInputLength = INPUT_VALIDATION.MAX_LENGTH,
    getMockResponse,
  } = config;

  // Create shared state (persists across requests in same Worker isolate)
  const state: ToolState = {
    cacheManager: createServerCacheManager(),
    rateLimiter: createRateLimiter(),
    circuitBreaker: createCircuitBreaker(),
    lastCleanupTime: Date.now(),
  };

  return async function handler({ request, locals }: APIContext): Promise<Response> {
    try {
      // Validate Content-Type
      const contentType = request.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        return createErrorResponse('Invalid Content-Type. Expected application/json', 415);
      }

      // Parse request body
      const { input, stream = false } = (await request.json()) as {
        input?: string;
        stream?: boolean;
      };

      // Validate input presence
      if (!input?.trim()) {
        return createErrorResponse(missingInputMessage, 400);
      }

      const trimmedInput = input.trim();

      // Validate input length
      if (trimmedInput.length < INPUT_VALIDATION.MIN_LENGTH) {
        return createErrorResponse(
          `Input må være minst ${INPUT_VALIDATION.MIN_LENGTH} tegn`,
          400
        );
      }

      if (trimmedInput.length > maxInputLength) {
        return createErrorResponse(
          `Input kan ikke være lengre enn ${maxInputLength} tegn`,
          400
        );
      }

      const cloudflareEnv = (locals as App.Locals).runtime?.env;

      // Rate limiting
      const clientIP = getClientIP(request);
      if (!state.rateLimiter.checkAndUpdate(clientIP)) {
        logRateLimitHit(cloudflareEnv?.ANALYTICS_KV, toolName).catch(() => {});
        return createRateLimitResponse();
      }

      // Circuit breaker check
      if (useCircuitBreaker && !state.circuitBreaker.check()) {
        return createCircuitBreakerResponse();
      }

      // Mock mode (for local testing)
      if (getMockResponse) {
        const mockOutput = getMockResponse(trimmedInput);
        if (mockOutput) {
          if (stream) {
            return createCachedStreamingResponse(mockOutput);
          }
          return createJsonResponse({ output: mockOutput, cached: false, mock: true });
        }
      }

      // Probabilistic cache cleanup (every ~5 minutes or 1% of requests)
      const now = Date.now();
      if (now - state.lastCleanupTime > 300000 || Math.random() < 0.01) {
        state.lastCleanupTime = now;
        Promise.resolve().then(() => state.cacheManager.cleanup());
      }

      // Check cache
      const cacheKey = await hashInput(`${cacheKeyPrefix}:${trimmedInput}`);
      const cachedEntry = state.cacheManager.get(cacheKey);

      if (cachedEntry) {
        if (stream) {
          return createCachedStreamingResponse(cachedEntry.output);
        }
        return createJsonResponse(
          { output: cachedEntry.output, cached: true },
          { cacheStatus: 'HIT' }
        );
      }

      // Resolve API configuration
      const { apiKey, model } = resolveAnthropicConfig(locals as App.Locals);

      if (!apiKey) {
        console.error('ANTHROPIC_API_KEY not configured');
        return createErrorResponse(ERROR_MESSAGES.SERVER_NOT_CONFIGURED, 500);
      }

      const userMessage = createUserMessage(trimmedInput);

      // Handle streaming response
      if (stream) {
        return createAnthropicStreamingResponse({
          apiKey,
          model,
          systemPrompt,
          userMessage,
          timeoutMs: streamingTimeoutMs,
          validateOutput,
          onCache: (output) => state.cacheManager.set(cacheKey, output),
          onSuccess: useCircuitBreaker ? () => state.circuitBreaker.recordSuccess() : undefined,
          onFailure: useCircuitBreaker ? () => state.circuitBreaker.recordFailure() : undefined,
        });
      }

      // Non-streaming response with retry logic
      let anthropicResponse: Response;
      try {
        anthropicResponse = await fetchWithRetry(
          ANTHROPIC_CONFIG.API_URL,
          {
            method: 'POST',
            headers: createAnthropicHeaders(apiKey),
            body: JSON.stringify({
              model,
              max_tokens: ANTHROPIC_CONFIG.MAX_TOKENS,
              system: systemPrompt,
              stream: false,
              messages: [{ role: 'user', content: userMessage }],
            }),
          },
          ANTHROPIC_CONFIG.REQUEST_TIMEOUT_MS
        );
      } catch (error) {
        if (useCircuitBreaker) {
          state.circuitBreaker.recordFailure();
        }
        if (error instanceof Error && error.name === 'AbortError') {
          return createErrorResponse('Forespørselen tok for lang tid', 504, 'Prøv igjen om litt');
        }
        throw error;
      }

      if (!anthropicResponse.ok) {
        if (useCircuitBreaker) {
          state.circuitBreaker.recordFailure();
        }
        const errorData = (await anthropicResponse.json()) as AnthropicErrorResponse;
        console.error('Anthropic API error:', anthropicResponse.status, errorData);
        return createErrorResponse(
          errorMessage,
          500,
          errorData?.error?.message || `API returned ${anthropicResponse.status}`
        );
      }

      if (useCircuitBreaker) {
        state.circuitBreaker.recordSuccess();
      }

      const data = (await anthropicResponse.json()) as AnthropicResponse;
      const output = data.content[0]?.type === 'text' ? data.content[0].text : '';

      // Validate output format
      if (!validateOutput(output)) {
        console.warn(`${toolName}: Output format validation failed - possible prompt injection`);
        return createErrorResponse(
          errorMessage,
          422,
          'Vennligst prøv igjen med en annen beskrivelse'
        );
      }

      // Cache valid output
      state.cacheManager.set(cacheKey, output);

      return createJsonResponse({ output, cached: false }, { cacheStatus: 'MISS' });
    } catch (err) {
      const isDev = import.meta.env.DEV;
      console.error(`${toolName} error:`, err instanceof Error ? err.message : err);

      if (isDev && err instanceof Error) {
        console.error('Error stack:', err.stack);
      }

      const errorDetails = err instanceof Error ? err.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      return createErrorResponse(errorMessage, 500, errorDetails);
    }
  };
}

/**
 * Create rate limit response
 */
function createRateLimitResponse(): Response {
  return new Response(
    JSON.stringify({
      error: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
      details: 'Vent litt før du prøver igjen',
    }),
    {
      status: 429,
      headers: {
        'Content-Type': HTTP_HEADERS.CONTENT_TYPE_JSON,
        'Retry-After': '60',
      },
    }
  );
}

/**
 * Create circuit breaker response
 */
function createCircuitBreakerResponse(): Response {
  return new Response(
    JSON.stringify({
      error: 'Service temporarily unavailable',
      details: 'Please try again in a few moments',
    }),
    {
      status: 503,
      headers: {
        'Content-Type': HTTP_HEADERS.CONTENT_TYPE_JSON,
        'Retry-After': '30',
      },
    }
  );
}
