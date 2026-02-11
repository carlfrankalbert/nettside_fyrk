/**
 * Client-side tracking utilities
 * Centralized module for button click tracking and event logging
 */

import { signRequest } from './request-signing';
import { fetchWithRetryFireAndForget } from './fetch-retry';
import { shouldExcludeFromTracking } from '../scripts/tracking-exclusion';

/**
 * Session ID for retention measurement
 * Uses localStorage with 30-minute inactivity timeout for cross-tab continuity.
 * No PII - just timestamp + random string.
 */
let cachedSessionId: string | null = null;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const SESSION_STORAGE_KEY = 'fyrk_session';

interface StoredSession {
  id: string;
  lastActivity: number;
}

function getSessionId(): string {
  if (cachedSessionId) {
    // Update last activity in background
    updateSessionActivity();
    return cachedSessionId;
  }

  // Try to get from localStorage (cross-tab persistence)
  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const session: StoredSession = JSON.parse(stored);
        const now = Date.now();

        // Check if session is still valid (within timeout)
        if (now - session.lastActivity < SESSION_TIMEOUT_MS) {
          cachedSessionId = session.id;
          updateSessionActivity();
          return session.id;
        }
        // Session expired - will create new one below
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Generate new session ID (timestamp + random, no PII)
  const newId = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`;
  cachedSessionId = newId;
  updateSessionActivity();

  return newId;
}

/**
 * Update session last activity timestamp
 */
function updateSessionActivity(): void {
  if (typeof localStorage === 'undefined' || !cachedSessionId) return;

  try {
    const session: StoredSession = {
      id: cachedSessionId,
      lastActivity: Date.now(),
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage errors (private browsing, quota)
  }
}

/**
 * Error types for analytics (allows prioritizing fixes)
 */
export type ErrorType = 'timeout' | 'rate_limit' | 'budget_exceeded' | 'validation' | 'api_error' | 'network' | 'unknown';

/**
 * Metadata for events (no PII)
 */
export interface EventMetadata {
  charCount?: number;
  processingTimeMs?: number;
  errorType?: ErrorType;
  /** Whether the result was from cache */
  cached?: boolean;
  /** Input length for feedback context */
  inputLength?: number;
  /** Tool version for before/after comparison */
  toolVersion?: string;
  /** Session ID for retention measurement (changes per browser session) */
  sessionId?: string;
}

/**
 * Track button click (fire and forget with retry)
 * Sends tracking data to the API without blocking the user
 * Includes sessionId for funnel analysis
 */
export function trackClick(buttonId: string): void {
  if (shouldExcludeFromTracking()) return;

  const signedRequest = signRequest({
    buttonId,
    metadata: { sessionId: getSessionId() },
  });

  fetchWithRetryFireAndForget('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signedRequest),
  });
}

/**
 * Log an event with optional metadata (fire and forget with retry)
 * Use this for funnel events that may carry additional data
 *
 * @param eventType - Event identifier (e.g., 'check_success', 'feedback_up')
 * @param metadata - Optional metadata (charCount, processingTimeMs, errorType, cached) - NO PII
 */
export function logEvent(eventType: string, metadata?: EventMetadata): void {
  if (shouldExcludeFromTracking()) return;

  const payload: { buttonId: string; metadata?: EventMetadata } = { buttonId: eventType };

  // Always include session ID for retention measurement
  const enrichedMetadata: EventMetadata = {
    ...metadata,
    sessionId: getSessionId(),
  };

  payload.metadata = enrichedMetadata;

  const signedRequest = signRequest(payload);

  fetchWithRetryFireAndForget('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signedRequest),
  });
}
