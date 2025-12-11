/**
 * OKR Reviewer Service
 * Handles API communication for OKR analysis with caching and streaming support
 */

import { hashInput } from '../utils/crypto';
import { ERROR_MESSAGES } from '../utils/messages';
import { createSSEBuffer, processSSEChunk, parseSSEDataLine } from '../utils/sse';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Constants
// ============================================================================

const CACHE_KEY_PREFIX = 'okr_cache_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const API_ENDPOINT = '/api/okr-reviewer';

// ============================================================================
// In-memory request deduplication
// ============================================================================

const pendingRequests = new Map<string, Promise<OKRReviewResult>>();

// ============================================================================
// Client-side Cache (localStorage)
// ============================================================================

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

function setCachedResult(cacheKey: string, output: string): void {
  try {
    localStorage.setItem(
      CACHE_KEY_PREFIX + cacheKey,
      JSON.stringify({ output, timestamp: Date.now() })
    );
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

// ============================================================================
// API Communication
// ============================================================================

async function fetchOKRReview(input: string, stream: boolean = false): Promise<Response> {
  return fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input, stream }),
  });
}

function createErrorResult(error: string): OKRReviewError {
  return { success: false, error };
}

function createSuccessResult(output: string, cached: boolean = false): OKRReviewResponse {
  return { success: true, output, cached };
}

// ============================================================================
// Non-Streaming Review
// ============================================================================

/**
 * Submit an OKR for AI-powered review (non-streaming)
 */
export async function reviewOKR(input: string): Promise<OKRReviewResult> {
  const cacheKey = await hashInput(input);

  // Check localStorage cache first
  const cachedOutput = getCachedResult(cacheKey);
  if (cachedOutput) {
    return createSuccessResult(cachedOutput, true);
  }

  // Check for pending request (deduplication)
  const pending = pendingRequests.get(cacheKey);
  if (pending) {
    return pending;
  }

  // Create new request promise
  const requestPromise = executeReviewRequest(input, cacheKey);
  pendingRequests.set(cacheKey, requestPromise);

  return requestPromise;
}

async function executeReviewRequest(input: string, cacheKey: string): Promise<OKRReviewResult> {
  try {
    const response = await fetchOKRReview(input);

    if (!response.ok) {
      if (response.status === 429) {
        return createErrorResult(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED);
      }
      return createErrorResult(ERROR_MESSAGES.OKR_REVIEW_FAILED);
    }

    const data = await response.json();

    if (!data.output) {
      return createErrorResult(ERROR_MESSAGES.OKR_REVIEW_FAILED);
    }

    // Cache successful result
    if (!data.cached) {
      setCachedResult(cacheKey, data.output);
    }

    return createSuccessResult(data.output, data.cached);
  } catch {
    return createErrorResult(ERROR_MESSAGES.OKR_REVIEW_FAILED);
  } finally {
    pendingRequests.delete(cacheKey);
  }
}

// ============================================================================
// Streaming Review
// ============================================================================

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

  // Check localStorage cache first - simulate streaming for cached results
  const cachedOutput = getCachedResult(cacheKey);
  if (cachedOutput) {
    simulateStreamingFromCache(cachedOutput, onChunk, onComplete);
    return;
  }

  try {
    const response = await fetchOKRReview(input, true);

    if (!response.ok) {
      if (response.status === 429) {
        onError(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED);
      } else {
        onError(ERROR_MESSAGES.OKR_REVIEW_FAILED);
      }
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError(ERROR_MESSAGES.OKR_REVIEW_FAILED);
      return;
    }

    await processStreamingResponse(reader, cacheKey, onChunk, onComplete, onError);
  } catch {
    onError(ERROR_MESSAGES.OKR_REVIEW_FAILED);
  }
}

function simulateStreamingFromCache(
  cachedOutput: string,
  onChunk: (text: string) => void,
  onComplete: () => void
): void {
  const words = cachedOutput.split(' ');
  for (let i = 0; i < words.length; i++) {
    setTimeout(() => {
      onChunk(words[i] + (i < words.length - 1 ? ' ' : ''));
      if (i === words.length - 1) {
        onComplete();
      }
    }, i * 10); // 10ms delay between words
  }
}

async function processStreamingResponse(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  cacheKey: string,
  onChunk: (text: string) => void,
  onComplete: () => void,
  onError: (error: string) => void
): Promise<void> {
  const sseBuffer = createSSEBuffer();
  let fullOutput = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const dataLines = processSSEChunk(sseBuffer, value);

    for (const dataLine of dataLines) {
      const event = parseSSEDataLine(dataLine);
      if (!event) continue;

      switch (event.type) {
        case 'done':
          setCachedResult(cacheKey, fullOutput);
          onComplete();
          return;

        case 'error':
          onError(event.error || ERROR_MESSAGES.OKR_REVIEW_FAILED);
          return;

        case 'text':
          if (event.text) {
            fullOutput += event.text;
            onChunk(event.text);
          }
          break;
      }
    }
  }
}
