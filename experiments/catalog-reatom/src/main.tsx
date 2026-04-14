import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { context, clearStack, connectLogger } from '@reatom/core';
import { reatomContext } from '@reatom/react';
import './globals.css';
import App from './App';

clearStack(); // отключаем дефолтный неявный стек контекста
const rootFrame = context.start();

if (import.meta.env.DEV) {
  rootFrame.run(connectLogger);
}

if (import.meta.env.DEV) {
  const { setupMocks } = await import('@sandbox/shared/msw');
  const { handlers } = await import('./mocks/handlers');
  await setupMocks(handlers);
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <reatomContext.Provider value={rootFrame}>
      <App />
    </reatomContext.Provider>
  </StrictMode>
);
