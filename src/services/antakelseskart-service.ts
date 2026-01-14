/**
 * Client-side service for interacting with the Antakelseskart API
 * Handles streaming responses, caching, and request deduplication
 */

import { hashInput, localStorageCache } from '../utils/cache';
import { trackClick } from '../utils/tracking';

const API_ENDPOINT = '/api/antakelseskart';
const MAX_RETRIES = 1;

/**
 * Error messages for the antakelseskart service
 */
const ERROR_MESSAGES = {
  DEFAULT: 'Noe gikk galt. Prøv igjen.',
  RATE_LIMIT: 'For mange forespørsler. Vent litt før du prøver igjen.',
  NETWORK: 'Kunne ikke koble til serveren. Sjekk nettverksforbindelsen.',
  ABORTED: 'Forespørselen ble avbrutt.',
  TIMEOUT: 'Det tok litt for lang tid. Prøv igjen.',
  INVALID_OUTPUT: 'Jeg fikk ikke gyldige antakelser denne gangen. Prøv igjen.',
} as const;

export { ERROR_MESSAGES };

/**
 * Check if a response has minimal required content
 */
function isResponseComplete(output: string): boolean {
  if (!output || output.trim().length === 0) return false;

  try {
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return false;

    const parsed = JSON.parse(jsonMatch[0]);

    const hasBeslutning = typeof parsed.beslutning_oppsummert === 'string' &&
      parsed.beslutning_oppsummert.length > 0;
    const hasAntakelser = parsed.antakelser &&
      (Array.isArray(parsed.antakelser.målgruppe_behov) ||
       Array.isArray(parsed.antakelser.løsning_produkt) ||
       Array.isArray(parsed.antakelser.marked_konkurranse) ||
       Array.isArray(parsed.antakelser.forretning_skalering));

    return !!(hasBeslutning && hasAntakelser);
  } catch {
    return false;
  }
}

/**
 * Validate that the output conforms to the expected JSON format.
 */
export function isValidOutput(output: string): boolean {
  return isResponseComplete(output);
}

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
 * Generate assumptions with streaming response
 */
export async function generateAssumptionsStreaming(
  input: string,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const trimmedInput = input.trim();
  const cacheKey = await hashInput('antakelseskart:v1:' + trimmedInput);

  // Check local cache first
  const cachedResult = localStorageCache.get(cacheKey);
  if (cachedResult && isResponseComplete(cachedResult)) {
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

  const requestPromise = (async (): Promise<string> => {
    let lastOutput = '';
    let retryCount = 0;

    while (retryCount <= MAX_RETRIES) {
      if (signal?.aborted) {
        throw new Error(ERROR_MESSAGES.ABORTED);
      }

      lastOutput = await performStreamingRequest(trimmedInput, onChunk, signal);

      if (isResponseComplete(lastOutput)) {
        localStorageCache.set(cacheKey, lastOutput);
        return lastOutput;
      }

      retryCount++;
      if (retryCount <= MAX_RETRIES) {
        console.warn(`Incomplete response detected, retrying (attempt ${retryCount}/${MAX_RETRIES})...`);
        trackClick('antakelseskart_retry');
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

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
