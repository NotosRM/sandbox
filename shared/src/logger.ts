import type { LogLevel } from './types';

const PREFIX = '[sandbox]';

function log(level: LogLevel, ...args: unknown[]): void {
  const timestamp = new Date().toISOString().slice(11, 23); // HH:mm:ss.mmm
  const label = `${PREFIX} ${timestamp}`;
  // oxlint-disable-next-line no-console
  console[level](label, ...args);
}

export const logger = {
  debug: (...args: unknown[]) => log('debug', ...args),
  info: (...args: unknown[]) => log('info', ...args),
  warn: (...args: unknown[]) => log('warn', ...args),
  error: (...args: unknown[]) => log('error', ...args),
} as const;
