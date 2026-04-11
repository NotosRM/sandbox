import type { MeasureResult, Ms } from './types';

/**
 * Замеряет время выполнения синхронной функции.
 * Использование: const result = measure('sort', () => arr.sort());
 */
export function measure<T>(label: string, fn: () => T): { value: T; result: MeasureResult } {
  const start: Ms = performance.now();
  const value = fn();
  const durationMs: Ms = performance.now() - start;
  return { value, result: { label, durationMs } };
}

/**
 * Замеряет время выполнения асинхронной функции.
 */
export async function measureAsync<T>(
  label: string,
  fn: () => Promise<T>
): Promise<{ value: T; result: MeasureResult }> {
  const start: Ms = performance.now();
  const value = await fn();
  const durationMs: Ms = performance.now() - start;
  return { value, result: { label, durationMs } };
}
