/**
 * Structured logging utility
 *
 * Provides consistent JSON-formatted logs with context metadata.
 * Designed for production observability without logging sensitive data.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  requestId?: string;
  tool?: string;
  action?: string;
  durationMs?: number;
  statusCode?: number;
  cached?: boolean;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
}

/**
 * Format a log entry as JSON
 */
function formatLog(level: LogLevel, message: string, context?: LogContext): string {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };

  if (context && Object.keys(context).length > 0) {
    // Filter out undefined values
    entry.context = Object.fromEntries(
      Object.entries(context).filter(([, v]) => v !== undefined)
    ) as LogContext;
  }

  return JSON.stringify(entry);
}

/**
 * Structured logger instance
 */
export const logger = {
  debug(message: string, context?: LogContext): void {
    if (import.meta.env.DEV) {
      console.debug(formatLog('debug', message, context));
    }
  },

  info(message: string, context?: LogContext): void {
    console.info(formatLog('info', message, context));
  },

  warn(message: string, context?: LogContext): void {
    console.warn(formatLog('warn', message, context));
  },

  error(message: string, context?: LogContext): void {
    console.error(formatLog('error', message, context));
  },
};

/**
 * Create a logger with preset context (e.g., requestId, tool)
 */
export function createContextLogger(baseContext: LogContext) {
  return {
    debug(message: string, context?: LogContext): void {
      logger.debug(message, { ...baseContext, ...context });
    },
    info(message: string, context?: LogContext): void {
      logger.info(message, { ...baseContext, ...context });
    },
    warn(message: string, context?: LogContext): void {
      logger.warn(message, { ...baseContext, ...context });
    },
    error(message: string, context?: LogContext): void {
      logger.error(message, { ...baseContext, ...context });
    },
  };
}
