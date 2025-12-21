/**
 * Web Vitals Real User Monitoring (RUM)
 *
 * This script collects Core Web Vitals metrics from real users:
 * - LCP (Largest Contentful Paint): Loading performance
 * - FID (First Input Delay): Interactivity
 * - CLS (Cumulative Layout Shift): Visual stability
 * - FCP (First Contentful Paint): Initial render
 * - TTFB (Time to First Byte): Server response time
 * - INP (Interaction to Next Paint): Responsiveness
 *
 * Metrics are sent to the /api/vitals endpoint for aggregation.
 */

type MetricName = 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB' | 'INP';

interface WebVitalMetric {
  name: MetricName;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
  url: string;
  timestamp: number;
}

// Thresholds based on Google's Core Web Vitals guidelines
const THRESHOLDS: Record<MetricName, [number, number]> = {
  LCP: [2500, 4000],      // Good < 2.5s, Poor > 4s
  FID: [100, 300],        // Good < 100ms, Poor > 300ms
  CLS: [0.1, 0.25],       // Good < 0.1, Poor > 0.25
  FCP: [1800, 3000],      // Good < 1.8s, Poor > 3s
  TTFB: [800, 1800],      // Good < 800ms, Poor > 1.8s
  INP: [200, 500],        // Good < 200ms, Poor > 500ms
};

class WebVitalsMonitor {
  private metricsQueue: WebVitalMetric[] = [];
  private flushTimeout: number | null = null;
  private readonly flushInterval = 5000; // Send metrics every 5 seconds
  private readonly endpoint = '/api/vitals';

  constructor() {
    if (typeof window === 'undefined') return;

    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeFCP();
    this.observeTTFB();
    this.observeINP();

    // Flush metrics when page is hidden or unloaded
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush();
      }
    });

    // Also try to flush on beforeunload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });
  }

  private getRating(name: MetricName, value: number): 'good' | 'needs-improvement' | 'poor' {
    const [good, poor] = THRESHOLDS[name];
    if (value <= good) return 'good';
    if (value <= poor) return 'needs-improvement';
    return 'poor';
  }

  private generateId(): string {
    return `v${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private getNavigationType(): string {
    if (typeof window === 'undefined') return 'unknown';

    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return nav?.type || 'navigate';
  }

  private queueMetric(name: MetricName, value: number, delta: number = value): void {
    const metric: WebVitalMetric = {
      name,
      value: Math.round(name === 'CLS' ? value * 1000 : value), // CLS is unitless, multiply for precision
      rating: this.getRating(name, value),
      delta: Math.round(name === 'CLS' ? delta * 1000 : delta),
      id: this.generateId(),
      navigationType: this.getNavigationType(),
      url: window.location.pathname,
      timestamp: Date.now(),
    };

    this.metricsQueue.push(metric);

    // Log to console in development
    if (window.location.hostname === 'localhost') {
      console.debug(`[WebVitals] ${name}: ${value.toFixed(name === 'CLS' ? 3 : 0)} (${metric.rating})`);
    }

    // Schedule flush
    if (!this.flushTimeout) {
      this.flushTimeout = window.setTimeout(() => this.flush(), this.flushInterval);
    }
  }

  private flush(): void {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    if (this.metricsQueue.length === 0) return;

    const metrics = [...this.metricsQueue];
    this.metricsQueue = [];

    // Use sendBeacon for reliability during page unload
    const payload = JSON.stringify({ metrics });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(this.endpoint, payload);
    } else {
      // Fallback to fetch with keepalive
      fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {
        // Silently fail - metrics are best-effort
      });
    }
  }

  /**
   * Largest Contentful Paint (LCP)
   * Measures loading performance - when the largest content element becomes visible
   */
  private observeLCP(): void {
    if (!('PerformanceObserver' in window)) return;

    let lastValue = 0;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };

      if (lastEntry) {
        lastValue = lastEntry.startTime;
      }
    });

    try {
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      // LCP not supported
      return;
    }

    // Report LCP when the page becomes hidden
    const reportLCP = () => {
      if (lastValue > 0) {
        this.queueMetric('LCP', lastValue);
        observer.disconnect();
      }
    };

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        reportLCP();
      }
    }, { once: true });
  }

  /**
   * First Input Delay (FID)
   * Measures interactivity - time from first user interaction to browser response
   */
  private observeFID(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as Array<PerformanceEventTiming>;

      for (const entry of entries) {
        if (entry.processingStart) {
          const fid = entry.processingStart - entry.startTime;
          this.queueMetric('FID', fid);
          observer.disconnect();
          break;
        }
      }
    });

    try {
      observer.observe({ type: 'first-input', buffered: true });
    } catch {
      // FID not supported
    }
  }

  /**
   * Cumulative Layout Shift (CLS)
   * Measures visual stability - unexpected layout shifts during page lifetime
   */
  private observeCLS(): void {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;
    let sessionValue = 0;
    let sessionEntries: PerformanceEntry[] = [];

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & { hadRecentInput: boolean; value: number; startTime: number }>) {
        // Only count shifts without recent user input
        if (!entry.hadRecentInput) {
          const firstSessionEntry = sessionEntries[0] as PerformanceEntry & { startTime: number } | undefined;
          const lastSessionEntry = sessionEntries[sessionEntries.length - 1] as PerformanceEntry & { startTime: number } | undefined;

          // If the entry occurred less than 1 second after the previous entry
          // and less than 5 seconds after the first entry in the session
          if (
            sessionValue &&
            entry.startTime - (lastSessionEntry?.startTime ?? 0) < 1000 &&
            entry.startTime - (firstSessionEntry?.startTime ?? 0) < 5000
          ) {
            sessionValue += entry.value;
            sessionEntries.push(entry);
          } else {
            sessionValue = entry.value;
            sessionEntries = [entry];
          }

          if (sessionValue > clsValue) {
            clsValue = sessionValue;
          }
        }
      }
    });

    try {
      observer.observe({ type: 'layout-shift', buffered: true });
    } catch {
      // CLS not supported
      return;
    }

    // Report CLS when page becomes hidden
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && clsValue > 0) {
        this.queueMetric('CLS', clsValue);
        observer.disconnect();
      }
    }, { once: true });
  }

  /**
   * First Contentful Paint (FCP)
   * Measures when the first content is painted to the screen
   */
  private observeFCP(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      for (const entry of entries) {
        if (entry.name === 'first-contentful-paint') {
          this.queueMetric('FCP', entry.startTime);
          observer.disconnect();
          break;
        }
      }
    });

    try {
      observer.observe({ type: 'paint', buffered: true });
    } catch {
      // FCP not supported
    }
  }

  /**
   * Time to First Byte (TTFB)
   * Measures server response time
   */
  private observeTTFB(): void {
    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    const navEntry = navEntries[0];

    if (navEntry) {
      const ttfb = navEntry.responseStart - navEntry.requestStart;
      if (ttfb > 0) {
        this.queueMetric('TTFB', ttfb);
      }
    }
  }

  /**
   * Interaction to Next Paint (INP)
   * Measures responsiveness to user interactions
   */
  private observeINP(): void {
    if (!('PerformanceObserver' in window)) return;

    const interactions: number[] = [];
    let maxINP = 0;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as Array<PerformanceEventTiming>;

      for (const entry of entries) {
        if (entry.interactionId) {
          const duration = entry.duration;
          interactions.push(duration);

          // INP is the 98th percentile of interactions
          if (interactions.length > 0) {
            const sorted = [...interactions].sort((a, b) => a - b);
            const p98Index = Math.floor(sorted.length * 0.98);
            const inp = sorted[Math.min(p98Index, sorted.length - 1)];

            if (inp > maxINP) {
              maxINP = inp;
            }
          }
        }
      }
    });

    try {
      observer.observe({ type: 'event', buffered: true, durationThreshold: 40 });
    } catch {
      // INP not supported
      return;
    }

    // Report INP when page becomes hidden
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && maxINP > 0) {
        this.queueMetric('INP', maxINP);
        observer.disconnect();
      }
    }, { once: true });
  }
}

// Type declarations for PerformanceEventTiming
interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
  interactionId?: number;
}

// Initialize monitoring
if (typeof window !== 'undefined') {
  // Wait for page to be interactive
  if (document.readyState === 'complete') {
    new WebVitalsMonitor();
  } else {
    window.addEventListener('load', () => {
      new WebVitalsMonitor();
    });
  }
}
