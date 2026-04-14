import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { context, clearStack } from '@reatom/core';
import { reatomContext } from '@reatom/react';

clearStack(); // отключаем дефолтный неявный контекст для тестов

type Frame = ReturnType<typeof context.start>;

interface RenderResult extends ReturnType<typeof render> {
  frame: Frame;
}

interface Options extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  routePath?: string;
}

export function renderWithReatom(
  ui: React.ReactElement,
  { route = '/', routePath, ...options }: Options = {}
): RenderResult {
  const frame = context.start();
  const content = routePath ? (
    <Routes>
      <Route path={routePath} element={ui} />
    </Routes>
  ) : (
    ui
  );
  const result = render(
    <reatomContext.Provider value={frame}>
      <MemoryRouter initialEntries={[route]}>{content}</MemoryRouter>
    </reatomContext.Provider>,
    options
  );
  return { ...result, frame };
}
