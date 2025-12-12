/**
 * OKR Reviewer Service
 * Handles API communication for OKR analysis with caching and streaming support
 */

export interface OKRReviewResponse {
  success: true;
  output: string;
  cached?: boolean;
}

export interface OKRReviewError {
  success: false;
  error: string;
}

export type OKRReviewResult = OKRReviewResponse | OKRReviewError;

const DEFAULT_ERROR_MESSAGE = 'Noe gikk galt under vurderingen. Prøv igjen om litt.';
const CACHE_KEY_PREFIX = 'okr_cache_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// In-memory cache for request deduplication
const pendingRequests = new Map<string, Promise<OKRReviewResult>>();

/**
 * Generate a simple hash for cache key
 */
async function hashInput(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get cached result from localStorage
 */
function getCachedResult(cacheKey: string): string | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY_PREFIX + cacheKey);
    if (!cached) return null;

    const { output, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY_PREFIX + cacheKey);
      return null;
    }

    return output;
  } catch {
    return null;
  }
}

/**
 * Save result to localStorage cache
 */
function setCachedResult(cacheKey: string, output: string): void {
  try {
    localStorage.setItem(
      CACHE_KEY_PREFIX + cacheKey,
      JSON.stringify({ output, timestamp: Date.now() })
    );
  } catch (e) {
    console.warn('Failed to cache result:', e);
  }
}

/**
 * Submit an OKR for AI-powered review (non-streaming)
 */
export async function reviewOKR(input: string): Promise<OKRReviewResult> {
  const cacheKey = await hashInput(input);

  // Check localStorage cache first
  const cachedOutput = getCachedResult(cacheKey);
  if (cachedOutput) {
    return {
      success: true,
      output: cachedOutput,
      cached: true,
    };
  }

  // Check for pending request (deduplication)
  const pending = pendingRequests.get(cacheKey);
  if (pending) {
    return pending;
  }

  // Create new request promise
  const requestPromise = (async (): Promise<OKRReviewResult> => {
    try {
      const response = await fetch('/api/okr-sjekken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return {
            success: false,
            error: 'For mange forespørsler. Vent litt før du prøver igjen.',
          };
        }
        return {
          success: false,
          error: DEFAULT_ERROR_MESSAGE,
        };
      }

      const data = await response.json();

      if (!data.output) {
        return {
          success: false,
          error: DEFAULT_ERROR_MESSAGE,
        };
      }

      // Cache successful result
      if (!data.cached) {
        setCachedResult(cacheKey, data.output);
      }

      return {
        success: true,
        output: data.output,
        cached: data.cached,
      };
    } catch {
      return {
        success: false,
        error: DEFAULT_ERROR_MESSAGE,
      };
    } finally {
      pendingRequests.delete(cacheKey);
    }
  })();

  pendingRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

/**
 * Submit an OKR for AI-powered review with streaming
 */
export async function reviewOKRStreaming(
  input: string,
  onChunk: (text: string) => void,
  onComplete: () => void,
  onError: (error: string) => void
): Promise<void> {
  const cacheKey = await hashInput(input);

  // Check localStorage cache first
  const cachedOutput = getCachedResult(cacheKey);
  if (cachedOutput) {
    // Simulate streaming for cached results
    const words = cachedOutput.split(' ');
    for (let i = 0; i < words.length; i++) {
      setTimeout(() => {
        onChunk(words[i] + (i < words.length - 1 ? ' ' : ''));
        if (i === words.length - 1) {
          onComplete();
        }
      }, i * 10); // 10ms delay between words
    }
    return;
  }

  try {
    const response = await fetch('/api/okr-reviewer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, stream: true }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        onError('For mange forespørsler. Vent litt før du prøver igjen.');
      } else {
        onError(DEFAULT_ERROR_MESSAGE);
      }
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError(DEFAULT_ERROR_MESSAGE);
      return;
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
          if (data === '[DONE]') {
            // Cache the complete output
            setCachedResult(cacheKey, fullOutput);
            onComplete();
            return;
          }

          try {
            const event = JSON.parse(data);
            if (event.error) {
              onError(event.message || DEFAULT_ERROR_MESSAGE);
              return;
            }
            if (event.text) {
              fullOutput += event.text;
              onChunk(event.text);
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e);
          }
        }
      }
    }
  } catch (error) {
    console.error('Streaming error:', error);
    onError(DEFAULT_ERROR_MESSAGE);
  }
}
