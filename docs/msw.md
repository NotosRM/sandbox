# MSW в темплейтах react-full и vue-full

## Как это работает

MSW перехватывает HTTP-запросы **на уровне сети** — без патча `fetch`/`axios`, без `vi.mock`. Один набор handlers работает везде:

| Контекст    | Механизм                    |
| ----------- | --------------------------- |
| `pnpm dev`  | Service Worker в браузере   |
| `pnpm test` | Node interceptor (msw/node) |

Инфраструктура (`setupMocks`, `createServer`) живёт в `@sandbox/shared/msw`. В каждом эксперименте — только `src/mocks/handlers.ts` со своими endpoint'ами.

## Структура

```
experiments/my-experiment/
├── public/
│   └── mockServiceWorker.js   # копируется автоматически при pnpm run create
├── src/
│   ├── main.tsx / main.ts     # await setupMocks(handlers) — только в DEV
│   └── mocks/
│       └── handlers.ts        # createHandlers('success' | 'error')
```

## Создание эксперимента

```bash
pnpm run create -- --template react-full --name my-experiment
pnpm install
cd experiments/my-experiment && pnpm dev
```

`mockServiceWorker.js` копируется в `public/` **автоматически** скриптом `create`. Ничего дополнительного делать не нужно.

## Добавление handlers

Редактируй `src/mocks/handlers.ts` в эксперименте:

```typescript
import { http, HttpResponse } from 'msw';

export function createHandlers(mode: 'success' | 'error' = 'success') {
  return [
    http.get('/api/users', () => {
      if (mode === 'error') {
        return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
      }
      return HttpResponse.json([{ id: 1, name: 'Alice' }]);
    }),
  ];
}

export const handlers = createHandlers('success');
```

## Использование в тестах

```typescript
import { createServer } from '@sandbox/shared/msw/node';
import { createHandlers } from '@/mocks/handlers';

describe('MyComponent', () => {
  const server = createServer(...createHandlers('success'));

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('renders data', async () => {
    /* ... */
  });
});

describe('MyComponent error state', () => {
  const server = createServer(...createHandlers('error'));
  // ...
});
```

## Симуляция сетевых сценариев

```typescript
import { http, HttpResponse } from 'msw';

// Задержка
http.get('/api/slow', async () => {
  await new Promise((r) => setTimeout(r, 2000));
  return HttpResponse.json({ ok: true });
});

// Network failure
http.get('/api/offline', () => HttpResponse.error());

// Пустой список
http.get('/api/empty', () => HttpResponse.json([]));
```

## Если MSW не перехватывает запросы

1. Проверь браузерную консоль — должна быть строка `[MSW] Mocking enabled`
2. Убедись что `public/mockServiceWorker.js` существует в эксперименте
3. Если файла нет — запусти вручную: `npx msw init public/` из директории эксперимента
