# Vanilla TypeScript эксперимент

## Стек

TypeScript, без фреймворка (нет React/Vue)

## Структура

- `src/main.ts` — точка входа, прямая работа с DOM
- Тесты: `src/feature.test.ts` (co-located рядом с кодом)

## Команды

| Команда          | Описание              |
| ---------------- | --------------------- |
| `pnpm typecheck` | TypeScript проверка   |
| `pnpm test`      | Vitest в watch-режиме |
| `pnpm test:run`  | Однократный прогон    |

## Правила

- Прямая работа с DOM через `document.querySelector` и т.д.
- Не подключать React/Vue — для этого есть другие шаблоны
- Нет сборщика (Vite): файл собирается TypeScript-ом напрямую
