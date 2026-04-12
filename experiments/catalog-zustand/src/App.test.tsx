import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createServer } from '@sandbox/shared/msw/node';
import { createHandlers } from '@/mocks/handlers';
import App from './App';

const server = createServer(...createHandlers('success'));
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('App', () => {
  it('renders the Catalog header', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByRole('link', { name: 'Catalog' })).toBeInTheDocument());
  });

  it('renders Cart link in header', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByRole('link', { name: 'Cart' })).toBeInTheDocument());
  });
});
