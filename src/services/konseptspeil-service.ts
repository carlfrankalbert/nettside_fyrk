/**
 * Client-side service for interacting with the Konseptspeil API
 * Handles streaming responses, caching, and request deduplication
 */

import { hashInput, localStorageCache } from '../utils/cache';

const API_ENDPOINT = '/api/konseptspeilet';

/**
 * Error messages for the konseptspeil service
 */
const ERROR_MESSAGES = {
  DEFAULT: 'Noe gikk galt under speilingen. Prøv igjen om litt.',
  RATE_LIMIT: 'For mange forespørsler. Vent litt før du prøver igjen.',
  NETWORK: 'Kunne ikke koble til serveren. Sjekk nettverksforbindelsen.',
  ABORTED: 'Forespørselen ble avbrutt.',
} as const;

// Track pending requests to prevent duplicates
const pendingRequests = new Map<string, Promise<string>>();

/**
 * Speile konsept with streaming response
 */
export async function speileKonseptStreaming(
  input: string,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const trimmedInput = input.trim();
  const cacheKey = await hashInput('konseptspeil:' + trimmedInput);

  // Check local cache first
  const cachedResult = localStorageCache.get(cacheKey);
  if (cachedResult) {
    // Simulate streaming for cached results (better UX)
    const chunks = cachedResult.match(/.{1,50}/g) || [cachedResult];
    for (const chunk of chunks) {
      if (signal?.aborted) {
        onError(ERROR_MESSAGES.ABORTED);
        return;
      }
      onChunk(chunk);
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    onComplete();
    return;
  }

  // Check for pending request with same input
  const pendingRequest = pendingRequests.get(cacheKey);
  if (pendingRequest) {
    try {
      const result = await pendingRequest;
      onChunk(result);
      onComplete();
    } catch (error) {
      onError(error instanceof Error ? error.message : ERROR_MESSAGES.DEFAULT);
    }
    return;
  }

  // Create new request
  const requestPromise = (async (): Promise<string> => {
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: trimmedInput, stream: true }),
        signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          throw new Error(ERROR_MESSAGES.RATE_LIMIT);
        }
        throw new Error(errorData.error || ERROR_MESSAGES.DEFAULT);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error(ERROR_MESSAGES.DEFAULT);
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let fullOutput = '';

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
              const event = JSON.parse(data);
              if (event.error) {
                throw new Error(event.message || ERROR_MESSAGES.DEFAULT);
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

      // Cache the complete result
      if (fullOutput) {
        localStorageCache.set(cacheKey, fullOutput);
      }

      return fullOutput;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  })();

  pendingRequests.set(cacheKey, requestPromise);

  try {
    await requestPromise;
    onComplete();
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        onError(ERROR_MESSAGES.ABORTED);
      } else {
        onError(error.message);
      }
    } else {
      onError(ERROR_MESSAGES.DEFAULT);
    }
  }
}

/**
 * Speile konsept without streaming (for simple use cases)
 */
export async function speileKonsept(input: string): Promise<{ output: string; cached: boolean }> {
  const trimmedInput = input.trim();
  const cacheKey = await hashInput('konseptspeil:' + trimmedInput);

  // Check local cache first
  const cachedResult = localStorageCache.get(cacheKey);
  if (cachedResult) {
    return { output: cachedResult, cached: true };
  }

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input: trimmedInput, stream: false }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 429) {
      throw new Error(ERROR_MESSAGES.RATE_LIMIT);
    }
    throw new Error(errorData.error || ERROR_MESSAGES.DEFAULT);
  }

  const data = await response.json();

  // Cache the result
  if (data.output) {
    localStorageCache.set(cacheKey, data.output);
  }

  return {
    output: data.output,
    cached: data.cached || false,
  };
}
