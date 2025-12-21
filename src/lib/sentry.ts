/**
 * Sentry Error Monitoring Configuration
 *
 * This module provides error tracking and performance monitoring for the Fyrk website.
 * It works in both browser and server environments.
 *
 * Environment Variables Required:
 * - PUBLIC_SENTRY_DSN: Your Sentry DSN (Data Source Name)
 * - PUBLIC_SENTRY_ENVIRONMENT: Environment name (production, staging, development)
 *
 * Usage:
 * - Errors are automatically captured
 * - Use captureException() for manual error reporting
 * - Use captureMessage() for custom messages
 */

// Sentry configuration options
export interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
}

// Get Sentry configuration from environment
export function getSentryConfig(): SentryConfig | null {
  const dsn = typeof import.meta !== 'undefined'
    ? import.meta.env?.PUBLIC_SENTRY_DSN
    : process.env.PUBLIC_SENTRY_DSN;

  if (!dsn) {
    console.warn('Sentry DSN not configured - error monitoring disabled');
    return null;
  }

  const environment = typeof import.meta !== 'undefined'
    ? import.meta.env?.PUBLIC_SENTRY_ENVIRONMENT || 'development'
    : process.env.PUBLIC_SENTRY_ENVIRONMENT || 'development';

  return {
    dsn,
    environment,
    release: typeof import.meta !== 'undefined'
      ? import.meta.env?.PUBLIC_SENTRY_RELEASE
      : process.env.PUBLIC_SENTRY_RELEASE,
    // Capture 10% of transactions for performance monitoring
    tracesSampleRate: 0.1,
    // Capture 1% of sessions for replay
    replaysSessionSampleRate: 0.01,
    // Capture 100% of sessions with errors for replay
    replaysOnErrorSampleRate: 1.0,
  };
}

// Type definitions for Sentry-like error reporting
export interface ErrorContext {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  user?: {
    id?: string;
    email?: string;
    ip_address?: string;
  };
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
}

/**
 * Lightweight error reporter that works without full Sentry SDK
 * This can be replaced with full Sentry integration when SDK is installed
 */
class ErrorReporter {
  private config: SentryConfig | null;
  private isEnabled: boolean;

  constructor() {
    this.config = getSentryConfig();
    this.isEnabled = !!this.config?.dsn;
  }

  /**
   * Capture an exception and send to Sentry
   */
  async captureException(error: Error, context?: ErrorContext): Promise<string | null> {
    if (!this.isEnabled || !this.config) {
      console.error('[Sentry Disabled] Error:', error.message, error.stack);
      return null;
    }

    const eventId = this.generateEventId();

    try {
      const payload = this.buildErrorPayload(error, eventId, context);
      await this.sendToSentry(payload);
      return eventId;
    } catch (e) {
      console.error('[Sentry] Failed to send error:', e);
      return null;
    }
  }

  /**
   * Capture a message and send to Sentry
   */
  async captureMessage(message: string, context?: ErrorContext): Promise<string | null> {
    if (!this.isEnabled || !this.config) {
      console.log('[Sentry Disabled] Message:', message);
      return null;
    }

    const eventId = this.generateEventId();

    try {
      const payload = this.buildMessagePayload(message, eventId, context);
      await this.sendToSentry(payload);
      return eventId;
    } catch (e) {
      console.error('[Sentry] Failed to send message:', e);
      return null;
    }
  }

  /**
   * Set user context for error tracking
   */
  setUser(user: ErrorContext['user']): void {
    // Store user context for subsequent errors
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).__sentryUser = user;
    }
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(breadcrumb: {
    category?: string;
    message: string;
    level?: 'debug' | 'info' | 'warning' | 'error';
    data?: Record<string, unknown>;
  }): void {
    if (!this.isEnabled) return;

    // Store breadcrumbs in memory (limited to last 100)
    if (typeof window !== 'undefined') {
      const breadcrumbs = ((window as unknown as Record<string, unknown[]>).__sentryBreadcrumbs || []) as unknown[];
      breadcrumbs.push({
        ...breadcrumb,
        timestamp: Date.now(),
      });
      if (breadcrumbs.length > 100) breadcrumbs.shift();
      (window as unknown as Record<string, unknown[]>).__sentryBreadcrumbs = breadcrumbs;
    }
  }

  private generateEventId(): string {
    return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/x/g, () =>
      Math.floor(Math.random() * 16).toString(16)
    );
  }

  private buildErrorPayload(error: Error, eventId: string, context?: ErrorContext) {
    return {
      event_id: eventId,
      timestamp: new Date().toISOString(),
      platform: 'javascript',
      level: context?.level || 'error',
      environment: this.config?.environment,
      release: this.config?.release,
      exception: {
        values: [{
          type: error.name,
          value: error.message,
          stacktrace: {
            frames: this.parseStackTrace(error.stack),
          },
        }],
      },
      tags: context?.tags,
      extra: context?.extra,
      user: context?.user,
      contexts: {
        runtime: {
          name: typeof window !== 'undefined' ? 'browser' : 'node',
        },
      },
    };
  }

  private buildMessagePayload(message: string, eventId: string, context?: ErrorContext) {
    return {
      event_id: eventId,
      timestamp: new Date().toISOString(),
      platform: 'javascript',
      level: context?.level || 'info',
      environment: this.config?.environment,
      release: this.config?.release,
      message: {
        formatted: message,
      },
      tags: context?.tags,
      extra: context?.extra,
      user: context?.user,
    };
  }

  private parseStackTrace(stack?: string): Array<{ filename: string; function: string; lineno?: number; colno?: number }> {
    if (!stack) return [];

    return stack.split('\n').slice(1).map(line => {
      const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/) ||
                    line.match(/at\s+(.+?):(\d+):(\d+)/);

      if (match) {
        return {
          function: match[1] || '<anonymous>',
          filename: match[2] || '<unknown>',
          lineno: parseInt(match[3], 10),
          colno: parseInt(match[4], 10),
        };
      }

      return {
        function: '<unknown>',
        filename: '<unknown>',
      };
    }).reverse(); // Sentry expects frames in reverse order
  }

  private async sendToSentry(payload: Record<string, unknown>): Promise<void> {
    if (!this.config?.dsn) return;

    // Parse DSN to get project ID and key
    const dsnMatch = this.config.dsn.match(/https:\/\/(.+?)@(.+?)\/(.+)/);
    if (!dsnMatch) {
      console.error('[Sentry] Invalid DSN format');
      return;
    }

    const [, publicKey, host, projectId] = dsnMatch;
    const endpoint = `https://${host}/api/${projectId}/store/`;

    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_client=fyrk-custom/1.0, sentry_key=${publicKey}`,
      },
      body: JSON.stringify(payload),
    });
  }
}

// Singleton instance
export const errorReporter = new ErrorReporter();

// Convenience exports
export const captureException = (error: Error, context?: ErrorContext) =>
  errorReporter.captureException(error, context);

export const captureMessage = (message: string, context?: ErrorContext) =>
  errorReporter.captureMessage(message, context);

export const setUser = (user: ErrorContext['user']) =>
  errorReporter.setUser(user);

export const addBreadcrumb = (breadcrumb: Parameters<typeof errorReporter.addBreadcrumb>[0]) =>
  errorReporter.addBreadcrumb(breadcrumb);
