import { setupServer } from 'msw/node';
import type { RequestHandler } from 'msw';

export function createServer(...handlers: RequestHandler[]) {
  return setupServer(...handlers);
}
