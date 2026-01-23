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
import type { AnthropicErrorResponse } from '../types';
import { isValidAnthropicResponse, extractAnthropicText } from '../types';
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
import { createKVCacheManager, createKVRateLimiter, createKVDailyBudget, createKVCircuitBreaker } from './kv-cache';
import { createSLOMonitor } from './slo-monitoring';
import { generateRequestId } from './request-utils';
import { createContextLogger } from './structured-logger';

/**
 * Tool name type for rate limit logging
 */
export type ToolName = 'okr' | 'konseptspeil' | 'antakelseskart' | 'pre-mortem';

/**
 * Expected request body shape
 */
interface AIToolRequestBody {
  input?: string;
  stream?: boolean;
}

/**
 * Type guard to validate request body structure
 */
function isValidRequestBody(body: unknown): body is AIToolRequestBody {
  if (typeof body !== 'object' || body === null) {
    return false;
  }
  const obj = body as Record<string, unknown>;
  // input must be undefined or string
  if (obj.input !== undefined && typeof obj.input !== 'string') {
    return false;
  }
  // stream must be undefined or boolean
  if (obj.stream !== undefined && typeof obj.stream !== 'boolean') {
    return false;
  }
  return true;
}

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
  sloMonitor: ReturnType<typeof createSLOMonitor>;
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

  // Extract version from cache key prefix (e.g., 'okr:v1' -> 'v1')
  const versionMatch = cacheKeyPrefix.match(/:v(\d+)$/);
  const toolVersion = versionMatch ? `v${versionMatch[1]}` : undefined;

  // Create shared state (persists across requests in same Worker isolate)
  // KV-backed cache and rate limiter are initialized lazily per-request
  // since we need access to the Cloudflare env
  const state: ToolState = {
    cacheManager: createServerCacheManager(),
    rateLimiter: createRateLimiter(),
    circuitBreaker: createCircuitBreaker(),
    sloMonitor: createSLOMonitor(toolName, undefined, toolVersion),
    lastCleanupTime: Date.now(),
  };

  // Track if KV resources have been initialized for this Worker isolate
  // Using a flag to prevent race condition during initialization
  let kvInitialized = false;
  let kvCacheManager: ReturnType<typeof createKVCacheManager> | null = null;
  let kvRateLimiter: ReturnType<typeof createKVRateLimiter> | null = null;
  let kvDailyBudget: ReturnType<typeof createKVDailyBudget> | null = null;
  let kvCircuitBreaker: ReturnType<typeof createKVCircuitBreaker> | null = null;

  return async function handler({ request, locals }: APIContext): Promise<Response> {
    const requestStartTime = Date.now();
    const requestId = generateRequestId();
    const log = createContextLogger({ requestId, tool: toolName });

    try {
      // Validate Content-Type
      const contentType = request.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        return createErrorResponse('Invalid Content-Type. Expected application/json', 415, undefined, requestId);
      }

      // Parse and validate request body
      const body: unknown = await request.json();
      if (!isValidRequestBody(body)) {
        return createErrorResponse('Invalid request body format', 400, undefined, requestId);
      }
      const { input, stream = false } = body;

      // Validate input presence
      if (!input?.trim()) {
        return createErrorResponse(missingInputMessage, 400, undefined, requestId);
      }

      const trimmedInput = input.trim();

      // Validate input length
      if (trimmedInput.length < INPUT_VALIDATION.MIN_LENGTH) {
        return createErrorResponse(
          `Input må være minst ${INPUT_VALIDATION.MIN_LENGTH} tegn`,
          400,
          undefined,
          requestId
        );
      }

      if (trimmedInput.length > maxInputLength) {
        return createErrorResponse(
          `Input kan ikke være lengre enn ${maxInputLength} tegn`,
          400,
          undefined,
          requestId
        );
      }

      const cloudflareEnv = (locals as App.Locals).runtime?.env;
      const analyticsKV = cloudflareEnv?.ANALYTICS_KV;

      // Initialize KV-backed resources lazily (once per Worker isolate)
      // Use flag to prevent race condition from concurrent requests
      if (analyticsKV && !kvInitialized) {
        kvInitialized = true; // Set flag first to prevent re-initialization
        kvCacheManager = createKVCacheManager(analyticsKV, state.cacheManager);
        kvRateLimiter = createKVRateLimiter(analyticsKV, state.rateLimiter);
        kvDailyBudget = createKVDailyBudget(analyticsKV);
        kvCircuitBreaker = createKVCircuitBreaker(analyticsKV, toolName, state.circuitBreaker);
        // Update SLO monitor with KV reference and version
        state.sloMonitor = createSLOMonitor(toolName, analyticsKV, toolVersion);
      }

      // Rate limiting (use KV-backed if available for distributed limiting)
      const clientIP = getClientIP(request);
      const rateLimitAllowed = kvRateLimiter
        ? await kvRateLimiter.checkAndUpdate(clientIP)
        : state.rateLimiter.checkAndUpdate(clientIP);

      if (!rateLimitAllowed) {
        state.sloMonitor.recordRateLimit();
        log.warn('Rate limit exceeded', { action: 'rate_limit' });
        logRateLimitHit(analyticsKV, toolName).catch(() => {/* ignore */});
        return createRateLimitResponse(requestId);
      }

      // Circuit breaker check (use KV-backed if available, both are synchronous)
      const circuitBreakerAllowed = kvCircuitBreaker
        ? kvCircuitBreaker.check()
        : useCircuitBreaker ? state.circuitBreaker.check() : true;

      if (!circuitBreakerAllowed) {
        log.warn('Circuit breaker open', { action: 'circuit_breaker' });
        return createCircuitBreakerResponse(requestId);
      }

      // Mock mode (for local testing)
      if (getMockResponse) {
        const mockOutput = getMockResponse(trimmedInput);
        if (mockOutput) {
          log.debug('Returning mock response', { action: 'mock' });
          if (stream) {
            return createCachedStreamingResponse(mockOutput, { requestId });
          }
          return createJsonResponse({ output: mockOutput, cached: false, mock: true }, { requestId });
        }
      }

      // Probabilistic cache cleanup (every ~5 minutes or 1% of requests)
      const now = Date.now();
      if (now - state.lastCleanupTime > 300000 || Math.random() < 0.01) {
        state.lastCleanupTime = now;
        Promise.resolve()
          .then(() => state.cacheManager.cleanup())
          .catch((err) => {
            // Log in dev, silently ignore in production (non-critical cleanup)
            if (import.meta.env.DEV) {
              console.warn('[ai-tool-handler] Cache cleanup failed:', err);
            }
          });
      }

      // Check cache (KV-backed if available for distributed caching)
      const cacheKey = await hashInput(`${cacheKeyPrefix}:${trimmedInput}`);
      const cachedEntry = kvCacheManager
        ? await kvCacheManager.get(cacheKey)
        : state.cacheManager.get(cacheKey);

      if (cachedEntry) {
        const latencyMs = Date.now() - requestStartTime;
        state.sloMonitor.recordRequest({ statusCode: 200, latencyMs, cached: true });
        log.info('Cache hit', { action: 'cache_hit', durationMs: latencyMs, cached: true });

        if (stream) {
          return createCachedStreamingResponse(cachedEntry.output, { requestId });
        }
        return createJsonResponse(
          { output: cachedEntry.output, cached: true },
          { cacheStatus: 'HIT', requestId }
        );
      }

      // Daily budget check (per-IP cost control)
      // Placed after cache check so cached responses don't consume budget
      if (kvDailyBudget) {
        const withinBudget = await kvDailyBudget.checkAndIncrement(clientIP);
        if (!withinBudget) {
          log.warn('Daily budget exceeded', { action: 'budget_exceeded' });
          return createDailyBudgetResponse(requestId);
        }
      }

      // Resolve API configuration
      const { apiKey, model } = resolveAnthropicConfig(locals as App.Locals);

      if (!apiKey) {
        log.error('API key not configured', { action: 'config_error' });
        return createErrorResponse(ERROR_MESSAGES.SERVER_NOT_CONFIGURED, 500, undefined, requestId);
      }

      const userMessage = createUserMessage(trimmedInput);

      // Handle streaming response
      if (stream) {
        const streamingPromise = Promise.resolve(createAnthropicStreamingResponse({
          apiKey,
          model,
          systemPrompt,
          userMessage,
          timeoutMs: streamingTimeoutMs,
          requestId,
          validateOutput,
          onCache: (output) => {
            // Use KV cache if available, falls back to in-memory
            if (kvCacheManager) {
              kvCacheManager.set(cacheKey, output).catch(() => {/* ignore */});
            } else {
              state.cacheManager.set(cacheKey, output);
            }
          },
          onSuccess: () => {
            const latencyMs = Date.now() - requestStartTime;
            state.sloMonitor.recordRequest({ statusCode: 200, latencyMs, cached: false });
            log.info('Streaming success', { action: 'stream_success', durationMs: latencyMs });
            // Record success (prefer KV-backed if available, both are synchronous)
            if (kvCircuitBreaker) {
              kvCircuitBreaker.recordSuccess();
            } else if (useCircuitBreaker) {
              state.circuitBreaker.recordSuccess();
            }
          },
          onFailure: () => {
            const latencyMs = Date.now() - requestStartTime;
            state.sloMonitor.recordError(500, latencyMs);
            log.error('Streaming failed', { action: 'stream_failure', durationMs: latencyMs });
            // Record failure (prefer KV-backed if available, both are synchronous)
            if (kvCircuitBreaker) {
              kvCircuitBreaker.recordFailure();
            } else if (useCircuitBreaker) {
              state.circuitBreaker.recordFailure();
            }
          },
        }));

        return streamingPromise;
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
          ANTHROPIC_CONFIG.REQUEST_TIMEOUT_MS,
          { requestId }
        );
      } catch (error) {
        // Record failure (prefer KV-backed if available, both are synchronous)
        if (kvCircuitBreaker) {
          kvCircuitBreaker.recordFailure();
        } else if (useCircuitBreaker) {
          state.circuitBreaker.recordFailure();
        }
        const latencyMs = Date.now() - requestStartTime;
        state.sloMonitor.recordError(504, latencyMs);
        if (error instanceof Error && error.name === 'AbortError') {
          log.warn('Request timeout', { action: 'timeout', durationMs: latencyMs, statusCode: 504 });
          return createErrorResponse('Forespørselen tok for lang tid', 504, 'Prøv igjen om litt', requestId);
        }
        throw error;
      }

      if (!anthropicResponse.ok) {
        // Record failure (prefer KV-backed if available, both are synchronous)
        if (kvCircuitBreaker) {
          kvCircuitBreaker.recordFailure();
        } else if (useCircuitBreaker) {
          state.circuitBreaker.recordFailure();
        }
        const latencyMs = Date.now() - requestStartTime;
        state.sloMonitor.recordError(anthropicResponse.status, latencyMs);
        const errorData = (await anthropicResponse.json()) as AnthropicErrorResponse;
        log.error('Anthropic API error', { action: 'api_error', statusCode: anthropicResponse.status, durationMs: latencyMs });
        return createErrorResponse(
          errorMessage,
          500,
          errorData?.error?.message || `API returned ${anthropicResponse.status}`,
          requestId
        );
      }

      // Record success (prefer KV-backed if available, both are synchronous)
      if (kvCircuitBreaker) {
        kvCircuitBreaker.recordSuccess();
      } else if (useCircuitBreaker) {
        state.circuitBreaker.recordSuccess();
      }

      // Parse and validate response schema
      const data: unknown = await anthropicResponse.json();
      if (!isValidAnthropicResponse(data)) {
        log.warn('Invalid Anthropic response schema', { action: 'schema_invalid', statusCode: 502 });
        const latencyMs = Date.now() - requestStartTime;
        state.sloMonitor.recordError(502, latencyMs);
        return createErrorResponse(
          errorMessage,
          502,
          'Ugyldig svar fra AI-tjenesten',
          requestId
        );
      }
      const output = extractAnthropicText(data);

      // Validate output format
      if (!validateOutput(output)) {
                log.warn('Output validation failed', { action: 'validation_failed', statusCode: 422 });
        const latencyMs = Date.now() - requestStartTime;
        state.sloMonitor.recordError(422, latencyMs);
        return createErrorResponse(
          errorMessage,
          422,
          'Vennligst prøv igjen med en annen beskrivelse',
          requestId
        );
      }

      
      // Cache valid output (KV-backed if available)
      if (kvCacheManager) {
        kvCacheManager.set(cacheKey, output).catch(() => {/* ignore */});
      } else {
        state.cacheManager.set(cacheKey, output);
      }

      const latencyMs = Date.now() - requestStartTime;
      state.sloMonitor.recordRequest({ statusCode: 200, latencyMs, cached: false });
      log.info('Request completed', { action: 'success', durationMs: latencyMs, statusCode: 200, cached: false });

      return createJsonResponse({ output, cached: false }, { cacheStatus: 'MISS', requestId });
    } catch (err) {
      const latencyMs = Date.now() - requestStartTime;
      state.sloMonitor.recordError(500, latencyMs);

      log.error('Unhandled error', {
        action: 'unhandled_error',
        durationMs: latencyMs,
        statusCode: 500,
      });

      const errorDetails = err instanceof Error ? err.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      return createErrorResponse(errorMessage, 500, errorDetails, requestId);
    }
  };
}

/**
 * Create rate limit response
 */
function createRateLimitResponse(requestId?: string): Response {
  const headers: Record<string, string> = {
    'Content-Type': HTTP_HEADERS.CONTENT_TYPE_JSON,
    'Retry-After': '60',
  };
  if (requestId) {
    headers['X-Request-ID'] = requestId;
  }
  return new Response(
    JSON.stringify({
      error: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
      details: 'Vent litt før du prøver igjen',
    }),
    { status: 429, headers }
  );
}

/**
 * Create circuit breaker response
 */
function createCircuitBreakerResponse(requestId?: string): Response {
  const headers: Record<string, string> = {
    'Content-Type': HTTP_HEADERS.CONTENT_TYPE_JSON,
    'Retry-After': '30',
  };
  if (requestId) {
    headers['X-Request-ID'] = requestId;
  }
  return new Response(
    JSON.stringify({
      error: ERROR_MESSAGES.SERVICE_UNAVAILABLE,
      details: 'Vent litt før du prøver igjen',
    }),
    { status: 503, headers }
  );
}

/**
 * Create daily budget exceeded response
 */
function createDailyBudgetResponse(requestId?: string): Response {
  const headers: Record<string, string> = {
    'Content-Type': HTTP_HEADERS.CONTENT_TYPE_JSON,
    'Retry-After': '3600', // 1 hour
  };
  if (requestId) {
    headers['X-Request-ID'] = requestId;
  }
  return new Response(
    JSON.stringify({
      error: 'Daglig grense nådd',
      details: 'Du har brukt opp din daglige kvote. Prøv igjen i morgen.',
    }),
    { status: 429, headers }
  );
}
