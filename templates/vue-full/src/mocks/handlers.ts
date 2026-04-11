import { http, HttpResponse } from 'msw';

export interface Post {
  id: number;
  title: string;
  body: string;
}

const posts: Post[] = [
  { id: 1, title: 'Hello MSW', body: 'This response is intercepted by Mock Service Worker.' },
  { id: 2, title: 'Axios + MSW', body: 'Axios requests are mocked at the network level.' },
  { id: 3, title: 'Same handlers everywhere', body: 'Works in browser dev server and in Vitest.' },
];

export type ApiMode = 'success' | 'error';

export function createHandlers(mode: ApiMode = 'success') {
  return [
    http.get('/api/posts', () => {
      if (mode === 'error') {
        return HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 });
      }
      return HttpResponse.json(posts);
    }),
  ];
}

export const handlers = createHandlers('success');
