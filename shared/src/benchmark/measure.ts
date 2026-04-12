import type { MeasureResult, Ms } from '../types';

/**
 * Замеряет время выполнения синхронной функции через performance.mark/measure.
 * @example const { value, result } = measure('sort', () => arr.sort());
 */
export function measure<T>(label: string, fn: () => T): { value: T; result: MeasureResult } {
  const startMark = `${label}:start`;
  const endMark = `${label}:end`;
  performance.mark(startMark);
  const value = fn();
  performance.mark(endMark);
  performance.measure(label, startMark, endMark);
  const entry = performance.getEntriesByName(label).pop();
  const durationMs: Ms = entry?.duration ?? 0;
  return { value, result: { label, durationMs } };
}

/**
 * Замеряет время выполнения асинхронной функции.
 */
export async function measureAsync<T>(
  label: string,
  fn: () => Promise<T>
): Promise<{ value: T; result: MeasureResult }> {
  const startMark = `${label}:start`;
  const endMark = `${label}:end`;
  performance.mark(startMark);
  const value = await fn();
  performance.mark(endMark);
  performance.measure(label, startMark, endMark);
  const entry = performance.getEntriesByName(label).pop();
  const durationMs: Ms = entry?.duration ?? 0;
  return { value, result: { label, durationMs } };
}

/**
 * Запускает `fn` `iterations` раз и возвращает статистику (среднее, мин, макс).
 */
export function measureIterations(
  label: string,
  fn: () => void,
  iterations = 100
): { avg: Ms; min: Ms; max: Ms } {
  const times: Ms[] = [];
  for (let i = 0; i < iterations; i++) {
    const start: Ms = performance.now();
    fn();
    times.push(performance.now() - start);
  }
  const min = Math.min(...times) as Ms;
  const max = Math.max(...times) as Ms;
  const avg = (times.reduce((a, b) => a + b, 0) / times.length) as Ms;
  console.table({
    label,
    iterations,
    avg: avg.toFixed(3),
    min: min.toFixed(3),
    max: max.toFixed(3),
  });
  return { avg, min, max };
}
