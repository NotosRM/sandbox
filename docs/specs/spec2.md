# Frontend Sandbox — Дополнение: Тестирование + AI-ready

Это дополнение к основной спецификации `frontend-sandbox-spec.md`. Описывает два слоя: тестовую инфраструктуру и интеграцию с Claude Code.

---

## Часть 1: Тестирование

### Стратегия

Песочница — не продакшен. Тесты здесь для двух целей:

- Зафиксировать поведение фичи, чтобы вернуться через месяцы и понять, что работает
- Сравнить технологии в равных условиях (одинаковый тест, разные реализации)

Полный coverage не нужен. Тесты пишутся на то, что важно проверить.

### Инструменты

#### Unit / Integration — Vitest

- Vitest как единый тест-раннер для всех экспериментов
- Переиспользует `vite.config.ts` эксперимента — не нужен отдельный конфиг для сборки тестов
- Watch-режим по умолчанию при `pnpm test`

#### E2E — Playwright

- Для экспериментов, где важно поведение в реальном браузере: offline-режим, Service Workers, анимации, intersection observers, визуальное тестирование
- Не включён в шаблоны по умолчанию — добавляется в конкретный эксперимент по необходимости

### Зависимости в корневом package.json

```jsonc
{
  "devDependencies": {
    // ... существующие зависимости из основной спеки ...

    // Unit / Integration
    "vitest": "^3.x",
    "jsdom": "^26.x",
    "@testing-library/react": "^16.x",
    "@testing-library/jest-dom": "^6.x",
    "@testing-library/vue": "^8.x", // добавить когда дойдёшь до Vue

    // E2E
    "playwright": "^1.x",
    "@playwright/test": "^1.x",
  },
}
```

> После первого `pnpm install` нужно установить браузеры: `pnpm exec playwright install --with-deps chromium`. Достаточно одного Chromium — для песочницы кроссбраузерность не нужна.

### Расположение тестов

Тесты лежат рядом с кодом, который тестируют (co-located):

```
experiments/zustand-counter/
├── src/
│   ├── Counter.tsx
│   ├── Counter.test.tsx          # unit-тест компонента
│   ├── store.ts
│   ├── store.test.ts             # unit-тест стора
│   └── main.tsx
├── e2e/                          # E2E-тесты (только если нужны)
│   ├── counter.spec.ts
│   └── ...
├── vitest.config.ts
├── playwright.config.ts          # только если есть e2e/
├── package.json
└── README.md
```

Конвенция именования:

- Unit/integration: `*.test.ts` или `*.test.tsx`
- E2E: `e2e/*.spec.ts`

### Конфигурация Vitest

#### Базовый конфиг в корне: `vitest.workspace.ts`

```typescript
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace(['experiments/*/vitest.config.ts']);
```

Это позволяет запускать тесты всех экспериментов одной командой из корня: `pnpm test`.

#### Конфиг в шаблоне `react-vite`: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
```

#### Setup-файл в шаблоне `react-vite`: `src/test-setup.ts`

```typescript
import '@testing-library/jest-dom/vitest';
```

Подключает матчеры вроде `toBeInTheDocument()`, `toHaveTextContent()` и т.д.

#### Конфиг в шаблоне `vanilla`: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts'],
  },
});
```

### Конфигурация Playwright

Playwright НЕ включён в шаблоны. Добавляется в эксперимент вручную или через Claude Code команду `/experiment:add-e2e`.

#### Типовой `playwright.config.ts` для эксперимента:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  webServer: {
    command: 'pnpm dev',
    port: 5173,
    reuseExistingServer: true,
  },
  use: {
    baseURL: 'http://localhost:5173',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
```

### Скрипты в шаблонных `package.json.tpl`

```jsonc
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run",
    "test:e2e": "playwright test", // добавляется только при наличии e2e/
  },
}
```

- `pnpm test` — watch-режим, удобно при разработке
- `pnpm test:run` — однократный прогон (для CI или итоговой проверки)
- `pnpm test:e2e` — E2E-тесты

### Пример теста в шаблоне `react-vite`

Файл `src/App.test.tsx` — включён в шаблон, чтобы `pnpm test` работал сразу:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
```

### Пример теста в шаблоне `vanilla`

Файл `src/main.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

describe('sandbox', () => {
  it('works', () => {
    expect(true).toBe(true);
  });
});
```

### Пошаговый сценарий: «сделал фичу, хочу тесты»

1. Фича уже реализована в `experiments/my-experiment/src/`
2. Создаёшь `src/MyFeature.test.tsx` рядом с компонентом
3. Запускаешь `pnpm test` — Vitest поднимается в watch-режиме
4. Пишешь тесты, видишь результат мгновенно при сохранении
5. Когда доволен — `pnpm test:run` для финального прогона
6. Если нужен браузер (offline, SW, визуал):
   - Создаёшь папку `e2e/` и `playwright.config.ts`
   - Пишешь `e2e/my-feature.spec.ts`
   - Запускаешь `pnpm test:e2e`

### Корневые скрипты для тестов

Добавить в корневой `package.json`:

```jsonc
{
  "scripts": {
    // ... существующие ...
    "test": "vitest",
    "test:run": "vitest run",
  },
}
```

Из корня `pnpm test` запустит тесты всех экспериментов через `vitest.workspace.ts`.

---

## Часть 2: AI-ready слой (Claude Code)

### Файловая структура

```
frontend-sandbox/
├── CLAUDE.md                         # Корневой контекст для Claude Code
├── .claude/
│   └── commands/
│       ├── experiment-create.md      # /experiment:create
│       ├── experiment-compare.md     # /experiment:compare
│       ├── experiment-summarize.md   # /experiment:summarize
│       ├── experiment-add-e2e.md     # /experiment:add-e2e
│       └── experiment-archive.md     # /experiment:archive
├── templates/
│   ├── react-vite/
│   │   ├── CLAUDE.md                 # Контекст для React-экспериментов
│   │   └── ...
│   ├── vanilla/
│   │   ├── CLAUDE.md                 # Контекст для vanilla-экспериментов
│   │   └── ...
│   ├── custom-build/
│   │   ├── CLAUDE.md
│   │   └── ...
│   └── vue-vite/
│       ├── CLAUDE.md
│       └── ...
└── ...
```

### Корневой `CLAUDE.md`

Содержание (конспект — точные формулировки определяются при реализации):

```markdown
# Frontend Sandbox

Монорепо-песочница для фронтенд-экспериментов. pnpm workspaces.

## Структура

- `templates/` — шаблоны для новых экспериментов (не воркспейсы, не устанавливаются)
- `experiments/` — все эксперименты (каждый — отдельный pnpm workspace)
- `shared/` — переиспользуемые утилиты (`@sandbox/shared`)
- `scripts/` — CLI: create, list, clean

## Создание эксперимента

`pnpm run create -- --template <шаблон> --name <имя>`
Доступные шаблоны: react-vite, vanilla, custom-build, vue-vite

## Конвенции

- Имена: kebab-case
- Сравнения: `<tech1>-vs-<tech2>`
- Тесты: co-located, `*.test.ts(x)` рядом с кодом
- E2E: в `e2e/*.spec.ts`, только по необходимости
- Каждый эксперимент имеет README.md с полями: шаблон, дата, статус, цель, выводы

## Стек

- TypeScript strict
- Oxlint (линтинг)
- Prettier (форматирование)
- Vitest (тесты)
- Playwright (E2E)

## Правила

- Не модифицируй файлы в `templates/` без явного запроса
- Не выноси код в `shared/` пока он не используется в 3+ экспериментах
- Каждый эксперимент должен запускаться независимо через `pnpm dev`
- После создания эксперимента всегда запускай `pnpm install`
```

### `CLAUDE.md` в шаблоне `react-vite`

```markdown
# React + Vite эксперимент

## Стек

React 19+, TypeScript, Vite

## Структура

- `src/main.tsx` — точка входа, не трогать без необходимости
- `src/App.tsx` — корневой компонент
- Новые компоненты: `src/ComponentName.tsx`
- Тесты: `src/ComponentName.test.tsx` (рядом с компонентом)

## Команды

- `pnpm dev` — dev-сервер
- `pnpm test` — vitest в watch-режиме
- `pnpm test:run` — однократный прогон
- `pnpm build` — production-сборка

## Правила

- Функциональные компоненты, хуки
- Один компонент на файл
- Именование: PascalCase для компонентов, camelCase для хуков и утилит
```

### `CLAUDE.md` в шаблоне `vanilla`

```markdown
# Vanilla TypeScript эксперимент

## Стек

TypeScript, Vite (без фреймворка)

## Структура

- `src/main.ts` — точка входа
- `index.html` — HTML-шаблон с `<div id="app">`

## Команды

- `pnpm dev` — dev-сервер
- `pnpm test` — vitest в watch-режиме
- `pnpm build` — production-сборка

## Правила

- Прямая работа с DOM через `document.querySelector` и т.д.
- Не подключать React/Vue — для этого есть другие шаблоны
```

### Кастомные команды Claude Code

#### `.claude/commands/experiment-create.md`

```markdown
Создай новый эксперимент в песочнице.

Параметры: $ARGUMENTS

Шаги:

1. Разбери аргументы: ожидается шаблон и имя. Например: "react-vite auth-form"
2. Выполни `pnpm run create -- --template <шаблон> --name <имя>`
3. Если указаны зависимости, установи их: `cd experiments/<имя> && pnpm add <зависимости>`
4. Обнови README.md эксперимента: заполни секцию "Цель" на основе имени и контекста
5. Выведи: что создано, как запустить, какие зависимости установлены
```

#### `.claude/commands/experiment-compare.md`

```markdown
Создай два эксперимента для сравнения технологий.

Параметры: $ARGUMENTS
Ожидается: "<tech1> vs <tech2>" и опционально шаблон и сценарий.
Пример: "zustand vs reatom react-vite counter with increment/decrement"

Шаги:

1. Разбери аргументы: определи две технологии, шаблон (по умолчанию react-vite), сценарий
2. Создай эксперимент `<tech1>-vs-<tech2>-a` из указанного шаблона
3. Создай эксперимент `<tech1>-vs-<tech2>-b` из того же шаблона
4. В первом установи <tech1>, во втором <tech2>
5. Реализуй одинаковый сценарий в обоих экспериментах
6. Напиши одинаковые тесты в обоих, проверяющие поведение сценария
7. Обнови README обоих экспериментов: цель, какая технология, что сравниваем
8. Выведи: как запустить оба, как прогнать тесты, на что обратить внимание при сравнении
```

#### `.claude/commands/experiment-add-e2e.md`

```markdown
Добавь E2E-тесты (Playwright) в существующий эксперимент.

Параметры: $ARGUMENTS
Ожидается: имя эксперимента и опционально что тестировать.

Шаги:

1. Проверь, что эксперимент существует в `experiments/`
2. Создай папку `e2e/` в эксперименте
3. Создай `playwright.config.ts` с настройками:
   - testDir: './e2e'
   - webServer: command 'pnpm dev', автоопределение порта
   - Только chromium
4. Добавь скрипт `"test:e2e": "playwright test"` в package.json эксперимента
5. Создай базовый E2E-тест `e2e/basic.spec.ts` — проверяет, что приложение загружается
6. Если указан сценарий — напиши тест под него
7. Проверь, что `pnpm test:e2e` проходит
```

#### `.claude/commands/experiment-summarize.md`

```markdown
Сделай сводку по всем экспериментам в песочнице.

Шаги:

1. Прочитай все `experiments/*/README.md` и `experiments/*/package.json`
2. Для каждого эксперимента собери: имя, шаблон, статус, цель, зависимости, наличие тестов
3. Сгруппируй по статусу: in-progress, done, archived
4. Выведи таблицу с колонками: имя, шаблон, статус, цель (кратко), кол-во тестов
5. Если есть эксперименты без заполненных выводов в README — укажи на это
```

#### `.claude/commands/experiment-archive.md`

```markdown
Архивируй эксперимент — он больше не актуален или завершён.

Параметры: $ARGUMENTS
Ожидается: имя эксперимента.

Шаги:

1. Проверь, что эксперимент существует
2. Прочитай текущий код и тесты эксперимента
3. Обнови README.md:
   - Статус: done или archived (спроси если не очевидно)
   - Заполни/обнови секцию "Выводы" на основе кода и тестов
4. Выведи: что зафиксировано в выводах
```

### Порядок реализации AI-ready слоя

1. Создать корневой `CLAUDE.md`
2. Создать `CLAUDE.md` в каждом шаблоне (копируется в эксперимент при создании)
3. Создать `.claude/commands/` с командами
4. Протестировать: создать эксперимент через `/experiment:create`, убедиться что контекст подхватывается
