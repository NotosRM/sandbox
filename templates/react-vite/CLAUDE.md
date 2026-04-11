# React + Vite эксперимент

## Стек

React 19+, TypeScript, Vite, Vitest, @testing-library/react

## Структура

- `src/main.tsx` — точка входа, не трогать без необходимости
- `src/App.tsx` — корневой компонент (имеет `<main>` как корневой элемент)
- Новые компоненты: `src/ComponentName.tsx`
- Тесты: `src/ComponentName.test.tsx` (co-located рядом с компонентом)
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

- Функциональные компоненты и хуки — никаких классовых компонентов
- Один компонент на файл
- Именование: PascalCase для компонентов, camelCase для хуков и утилит
- Тесты пишутся рядом с тестируемым файлом, не в отдельной папке `__tests__`
