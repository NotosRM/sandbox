# React Full эксперимент

## Стек

React 19+, TypeScript strict, Vite, Tailwind CSS 4, shadcn/ui, Storybook 8, Vitest, MSW 2, Axios

## Структура

- `src/main.tsx` — точка входа Vite app (запускает MSW в DEV)
- `src/App.tsx` — корневой компонент
- `src/globals.css` — Tailwind + CSS-переменные shadcn
- `src/lib/utils.ts` — утилита `cn()` (clsx + tailwind-merge)
- `src/components/ui/` — shadcn компоненты (твой код, редактируй свободно)
- `src/mocks/handlers.ts` — MSW handlers для эксперимента
- `.storybook/` — конфиг Storybook, не трогать без необходимости

## MSW

MSW-инфраструктура (`setupMocks`, `createServer`) живёт в `@sandbox/shared/msw`. В `src/mocks/handlers.ts` — только handlers этого эксперимента.

В браузере MSW запускается автоматически в DEV-режиме. В тестах:

```typescript
import { createServer } from '@sandbox/shared/msw/node';
import { createHandlers } from '@/mocks/handlers';

const server = createServer(...createHandlers('success'));
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

Функция `createHandlers(mode)` принимает `'success'` или `'error'` — используй в тестах для проверки обоих состояний.

## Команды

| Команда                | Описание                      |
| ---------------------- | ----------------------------- |
| `pnpm dev`             | Vite dev-сервер на порту 5173 |
| `pnpm storybook`       | Storybook на порту 6006       |
| `pnpm build`           | Production-сборка Vite app    |
| `pnpm build-storybook` | Собрать статический Storybook |
| `pnpm test`            | Vitest в watch-режиме         |
| `pnpm test:run`        | Однократный прогон тестов     |

## Добавление shadcn компонентов

```bash
npx shadcn@latest add <component>
# например: npx shadcn@latest add card input badge
```

Компоненты появятся в `src/components/ui/` — это твой код.

## Правила

- Алиас `@/` → `src/` (используй везде вместо относительных путей)
- Функциональные компоненты и хуки — никаких классовых компонентов
- Один компонент на файл
- Stories co-located рядом с компонентом: `Button.stories.tsx` рядом с `button.tsx`
- Тесты co-located: `Button.test.tsx` рядом с компонентом
