/**
 * Client-side service for interacting with the Konseptspeil API
 * Handles streaming responses, caching, and request deduplication
 */

import { hashInput, localStorageCache } from '../utils/cache';

const API_ENDPOINT = '/api/konseptspeilet';
const MAX_RETRIES = 1; // Number of automatic retries for incomplete responses

/**
 * Error messages for the konseptspeil service
 */
const ERROR_MESSAGES = {
  DEFAULT: 'Noe gikk galt. Prøv igjen.',
  RATE_LIMIT: 'For mange forespørsler. Vent litt før du prøver igjen.',
  NETWORK: 'Kunne ikke koble til serveren. Sjekk nettverksforbindelsen.',
  ABORTED: 'Forespørselen ble avbrutt.',
  TIMEOUT: 'Det tok litt for lang tid. Prøv igjen.',
  INVALID_OUTPUT: 'Jeg fikk ikke et tydelig speil denne gangen. Prøv igjen.',
} as const;

export { ERROR_MESSAGES };

/**
 * Check if a response has minimal required content
 * This helps detect truncated or incomplete AI responses
 *
 * For the v2 format, we check for all four sections
 */
function isResponseComplete(output: string): boolean {
  if (!output || output.trim().length === 0) return false;

  const content = output.trim();

  // Check for all required v2 sections
  const hasSummary = /---SUMMARY---[\s\S]*?---END_SUMMARY---/.test(content);
  const hasDimensions = /---DIMENSIONS---[\s\S]*?---END_DIMENSIONS---/.test(content);
  const hasAssumptions = /---ASSUMPTIONS---[\s\S]*?---END_ASSUMPTIONS---/.test(content);
  const hasQuestions = /---QUESTIONS---[\s\S]*?---END_QUESTIONS---/.test(content);

  // Response is complete if it has all sections
  return hasSummary && hasDimensions && hasAssumptions && hasQuestions;
}

/**
 * Validate that the output conforms to the expected v2 format.
 * Returns true if valid, false if missing required sections.
 */
export function isValidOutput(output: string): boolean {
  if (!output || output.trim().length === 0) return false;

  const content = output.trim();

  // Must have all four required v2 sections
  const hasSummary = /---SUMMARY---[\s\S]*?---END_SUMMARY---/.test(content);
  const hasDimensions = /---DIMENSIONS---[\s\S]*?---END_DIMENSIONS---/.test(content);
  const hasAssumptions = /---ASSUMPTIONS---[\s\S]*?---END_ASSUMPTIONS---/.test(content);
  const hasQuestions = /---QUESTIONS---[\s\S]*?---END_QUESTIONS---/.test(content);

  return hasSummary && hasDimensions && hasAssumptions && hasQuestions;
}

// Track pending requests - Note: We no longer use this for deduplication
// as it caused state corruption when multiple React callbacks shared state.
// The localStorage cache provides sufficient deduplication for performance.
// Keeping the Map for potential future use with proper isolation.

/**
 * Internal function to perform a single streaming request
 */
async function performStreamingRequest(
  trimmedInput: string,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input: trimmedInput, stream: true }),
    signal,
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as { error?: string };
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
          const event = JSON.parse(data) as { error?: boolean; message?: string; text?: string };
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

  return fullOutput;
}

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

  // Check local cache first (only if complete)
  const cachedResult = localStorageCache.get(cacheKey);
  if (cachedResult && isResponseComplete(cachedResult)) {
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

  // Clear potentially incomplete cached result
  if (cachedResult && !isResponseComplete(cachedResult)) {
    localStorageCache.remove(cacheKey);
  }

  // Note: We intentionally removed the pending request deduplication logic here.
  // The previous implementation reused pending promises across React component calls,
  // which caused state corruption: the first request's onChunk callbacks would update
  // React state, then the second request's onChunk would append the full result again.
  // The localStorage cache provides sufficient caching for performance.

  // Create new request with retry logic
  const requestPromise = (async (): Promise<string> => {
    let lastOutput = '';
    let retryCount = 0;

    while (retryCount <= MAX_RETRIES) {
      if (signal?.aborted) {
        throw new Error(ERROR_MESSAGES.ABORTED);
      }

      // Clear previous output if retrying
      if (retryCount > 0) {
        // Reset the output display for retry
        onChunk('\n[Automatisk retry...]\n');
      }

      lastOutput = await performStreamingRequest(trimmedInput, onChunk, signal);

      // Check if response is complete
      if (isResponseComplete(lastOutput)) {
        // Cache the complete result
        localStorageCache.set(cacheKey, lastOutput);
        return lastOutput;
      }

      // Response is incomplete, retry if we haven't exceeded max retries
      retryCount++;
      if (retryCount <= MAX_RETRIES) {
        console.warn(`Incomplete response detected, retrying (attempt ${retryCount}/${MAX_RETRIES})...`);
        // Short delay before retry
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // All retries exhausted, return what we have (even if incomplete)
    // Don't cache incomplete responses
    console.warn('Max retries reached, returning incomplete response');
    return lastOutput;
  })();

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
    const errorData = (await response.json().catch(() => ({}))) as { error?: string };
    if (response.status === 429) {
      throw new Error(ERROR_MESSAGES.RATE_LIMIT);
    }
    throw new Error(errorData.error || ERROR_MESSAGES.DEFAULT);
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
