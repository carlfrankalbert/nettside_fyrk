/**
 * Shared client-side streaming service utilities
 *
 * Extracts common patterns from konseptspeil-service, antakelseskart-service, and okr-service.
 * Handles SSE streaming, local cache, retries, and response validation.
 */

import { hashInput, localStorageCache } from '../utils/cache';
import { trackClick } from '../utils/tracking';

/**
 * Error message keys
 */
export interface ErrorMessages {
  DEFAULT: string;
  RATE_LIMIT: string;
  NETWORK: string;
  ABORTED: string;
  TIMEOUT: string;
  INVALID_OUTPUT: string;
}

/**
 * Default error messages (Norwegian)
 */
export const DEFAULT_ERROR_MESSAGES: ErrorMessages = {
  DEFAULT: 'Noe gikk galt. Prøv igjen.',
  RATE_LIMIT: 'For mange forespørsler. Vent litt før du prøver igjen.',
  NETWORK: 'Kunne ikke koble til serveren. Sjekk nettverksforbindelsen.',
  ABORTED: 'Forespørselen ble avbrutt.',
  TIMEOUT: 'Det tok litt for lang tid. Prøv igjen.',
  INVALID_OUTPUT: 'Ugyldig svar fra serveren. Prøv igjen.',
};

/**
 * Configuration for a streaming service
 */
export interface StreamingServiceConfig {
  /** API endpoint path (e.g., '/api/konseptspeilet') */
  endpoint: string;
  /** Prefix for cache keys (e.g., 'konseptspeil:v2:') */
  cacheKeyPrefix: string;
  /** Validate that the output is complete and well-formed */
  isResponseComplete: (output: string) => boolean;
  /** Error messages (Norwegian) */
  errorMessages?: Partial<ErrorMessages>;
  /** Max retries for incomplete responses (default: 1) */
  maxRetries?: number;
  /** Analytics event name for retries (e.g., 'konseptspeil_retry') */
  retryEventName?: string;
}

/**
 * SSE event from the streaming API
 */
interface StreamEvent {
  error?: boolean;
  message?: string;
  text?: string;
}

/**
 * Perform a streaming request to the API
 * Parses SSE events and calls onChunk for each text chunk
 */
export async function performStreamingRequest(
  endpoint: string,
  input: string,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
  errorMessages: ErrorMessages = DEFAULT_ERROR_MESSAGES
): Promise<string> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input, stream: true }),
    signal,
  });

  if (!response.ok) {
    const errorData = (await response.json().catch((parseError) => {
      // Log parse error in development for debugging
      if (import.meta.env?.DEV) {
        console.warn('[streaming-service] Failed to parse error response:', parseError);
      }
      return {};
    })) as { error?: string };
    if (response.status === 429) {
      throw new Error(errorMessages.RATE_LIMIT);
    }
    throw new Error(errorData.error || errorMessages.DEFAULT);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error(errorMessages.DEFAULT);
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let fullOutput = '';

  try {
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
            const event = JSON.parse(data) as StreamEvent;
            if (event.error) {
              throw new Error(event.message || errorMessages.DEFAULT);
            }
            if (event.text) {
              fullOutput += event.text;
              onChunk(event.text);
            }
          } catch (e) {
            if (e instanceof SyntaxError) {
              // Skip invalid JSON lines
              continue;
            }
            throw e;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return fullOutput;
}

/**
 * Simulate streaming for cached results (better UX than instant display)
 */
export async function streamCachedResult(
  cachedResult: string,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
  chunkSize: number = 50,
  delayMs: number = 10
): Promise<void> {
  const chunks = cachedResult.match(new RegExp(`.{1,${chunkSize}}`, 'g')) || [cachedResult];

  for (const chunk of chunks) {
    if (signal?.aborted) {
      return;
    }
    onChunk(chunk);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

/**
 * Create a streaming service with the given configuration
 * Returns functions for streaming and non-streaming requests
 */
export function createStreamingService(config: StreamingServiceConfig) {
  const {
    endpoint,
    cacheKeyPrefix,
    isResponseComplete,
    maxRetries = 1,
    retryEventName,
  } = config;

  const errorMessages: ErrorMessages = {
    ...DEFAULT_ERROR_MESSAGES,
    ...config.errorMessages,
  };

  /**
   * Stream a request with caching and retry support
   * @param onRetry - Optional callback called before each retry to reset accumulated state
   */
  async function streamRequest(
    input: string,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: string) => void,
    signal?: AbortSignal,
    onRetry?: () => void
  ): Promise<void> {
    const trimmedInput = input.trim();
    const cacheKey = await hashInput(`${cacheKeyPrefix}:${trimmedInput}`);

    // Check local cache first (only if complete)
    const cachedResult = localStorageCache.get(cacheKey);
    if (cachedResult && isResponseComplete(cachedResult)) {
      await streamCachedResult(cachedResult, onChunk, signal);
      if (!signal?.aborted) {
        onComplete();
      }
      return;
    }

    // Clear potentially incomplete cached result
    if (cachedResult && !isResponseComplete(cachedResult)) {
      localStorageCache.remove(cacheKey);
    }

    // Create request with retry logic
    const requestPromise = (async (): Promise<string> => {
      let lastOutput = '';
      let retryCount = 0;

      while (retryCount <= maxRetries) {
        if (signal?.aborted) {
          throw new Error(errorMessages.ABORTED);
        }

        lastOutput = await performStreamingRequest(
          endpoint,
          trimmedInput,
          onChunk,
          signal,
          errorMessages
        );

        // Check if response is complete
        if (isResponseComplete(lastOutput)) {
          localStorageCache.set(cacheKey, lastOutput);
          return lastOutput;
        }

        // Response is incomplete, retry if we haven't exceeded max retries
        retryCount++;
        if (retryCount <= maxRetries) {
          if (import.meta.env?.DEV) console.warn(`Incomplete response detected, retrying (attempt ${retryCount}/${maxRetries})...`);
          if (retryEventName) {
            trackClick(retryEventName);
          }
          // Allow caller to reset accumulated state before retry
          onRetry?.();
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      // All retries exhausted, return what we have (even if incomplete)
      if (import.meta.env?.DEV) console.warn('Max retries reached, returning incomplete response');
      return lastOutput;
    })();

    try {
      await requestPromise;
      onComplete();
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          onError(errorMessages.ABORTED);
        } else {
          onError(error.message);
        }
      } else {
        onError(errorMessages.DEFAULT);
      }
    }
  }

  /**
   * Make a non-streaming request with caching
   */
  async function request(
    input: string
  ): Promise<{ output: string; cached: boolean }> {
    const trimmedInput = input.trim();
    const cacheKey = await hashInput(`${cacheKeyPrefix}:${trimmedInput}`);

    // Check local cache first
    const cachedResult = localStorageCache.get(cacheKey);
    if (cachedResult) {
      return { output: cachedResult, cached: true };
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: trimmedInput, stream: false }),
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as { error?: string };
      if (response.status === 429) {
        throw new Error(errorMessages.RATE_LIMIT);
      }
      throw new Error(errorData.error || errorMessages.DEFAULT);
    }

    const data = (await response.json()) as { output?: string; cached?: boolean };

    // Cache the result
    if (data.output) {
      localStorageCache.set(cacheKey, data.output);
    }

    return {
      output: data.output ?? '',
      cached: data.cached ?? false,
    };
  }

  return {
    streamRequest,
    request,
    errorMessages,
    isResponseComplete,
  };
}
