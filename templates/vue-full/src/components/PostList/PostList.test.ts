import { render, screen, waitFor } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { createServer } from '@sandbox/shared/msw/node';
import { createHandlers } from '@/mocks/handlers';
import PostList from './PostList.vue';

describe('PostList', () => {
  describe('success', () => {
    const server = createServer(...createHandlers('success'));

    beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
    afterEach(() => server.resetHandlers());
    afterAll(() => server.close());

    it('fetches and renders posts', async () => {
      const user = userEvent.setup();
      render(PostList);

      await user.click(screen.getByRole('button', { name: /fetch posts/i }));

      await waitFor(() => {
        expect(screen.getByText('Hello MSW')).toBeInTheDocument();
      });

      expect(screen.getByText('Axios + MSW')).toBeInTheDocument();
      expect(screen.getByText('Same handlers everywhere')).toBeInTheDocument();
    });
  });

  describe('error', () => {
    const server = createServer(...createHandlers('error'));

    beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
    afterEach(() => server.resetHandlers());
    afterAll(() => server.close());

    it('shows error message when API fails', async () => {
      const user = userEvent.setup();
      render(PostList);

      await user.click(screen.getByRole('button', { name: /fetch posts/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      expect(screen.getByRole('alert')).toHaveTextContent('Internal Server Error');
    });
  });
});
