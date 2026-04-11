# Vue Full эксперимент

## Стек

Vue 3+, TypeScript strict, Vite, Tailwind CSS 4, Storybook 8, Vitest, MSW 2, Axios

## Структура

- `src/main.ts` — точка входа Vite app (запускает MSW в DEV)
- `src/App.vue` — корневой компонент
- `src/globals.css` — Tailwind directives
- `src/components/` — компоненты эксперимента
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

## Добавление UI либы

Шаблон нейтрален. Для UI либы выбери одну и установи:

```bash
# shadcn-vue
npx shadcn-vue@latest init

# PrimeVue
pnpm add primevue @primevue/themes

# Park UI (Ark UI + Panda CSS)
pnpm add @ark-ui/vue
```

## Правила

- Алиас `@/` → `src/` (используй везде вместо относительных путей)
- Composition API + `<script setup>` — никакого Options API
- Один компонент на файл
- Stories co-located рядом с компонентом: `AppButton.stories.ts` рядом с `AppButton.vue`
- Тесты co-located: `AppButton.test.ts` рядом с компонентом
