/**
 * Streaming utilities for Server-Sent Events (SSE) parsing
 * Provides shared functionality for streaming API responses
 */

export interface StreamEvent {
  text?: string;
  error?: boolean;
  message?: string;
}

export interface StreamingOptions {
  /** Abort signal for request cancellation */
  signal?: AbortSignal;
  /** Callback for each text chunk received */
  onChunk: (text: string) => void;
  /** Callback when streaming completes successfully */
  onComplete: (fullOutput: string) => void;
  /** Callback when an error occurs */
  onError: (error: string) => void;
}

export interface StreamingResult {
  success: boolean;
  output?: string;
  error?: string;
}

/**
 * Parse a Server-Sent Events (SSE) stream from a Response
 * Handles the common SSE format: "data: {json}\n" or "data: [DONE]\n"
 *
 * @param response - The fetch Response with SSE body
 * @param options - Streaming callbacks and signal
 * @returns The complete output string
 * @throws Error on stream errors
 */
export async function parseSSEStream(
  response: Response,
  options: Omit<StreamingOptions, 'onComplete' | 'onError'>
): Promise<string> {
  const { signal, onChunk } = options;

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body available');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let fullOutput = '';

  try {
    while (true) {
      // Check if cancelled
      if (signal?.aborted) {
        await reader.cancel();
        throw new DOMException('Aborted', 'AbortError');
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          // Handle stream completion marker
          if (data === '[DONE]') {
            return fullOutput;
          }

          try {
            const event: StreamEvent = JSON.parse(data);

            if (event.error) {
              throw new Error(event.message || 'Stream error');
            }

            if (event.text) {
              fullOutput += event.text;
              onChunk(event.text);
            }
          } catch (e) {
            // Skip invalid JSON lines (syntax errors only)
            if (e instanceof SyntaxError) {
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
 * Simulate streaming for cached results
 * Provides a consistent UX when returning cached data
 *
 * @param cachedContent - The cached content to "stream"
 * @param onChunk - Callback for each chunk
 * @param signal - Optional abort signal
 * @param chunkSize - Size of each chunk (default: 50 chars)
 * @param delayMs - Delay between chunks in milliseconds (default: 10)
 */
export async function simulateCachedStreaming(
  cachedContent: string,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
  chunkSize = 50,
  delayMs = 10
): Promise<void> {
  const chunks = cachedContent.match(new RegExp(`.{1,${chunkSize}}`, 'g')) || [cachedContent];

  for (const chunk of chunks) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    onChunk(chunk);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

/**
 * Create a streaming service function with common error handling
 * Factory function for creating consistent streaming service implementations
 *
 * @param endpoint - The API endpoint to call
 * @param defaultErrorMessage - Default error message for failures
 * @param rateLimitMessage - Error message for rate limit (429) responses
 * @returns Configured streaming function
 */
export function createStreamingHandler(
  endpoint: string,
  defaultErrorMessage: string,
  rateLimitMessage: string
) {
  return async function handleStreaming(
    input: string,
    options: StreamingOptions
  ): Promise<StreamingResult> {
    const { signal, onChunk, onComplete, onError } = options;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, stream: true }),
        signal,
      });

      if (!response.ok) {
        if (response.status === 429) {
          onError(rateLimitMessage);
          return { success: false, error: rateLimitMessage };
        }

        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || defaultErrorMessage;
        onError(errorMsg);
        return { success: false, error: errorMsg };
      }

      const output = await parseSSEStream(response, { signal, onChunk });
      onComplete(output);

      return { success: true, output };
    } catch (error) {
      // Don't report errors for intentional cancellation
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, error: 'Aborted' };
      }

      const errorMsg = error instanceof Error ? error.message : defaultErrorMessage;
      onError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };
}
