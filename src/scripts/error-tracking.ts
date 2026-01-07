/**
 * Client-side Error Tracking
 *
 * This script automatically captures unhandled errors and promise rejections,
 * sending them to Sentry for monitoring.
 *
 * Include this script in your layout to enable automatic error tracking.
 */

interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
}

interface ErrorPayload {
  event_id: string;
  timestamp: string;
  platform: string;
  level: string;
  environment?: string;
  release?: string;
  exception?: {
    values: Array<{
      type: string;
      value: string;
      stacktrace?: {
        frames: Array<{
          filename: string;
          function: string;
          lineno?: number;
          colno?: number;
        }>;
      };
    }>;
  };
  message?: {
    formatted: string;
  };
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  contexts?: Record<string, unknown>;
  request?: {
    url: string;
    headers?: Record<string, string>;
  };
  breadcrumbs?: Array<{
    category: string;
    message: string;
    level: string;
    timestamp: number;
    data?: Record<string, unknown>;
  }>;
}

class ClientErrorTracker {
  private config: SentryConfig | null = null;
  private breadcrumbs: Array<{
    category: string;
    message: string;
    level: string;
    timestamp: number;
    data?: Record<string, unknown>;
  }> = [];
  private maxBreadcrumbs = 50;

  constructor() {
    this.init();
  }

  private init(): void {
    // Get config from meta tags or global config
    const dsnMeta = document.querySelector('meta[name="sentry-dsn"]');
    const envMeta = document.querySelector('meta[name="sentry-environment"]');
    const releaseMeta = document.querySelector('meta[name="sentry-release"]');

    const dsn = dsnMeta?.getAttribute('content') ||
      (window as unknown as { __SENTRY_DSN__?: string }).__SENTRY_DSN__;

    if (!dsn) {
      console.debug('[ErrorTracking] Sentry DSN not configured - tracking disabled');
      return;
    }

    this.config = {
      dsn,
      environment: envMeta?.getAttribute('content') ||
        (window as unknown as { __SENTRY_ENVIRONMENT__?: string }).__SENTRY_ENVIRONMENT__ ||
        'production',
      release: releaseMeta?.getAttribute('content') ||
        (window as unknown as { __SENTRY_RELEASE__?: string }).__SENTRY_RELEASE__,
    };

    this.setupErrorHandlers();
    this.setupBreadcrumbTracking();

    console.debug('[ErrorTracking] Initialized with environment:', this.config.environment);
  }

  private setupErrorHandlers(): void {
    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));

      this.captureError(error, {
        type: 'unhandledrejection',
      });
    });
  }

  private setupBreadcrumbTracking(): void {
    // Track navigation
    const originalPushState = history.pushState;
    history.pushState = (...args) => {
      this.addBreadcrumb('navigation', `Navigate to ${args[2]}`, 'info');
      return originalPushState.apply(history, args);
    };

    // Track clicks on interactive elements
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button, a')) {
        const element = target.closest('button, a') || target;
        const text = element.textContent?.trim().substring(0, 50) || '';
        const selector = this.getSelector(element as HTMLElement);
        this.addBreadcrumb('ui.click', `Click on "${text}" (${selector})`, 'info');
      }
    }, { passive: true });

    // Track console errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.addBreadcrumb('console', args.map(a => String(a)).join(' '), 'error');
      originalConsoleError.apply(console, args);
    };

    // Track fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
      const method = (args[1]?.method || 'GET').toUpperCase();

      this.addBreadcrumb('http', `${method} ${url}`, 'info', { url, method });

      try {
        const response = await originalFetch.apply(window, args);
        if (!response.ok) {
          this.addBreadcrumb('http', `${method} ${url} - ${response.status}`, 'warning', {
            url,
            method,
            status_code: response.status,
          });
        }
        return response;
      } catch (error) {
        this.addBreadcrumb('http', `${method} ${url} - Network Error`, 'error', { url, method });
        throw error;
      }
    };
  }

  private getSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c).slice(0, 2).join('.');
      return `${element.tagName.toLowerCase()}.${classes}`;
    }
    return element.tagName.toLowerCase();
  }

  private addBreadcrumb(
    category: string,
    message: string,
    level: string,
    data?: Record<string, unknown>
  ): void {
    this.breadcrumbs.push({
      category,
      message,
      level,
      timestamp: Date.now() / 1000,
      data,
    });

    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  private async captureError(error: Error, extra?: Record<string, unknown>): Promise<void> {
    if (!this.config?.dsn) return;

    const eventId = this.generateEventId();
    const payload = this.buildPayload(error, eventId, extra);

    try {
      await this.sendToSentry(payload);
      console.debug('[ErrorTracking] Error captured:', eventId);
    } catch (e) {
      console.error('[ErrorTracking] Failed to send error:', e);
    }
  }

  private generateEventId(): string {
    return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/x/g, () =>
      Math.floor(Math.random() * 16).toString(16)
    );
  }

  private buildPayload(error: Error, eventId: string, extra?: Record<string, unknown>): ErrorPayload {
    return {
      event_id: eventId,
      timestamp: new Date().toISOString(),
      platform: 'javascript',
      level: 'error',
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
      extra,
      contexts: {
        browser: {
          name: this.getBrowserName(),
        },
        os: {
          name: this.getOSName(),
        },
        device: {
          screen_width: window.screen.width,
          screen_height: window.screen.height,
          viewport_width: window.innerWidth,
          viewport_height: window.innerHeight,
        },
      },
      request: {
        url: window.location.href,
        headers: {
          'User-Agent': navigator.userAgent,
        },
      },
      breadcrumbs: this.breadcrumbs.slice(-20),
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
    }).reverse();
  }

  private getBrowserName(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getOSName(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    return 'Unknown';
  }

  private async sendToSentry(payload: ErrorPayload): Promise<void> {
    if (!this.config?.dsn) return;

    const dsnMatch = this.config.dsn.match(/https:\/\/(.+?)@(.+?)\/(.+)/);
    if (!dsnMatch) return;

    const [, publicKey, host, projectId] = dsnMatch;
    const endpoint = `https://${host}/api/${projectId}/store/`;

    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_client=fyrk-web/1.0, sentry_key=${publicKey}`,
      },
      body: JSON.stringify(payload),
    });
  }
}

// Initialize error tracking
if (typeof window !== 'undefined') {
  new ClientErrorTracker();
}
