/**
 * AppLogger — Centralized structured logging utility for HobbyMobile.
 *
 * Usage:
 *   import { logger } from '../utils/logger';
 *   logger.info('DB', 'Habits loaded', { count: 5 });
 *   logger.error('Auth', 'Login failed', error);
 *
 * In production builds (NODE_ENV === 'production'), all logs are silenced.
 * Logs include: [LEVEL] [TAG] message + optional payload.
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const IS_DEV = __DEV__;

const COLORS: Record<LogLevel, string> = {
  DEBUG: '#94A3B8', // slate
  INFO:  '#0D9488', // teal
  WARN:  '#F97316', // orange
  ERROR: '#EF4444', // red
};

const formatTimestamp = () => {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
};

const log = (level: LogLevel, tag: string, message: string, payload?: unknown) => {
  if (!IS_DEV) return;

  const ts = formatTimestamp();
  const prefix = `[${ts}] [${level}] [${tag}]`;

  switch (level) {
    case 'DEBUG':
      if (payload !== undefined) {
        console.log(`${prefix} ${message}`, payload);
      } else {
        console.log(`${prefix} ${message}`);
      }
      break;
    case 'INFO':
      if (payload !== undefined) {
        console.info(`${prefix} ${message}`, payload);
      } else {
        console.info(`${prefix} ${message}`);
      }
      break;
    case 'WARN':
      if (payload !== undefined) {
        console.warn(`${prefix} ${message}`, payload);
      } else {
        console.warn(`${prefix} ${message}`);
      }
      break;
    case 'ERROR':
      if (payload !== undefined) {
        console.error(`${prefix} ${message}`, payload);
      } else {
        console.error(`${prefix} ${message}`);
      }
      break;
  }
};

export const logger = {
  debug: (tag: string, message: string, payload?: unknown) =>
    log('DEBUG', tag, message, payload),

  info: (tag: string, message: string, payload?: unknown) =>
    log('INFO', tag, message, payload),

  warn: (tag: string, message: string, payload?: unknown) =>
    log('WARN', tag, message, payload),

  error: (tag: string, message: string, payload?: unknown) =>
    log('ERROR', tag, message, payload),
};

export default logger;
