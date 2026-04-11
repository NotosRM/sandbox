# Vue + Vite эксперимент

## Стек

Vue 3, TypeScript, Vite, Vitest

## Структура

- `src/main.ts` — точка входа
- `src/App.vue` — корневой компонент
- Новые компоненты: `src/ComponentName.vue`
- Тесты: `src/ComponentName.test.ts` (co-located рядом с компонентом)
- E2E (если нужны): `e2e/*.spec.ts` + `playwright.config.ts`

## Команды

| Команда         | Описание                                 |
| --------------- | ---------------------------------------- |
| `pnpm dev`      | Dev-сервер на порту 5173                 |
| `pnpm test`     | Vitest в watch-режиме                    |
| `pnpm test:run` | Однократный прогон                       |
| `pnpm test:e2e` | Playwright E2E (только если есть `e2e/`) |
| `pnpm build`    | Production-сборка                        |

## Правила

- Composition API (`<script setup>`) — не Options API
- Один компонент на файл
- Именование: PascalCase для компонентов, camelCase для composables
- Тесты co-located рядом с компонентом
- Когда добавишь `@testing-library/vue` — можно использовать `render` из него
