import { createApp } from 'vue';
import App from './App.vue';

if (import.meta.env.DEV) {
  const { setupMocks } = await import('@sandbox/shared/msw');
  const { handlers } = await import('./mocks/handlers');
  await setupMocks(handlers);
}

createApp(App).mount('#app');
