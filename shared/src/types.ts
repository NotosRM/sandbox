/** Маркер времени в миллисекундах */
export type Ms = number;

/** Общий результат замера */
export interface MeasureResult {
  label: string;
  durationMs: Ms;
}

/** Уровни логирования */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
