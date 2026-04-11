# Frontend Sandbox

Монорепо-песочница для фронтенд-экспериментов.

## Быстрый старт

```bash
pnpm install
pnpm run create -- --template react-vite --name my-experiment
cd experiments/my-experiment && pnpm dev
```

## Команды

| Команда                                             | Описание                                |
| --------------------------------------------------- | --------------------------------------- |
| `pnpm run create -- --template <tpl> --name <name>` | Создать эксперимент                     |
| `pnpm run list`                                     | Список всех экспериментов               |
| `pnpm run clean <name>`                             | Удалить dist/.vite эксперимента         |
| `pnpm run clean --all`                              | Очистить все эксперименты               |
| `pnpm run clean --full`                             | Удалить node_modules + pnpm store prune |
| `pnpm run lint`                                     | Запустить oxlint                        |
| `pnpm run format`                                   | Prettier                                |
| `pnpm run typecheck`                                | TypeScript check (корень)               |

## Шаблоны

| Шаблон         | Стек                         |
| -------------- | ---------------------------- |
| `react-vite`   | React 19 + Vite + TypeScript |
| `vue-vite`     | Vue 3 + Vite + TypeScript    |
| `custom-build` | TypeScript, без сборщика     |

## Структура

```
experiments/   — все эксперименты (pnpm workspace)
templates/     — шаблоны (не воркспейсы, только копируются)
shared/        — @sandbox/shared: переиспользуемые утилиты
scripts/       — CLI (create / list / clean)
```

## Использование shared

```jsonc
// в experiments/<name>/package.json
"dependencies": {
  "@sandbox/shared": "workspace:*"
}
```

```ts
import { measure, logger } from '@sandbox/shared';
```
