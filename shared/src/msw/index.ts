import type { RequestHandler } from 'msw';
import { createWorker } from './browser';

/**
 * Инициализирует MSW Service Worker в браузере.
 * Вызывать в main.tsx/main.ts только в DEV-режиме.
 *
 * @example
 * if (import.meta.env.DEV) {
 *   await setupMocks(handlers);
 * }
 */
export async function setupMocks(handlers: RequestHandler[]): Promise<void> {
  const worker = createWorker(...handlers);
  await worker.start({ onUnhandledRequest: 'warn' });
}

export type { RequestHandler };
