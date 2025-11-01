import pino from 'pino';

/**
 * Application-wide logger instance using pino.
 * In production, logs are JSON; in development, enable pino-pretty in your process runner.
 */
export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  base: undefined,
});

export type Logger = typeof logger;

