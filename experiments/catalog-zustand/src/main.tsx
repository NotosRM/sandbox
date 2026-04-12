import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './globals.css';
import App from './App.tsx';

if (import.meta.env.DEV) {
  const { setupMocks } = await import('@sandbox/shared/msw');
  const { handlers } = await import('./mocks/handlers');
  await setupMocks(handlers);
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
