import { isProduction } from './config';

/**
 * Minimal structured logger — console-backed shim with pino's call shape
 * (`logger.info(mergeObj?, message)`). The upstream project used pino; this port
 * drops that dependency and keeps the same API so no call site changes. Never
 * log secrets, cookies, or session tokens.
 */
type Level = 'debug' | 'info' | 'warn' | 'error';

function emit(level: Level, a?: unknown, b?: string): void {
  if (level === 'debug' && isProduction) return;
  const [obj, msg] = typeof a === 'string' ? [undefined, a] : [a, b];
  const line = `[${level}]${msg ? ' ' + msg : ''}`;
  const sink = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  if (obj !== undefined) sink(line, obj);
  else sink(line);
}

export const logger = {
  debug: (a?: unknown, b?: string) => emit('debug', a, b),
  info: (a?: unknown, b?: string) => emit('info', a, b),
  warn: (a?: unknown, b?: string) => emit('warn', a, b),
  error: (a?: unknown, b?: string) => emit('error', a, b),
};

export type Logger = typeof logger;
