/**
 * Shared streaming response utilities for Anthropic API
 *
 * Handles SSE streaming, parsing, caching, and error handling.
 * Used by: okr-sjekken, konseptspeilet, antakelseskart
 */

import type { AnthropicStreamEvent, AnthropicErrorResponse } from '../types';
import { ANTHROPIC_CONFIG, HTTP_HEADERS, CACHE_HEADERS, ERROR_MESSAGES } from '../utils/constants';
import { createAnthropicHeaders } from './anthropic-client';

export interface StreamingResponseConfig {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  timeoutMs?: number;
  /** Request ID for tracing */
  requestId?: string;
  /** Validate output before caching. Return false to skip caching. */
  validateOutput?: (output: string) => boolean;
  /** Called with validated output to cache it */
  onCache?: (output: string) => void;
  /** Called on API success (for circuit breaker) */
  onSuccess?: () => void;
  /** Called on API failure (for circuit breaker) */
  onFailure?: () => void;
}

/**
 * Create a streaming SSE response from Anthropic API
 */
export function createAnthropicStreamingResponse(
  config: StreamingResponseConfig
): Response {
  const {
    apiKey,
    model,
    systemPrompt,
    userMessage,
    maxTokens = ANTHROPIC_CONFIG.MAX_TOKENS,
    timeoutMs = ANTHROPIC_CONFIG.REQUEST_TIMEOUT_MS,
    requestId,
    validateOutput,
    onCache,
    onSuccess,
    onFailure,
  } = config;

  const encoder = new TextEncoder();
  let fullOutput = '';

  const customReadable = new ReadableStream({
    async start(controller) {
      // Set up timeout
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

      try {
        const anthropicResponse = await fetch(ANTHROPIC_CONFIG.API_URL, {
          method: 'POST',
          headers: createAnthropicHeaders(apiKey),
          body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            system: systemPrompt,
            messages: [{ role: 'user', content: userMessage }],
            stream: true,
          }),
          signal: timeoutController.signal,
        });

        clearTimeout(timeoutId);

        if (!anthropicResponse.ok) {
          onFailure?.();
          const errorData = (await anthropicResponse
            .json()
            .catch(() => ({}))) as AnthropicErrorResponse;
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error: true,
                message: errorData?.error?.message || ERROR_MESSAGES.API_ERROR,
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
                if (
                  event.type === 'content_block_delta' &&
                  event.delta?.type === 'text_delta'
                ) {
                  const text = event.delta.text || '';
                  fullOutput += text;
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                  );
                }
              } catch {
                // Ignore JSON parse errors for malformed events
              }
            }
          }
        }

        // Record success and cache only if output is valid
        onSuccess?.();
        if (!validateOutput || validateOutput(fullOutput)) {
          onCache?.(fullOutput);
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        clearTimeout(timeoutId);
        onFailure?.();

        const isTimeout =
          error instanceof Error &&
          (error.name === 'AbortError' || error.name === 'TimeoutError');

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              error: true,
              message: isTimeout
                ? ERROR_MESSAGES.TIMEOUT
                : ERROR_MESSAGES.STREAMING_FAILED,
            })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  const headers: Record<string, string> = {
    'Content-Type': HTTP_HEADERS.CONTENT_TYPE_SSE,
    'Cache-Control': HTTP_HEADERS.CACHE_CONTROL_NO_CACHE,
    Connection: HTTP_HEADERS.CONNECTION_KEEP_ALIVE,
    'X-Cache': CACHE_HEADERS.MISS,
  };
  if (requestId) {
    headers['X-Request-ID'] = requestId;
  }

  return new Response(customReadable, { headers });
}

/**
 * Create a streaming response from cached content
 * Simulates streaming by sending chunks with delays
 */
export function createCachedStreamingResponse(
  cachedOutput: string,
  options: { chunkSize?: number; delayMs?: number; requestId?: string } = {}
): Response {
  const { chunkSize = 50, delayMs = 15, requestId } = options;
  const encoder = new TextEncoder();
  const chunks = cachedOutput.match(new RegExp(`.{1,${chunkSize}}`, 'g')) || [
    cachedOutput,
  ];

  const stream = new ReadableStream({
    async start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`)
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  const headers: Record<string, string> = {
    'Content-Type': HTTP_HEADERS.CONTENT_TYPE_SSE,
    'Cache-Control': HTTP_HEADERS.CACHE_CONTROL_NO_CACHE,
    Connection: HTTP_HEADERS.CONNECTION_KEEP_ALIVE,
    'X-Cache': CACHE_HEADERS.HIT,
  };
  if (requestId) {
    headers['X-Request-ID'] = requestId;
  }

  return new Response(stream, { headers });
}

/**
 * Create standard JSON response helpers
 */
export function createJsonResponse(
  data: unknown,
  options: { status?: number; cacheStatus?: 'HIT' | 'MISS'; requestId?: string } = {}
): Response {
  const { status = 200, cacheStatus = 'MISS', requestId } = options;
  const headers: Record<string, string> = {
    'Content-Type': HTTP_HEADERS.CONTENT_TYPE_JSON,
    'X-Cache': cacheStatus === 'HIT' ? CACHE_HEADERS.HIT : CACHE_HEADERS.MISS,
  };
  if (requestId) {
    headers['X-Request-ID'] = requestId;
  }
  return new Response(JSON.stringify(data), { status, headers });
}

export function createErrorResponse(
  message: string,
  status: number = 500,
  details?: string,
  requestId?: string
): Response {
  const headers: Record<string, string> = {
    'Content-Type': HTTP_HEADERS.CONTENT_TYPE_JSON,
  };
  if (requestId) {
    headers['X-Request-ID'] = requestId;
  }
  return new Response(
    JSON.stringify({ error: message, ...(details && { details }) }),
    { status, headers }
  );
}
