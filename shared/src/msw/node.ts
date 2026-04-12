import { setupServer } from 'msw/node';
import type { RequestHandler } from 'msw';

// Track all active servers so a newly-started server can take priority
// by pausing previously active servers.
const activeServers: Set<ReturnType<typeof setupServer>> = new Set();

export function createServer(...handlers: RequestHandler[]) {
  const inner = setupServer(...handlers);

  return {
    listen(options?: Parameters<typeof inner.listen>[0]) {
      // Pause all currently active servers so this one takes priority
      for (const s of activeServers) {
        s.close();
      }
      activeServers.add(inner);
      inner.listen(options);
    },
    close() {
      inner.close();
      activeServers.delete(inner);
      // Restore other active servers
      for (const s of activeServers) {
        s.listen({ onUnhandledRequest: 'bypass' });
      }
    },
    resetHandlers(...overrides: RequestHandler[]) {
      inner.resetHandlers(...overrides);
    },
    use(...overrides: RequestHandler[]) {
      inner.use(...overrides);
    },
  };
}
