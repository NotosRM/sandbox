import { Profiler, type ReactNode } from 'react';
import type { ProfilerOnRenderCallback } from 'react';

interface RenderEntry {
  phase: 'mount' | 'update' | 'nested-update';
  actualDuration: number;
  baseDuration: number;
}

const renderLog: Record<string, RenderEntry[]> = {};

const onRender: ProfilerOnRenderCallback = (id, phase, actualDuration, baseDuration) => {
  if (!renderLog[id]) renderLog[id] = [];
  renderLog[id].push({ phase, actualDuration, baseDuration });
};

/**
 * Компонент-обёртка над React.Profiler.
 * После отображения в DevTools — при размонтировании — выводит сводку в console.table.
 *
 * @example
 * <Profiled id="counter-list">
 *   <CounterList items={items} />
 * </Profiled>
 */
export function Profiled({ id, children }: { id: string; children: ReactNode }) {
  return (
    <Profiler id={id} onRender={onRender}>
      {children}
    </Profiler>
  );
}

/**
 * Выводит накопленную статистику рендеров для заданного id в console.table.
 * Вызывать вручную (например, в useEffect cleanup или через DevTools console).
 */
export function printRenderStats(id: string) {
  const entries = renderLog[id];
  if (!entries || entries.length === 0) {
    console.log(`[Profiled] No render data for id="${id}"`);
    return;
  }
  const durations = entries.map((e) => e.actualDuration);
  const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
  const min = Math.min(...durations);
  const max = Math.max(...durations);
  console.group(`[Profiled] Render stats: ${id}`);
  console.table({
    renders: entries.length,
    'avg ms': avg.toFixed(2),
    'min ms': min.toFixed(2),
    'max ms': max.toFixed(2),
  });
  console.groupEnd();
}
