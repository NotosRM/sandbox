# Frontend Sandbox — Спецификация

## Обзор проекта

Персональный монорепозиторий-песочница для экспериментов с фронтенд-технологиями. Позволяет быстро создавать изолированные эксперименты из готовых шаблонов, сравнивать технологии между собой и накапливать переиспользуемые решения.

## Цели

- Быстро поднять изолированный эксперимент одной командой, без ручной настройки инфраструктуры
- Сравнивать технологии в равных условиях (например, zustand vs reatom vs effector — три эксперимента из одного шаблона)
- Накапливать готовые решения, к которым можно вернуться (offline-режим, анимации, паттерны)
- Работать с разными фреймворками (React, Vue, vanilla JS) и разными сборщиками в одном репозитории
- Минимизировать дублирование конфигов между экспериментами

## Стек и инструментарий

### Менеджер пакетов — pnpm

- pnpm workspaces для управления монорепо
- Жёсткие симлинки экономят место при многократной установке одних и тех же зависимостей
- `pnpm-workspace.yaml` в корне определяет все воркспейсы

### Язык — TypeScript

- Базовый `tsconfig.base.json` в корне
- Каждый эксперимент наследует базовый конфиг через `"extends"`
- Strict mode включён по умолчанию

### Сборщик по умолчанию — Vite

- Используется в шаблонах `react-vite`, `vanilla`, `vue-vite`
- Шаблон `custom-build` намеренно без сборщика — для экспериментов с webpack, rspack, esbuild и др.

### Линтинг и форматирование

- Oxlint для линтинга (`.oxlintrc.json` в корне, опционально — работает и без конфига)
- Prettier (`.prettierrc` в корне) для форматирования
- Oxlint работает без конфигурации из коробки — zero-config режим включает высокоприоритетные правила на корректность. При необходимости кастомизации используется `.oxlintrc.json`
- Oxlint автоматически находит конфиг в родительских директориях (nested config), поэтому одного корневого файла достаточно для всех экспериментов

### Git-хуки

- Husky для git-хуков
- lint-staged для проверки только изменённых файлов при коммите

## Структура репозитория

```
frontend-sandbox/
├── package.json                  # Корневой: scripts, devDependencies для shared tools
├── pnpm-workspace.yaml           # Определяет воркспейсы
├── tsconfig.base.json            # Базовый TypeScript-конфиг
├── .oxlintrc.json                # Oxlint-конфиг (опционально, работает и без него)
├── .prettierrc                   # Prettier-конфиг
├── .husky/                       # Git-хуки
│   └── pre-commit                # lint-staged
├── .lintstagedrc                 # Конфигурация lint-staged
├── README.md                     # Документация проекта
│
├── templates/                    # Шаблоны для новых экспериментов
│   ├── react-vite/               # React + Vite + TypeScript
│   │   ├── package.json.tpl      # Шаблон package.json (с плейсхолдерами)
│   │   ├── tsconfig.json         # Наследует ../../tsconfig.base.json
│   │   ├── vite.config.ts
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx
│   │       └── App.tsx
│   │
│   ├── custom-build/             # Пустой шаблон без бандлера
│   │   ├── package.json.tpl
│   │   ├── tsconfig.json
│   │   └── src/
│   │       └── index.ts
│   │
│   └── vue-vite/                 # Vue + Vite + TypeScript
│       ├── package.json.tpl
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── index.html
│       └── src/
│           ├── main.ts
│           └── App.vue
│
├── experiments/                  # Все эксперименты живут здесь
│   ├── .gitkeep
│   └── zustand-vs-reatom/        # Пример: эксперимент из react-vite
│       ├── package.json          # Собственные зависимости (zustand)
│       ├── tsconfig.json         # extends ../../tsconfig.base.json
│       ├── vite.config.ts
│       ├── index.html
│       ├── README.md             # Описание: что тестирую, выводы
│       └── src/
│           ├── main.tsx
│           └── App.tsx
│
├── shared/                       # Переиспользуемые утилиты
│   ├── package.json              # name: "@sandbox/shared"
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts              # Реэкспорт всего публичного API
│       ├── measure.ts            # Утилиты для замеров производительности
│       ├── logger.ts             # Простой логгер для экспериментов
│       └── types.ts              # Общие TypeScript-типы
│
└── scripts/                      # CLI-утилиты для управления песочницей
    ├── create.ts                 # Создать эксперимент из шаблона
    ├── list.ts                   # Показать список экспериментов
    └── clean.ts                  # Очистить node_modules эксперимента
```

## Шаблоны — подробная спецификация

### Общие правила для всех шаблонов

- Файл `package.json.tpl` — шаблон с плейсхолдером `{{name}}` для имени эксперимента
- `tsconfig.json` наследует корневой: `{ "extends": "../../tsconfig.base.json", "compilerOptions": { ... }, "include": ["src"] }`
- Каждый шаблон содержит минимальный рабочий пример, чтобы после создания эксперимента сразу запускался `pnpm dev`
- В `package.json.tpl` имя пакета формируется как `@sandbox/{{name}}`

### react-vite

- React 19+ с TypeScript
- Vite как dev-сервер и сборщик
- Минимальный `App.tsx` с одним компонентом
- Scripts: `dev`, `build`, `preview`
- Зависимости: `react`, `react-dom`, `@types/react`, `@types/react-dom`

### vanilla

- Чистый TypeScript без фреймворков
- Vite как dev-сервер (обычный режим, НЕ library mode)
- `main.ts` с базовой DOM-манипуляцией через `document.getElementById`
- Для экспериментов с Web API, Service Workers, Canvas, анимациями

### custom-build

- Только TypeScript, без сборщика
- Пустой `package.json.tpl` с минимумом: name, scripts, typescript
- Пользователь сам добавляет webpack/rspack/esbuild/parcel
- Scripts: только `typecheck`

### vue-vite

- Vue 3+ с TypeScript и `<script setup>`
- Vite с плагином `@vitejs/plugin-vue`
- Минимальный `App.vue`
- Scripts: `dev`, `build`, `preview`

## CLI-скрипты

### `pnpm run create`

```bash
pnpm run create -- --template <имя_шаблона> --name <имя_эксперимента>
```

> Обрати внимание: `--` перед аргументами обязателен для pnpm.

Логика:

1. Проверить, что шаблон существует в `templates/`
2. Проверить, что эксперимент с таким именем ещё не существует
3. Скопировать содержимое шаблона в `experiments/<имя_эксперимента>/`
4. Обработать `.tpl`-файлы: заменить `{{name}}` на имя, переименовать `package.json.tpl` → `package.json`
5. Добавить в `package.json` метаданные: `"sandbox": { "template": "<имя_шаблона>", "created": "ISO-дата" }`
6. Создать `README.md` с заголовком и датой создания
7. Запустить `pnpm install` в корне (чтобы pnpm подхватил новый воркспейс)
8. Вывести инструкцию: `cd experiments/<имя> && pnpm dev`

### `pnpm run list`

```bash
pnpm run list
```

Выводит таблицу всех экспериментов:

```
Name                 Template      Created      Dependencies
zustand-vs-reatom    react-vite    2025-12-01   zustand, react
offline-mode         vanilla       2025-12-03   —
webpack-test         custom-build  2025-12-05   webpack, webpack-cli
```

Данные берёт из `package.json` каждого эксперимента: поле `sandbox.template` и `sandbox.created` (записываются скриптом `create`). Зависимости — из `dependencies`.

### `pnpm run clean`

```bash
pnpm run clean <имя_эксперимента>   # Удалить dist и кеш конкретного эксперимента
pnpm run clean --all                 # Удалить dist и кеш всех экспериментов
pnpm run clean --full                # Удалить корневой node_modules + pnpm store prune
```

> pnpm хранит зависимости в корневом `node_modules` через симлинки. Поэтому `clean` по умолчанию чистит `dist/` и `.vite/` (кеш Vite). Полная очистка (`--full`) удаляет всё и требует повторного `pnpm install`.

## Корневой package.json

```jsonc
{
  "name": "frontend-sandbox",
  "private": true,
  "scripts": {
    "create": "tsx scripts/create.ts",
    "list": "tsx scripts/list.ts",
    "clean": "tsx scripts/clean.ts",
    "lint": "oxlint .",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit",
  },
  "devDependencies": {
    "typescript": "^5.x",
    "oxlint": "^1.x",
    "prettier": "^3.x",
    "tsx": "^4.x",
    "husky": "^9.x",
    "lint-staged": "^15.x",
  },
}
```

## pnpm-workspace.yaml

```yaml
packages:
  - 'experiments/*'
  - 'shared'
```

Шаблоны НЕ включены в воркспейсы — они не устанавливаются, а только копируются.

## tsconfig.base.json

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
  },
}
```

## Конвенции

### Именование экспериментов

- kebab-case: `zustand-vs-reatom`, `offline-mode`, `css-grid-layouts`
- Для сравнений: `<технология1>-vs-<технология2>`
- Для изучения: `<тема>-<подтема>` (например, `sw-offline`, `canvas-particles`)

### README каждого эксперимента

Каждый эксперимент должен содержать `README.md` со структурой:

```markdown
# <Название эксперимента>

**Шаблон:** react-vite
**Дата:** 2025-12-01
**Статус:** in-progress | done | archived

## Цель

Что хочу проверить / изучить / сравнить.

## Выводы

Что узнал, что выбрал, что запомнить.
```

### Git

- Все эксперименты хранятся в одном репо и коммитятся в main
- Если эксперимент сломан или заброшен — ставится статус `archived` в README
- `.gitignore` в корне исключает `node_modules`, `dist`, `.turbo`, `.vite`

## Рекомендации

### Не используй Turborepo / Nx

Для песочницы это overkill. pnpm workspaces достаточно. У тебя нет задачи оркестрировать сборку десятков пакетов — каждый эксперимент независим. Turborepo добавит сложность без пользы.

### Не выноси Vite-конфиг в shared

Соблазн создать общий `@sandbox/vite-config` — но это антипаттерн для песочницы. Весь смысл в том, что каждый эксперимент может иметь свою конфигурацию сборки. Общий Vite-конфиг превращает песочницу в монолит.

### Держи шаблоны минимальными

Шаблон — это точка старта, не фреймворк. Минимум файлов, минимум зависимостей. Лучше добавить что-то в конкретный эксперимент, чем тащить лишнее во все будущие.

### Добавляй шаблоны по мере необходимости

Начни с `react-vite` и `vanilla`. Шаблон `vue-vite` добавишь, когда реально дойдёшь до Vue. Шаблон `custom-build` — когда захочешь поэкспериментировать со сборщиками. Не создавай шаблоны про запас.

### shared/ — только то, что используется в 3+ экспериментах

Не выноси код в shared заранее. Сначала скопируй. Когда один и тот же хелпер появится в третьем эксперименте — перенеси в shared. Чтобы использовать shared в эксперименте, добавь зависимость в его `package.json`:

```jsonc
"dependencies": {
  "@sandbox/shared": "workspace:*"
}
```

Затем `pnpm install` — и `import { measure } from '@sandbox/shared'` будет работать.

### Порты dev-серверов

Vite автоматически инкрементирует порт, если 5173 занят. Но если одновременно запущено несколько экспериментов, удобнее задавать порт явно в `vite.config.ts` через переменную окружения: `server: { port: Number(process.env.PORT) || 5173 }`. Тогда запуск: `PORT=5174 pnpm dev`.

### .gitignore

```
node_modules/
dist/
.vite/
*.local
.DS_Store
```

## Порядок реализации

1. Инициализировать репозиторий: `package.json`, `pnpm-workspace.yaml`, `.gitignore`
2. Настроить корневые конфиги: `tsconfig.base.json`, `.oxlintrc.json` (опционально), `.prettierrc`
3. Создать шаблон `react-vite` — проверить, что `pnpm dev` работает
4. Создать шаблон `vanilla` — проверить аналогично
5. Написать CLI-скрипт `create` — проверить создание эксперимента из шаблона
6. Написать CLI-скрипт `list`
7. Настроить Husky + lint-staged
8. Создать папку `shared/` с базовой структурой
9. Создать первый эксперимент для проверки всего пайплайна
10. Написать корневой `README.md` с инструкцией
