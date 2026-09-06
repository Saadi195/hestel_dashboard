type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const configuredLevel =
  (process.env['LOG_LEVEL'] as LogLevel | undefined) ?? 'info';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[configuredLevel];
}

function formatLog(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString();
  const base = { timestamp, level: level.toUpperCase(), message };
  const log = meta ? { ...base, ...sanitizeMeta(meta) } : base;
  return JSON.stringify(log);
}

/**
 * Removes sensitive fields from log metadata.
 * Never log passwords, tokens, or secret keys.
 */
function sanitizeMeta(meta: Record<string, unknown>): Record<string, unknown> {
  const SENSITIVE_KEYS = [
    'password',
    'token',
    'secret',
    'key',
    'authorization',
    'cookie',
    'credential',
    'apiKey',
    'api_key',
  ];

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(meta)) {
    if (SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else if (value instanceof Error) {
      sanitized[key] = {
        name: value.name,
        message: value.message,
        // Only include stack in development
        ...(process.env['NODE_ENV'] === 'development' ? { stack: value.stack } : {}),
      };
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Structured logger with configurable log levels.
 *
 * Usage:
 *   logger.info('Resident created', { residentId: '123' });
 *   logger.error('Payment failed', { error, paymentId: '456' });
 *
 * Log level is controlled by the LOG_LEVEL environment variable.
 * Default: 'info'
 */
export const logger = {
  debug(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('debug')) {
      console.warn(formatLog('debug', message, meta));
    }
  },

  info(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('info')) {
      console.warn(formatLog('info', message, meta));
    }
  },

  warn(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('warn')) {
      console.warn(formatLog('warn', message, meta));
    }
  },

  error(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('error')) {
      console.error(formatLog('error', message, meta));
    }
  },
};
