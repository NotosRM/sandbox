Добавь visual regression тесты (Storybook test-runner + Playwright) в существующий эксперимент.

Параметры: $ARGUMENTS
Ожидаемый формат: `<имя-эксперимента>` — например: `my-ui-exp`
Если аргумент не указан — используй имя текущей директории.

Требования: эксперимент должен использовать шаблон `react-full` или `vue-full`.

Шаги:

1. Определи имя эксперимента из аргументов или текущей директории.

2. Прочитай `experiments/<имя>/package.json` и проверь поле `sandbox.template`.
   - Если шаблон не `react-full` и не `vue-full` — выведи ошибку:
     "Visual тесты поддерживаются только для шаблонов react-full и vue-full."
     и остановись.

3. Установи зависимости в директории эксперимента:

   ```bash
   cd experiments/<имя>
   pnpm add -D @storybook/test-runner @playwright/test
   npx playwright install --with-deps chromium
   ```

4. Добавь скрипт `test:visual` в `experiments/<имя>/package.json`:

   ```json
   "test:visual": "test-storybook --url http://localhost:6006"
   ```

5. Создай `experiments/<имя>/playwright.config.ts`:

   ```ts
   import { defineConfig } from '@playwright/test';

   export default defineConfig({
     testMatch: '**/*.visual.test.ts',
     use: {
       baseURL: 'http://localhost:6006',
     },
   });
   ```

6. Если шаблон `react-full` — создай `experiments/<имя>/src/components/ui/button.visual.test.ts`:

   ```ts
   import { test, expect } from '@storybook/test-runner';

   test('Button/Default matches snapshot', async ({ page }) => {
     await page.goto('/iframe.html?id=ui-button--default');
     await expect(page).toHaveScreenshot('button-default.png');
   });

   test('Button/Variants matches snapshot', async ({ page }) => {
     await page.goto('/iframe.html?id=ui-button--variants');
     await expect(page).toHaveScreenshot('button-variants.png');
   });
   ```

   Если шаблон `vue-full` — создай `experiments/<имя>/src/components/appbutton.visual.test.ts`:

   ```ts
   import { test, expect } from '@storybook/test-runner';

   test('AppButton/Default matches snapshot', async ({ page }) => {
     await page.goto('/iframe.html?id=components-appbutton--default');
     await expect(page).toHaveScreenshot('appbutton-default.png');
   });

   test('AppButton/Variants matches snapshot', async ({ page }) => {
     await page.goto('/iframe.html?id=components-appbutton--variants');
     await expect(page).toHaveScreenshot('appbutton-variants.png');
   });
   ```

7. Добавь секцию "Visual тесты" в `experiments/<имя>/CLAUDE.md`:

   ````markdown
   ## Visual тесты

   | Команда            | Описание                          |
   | ------------------ | --------------------------------- |
   | `pnpm test:visual` | Запустить visual regression тесты |

   **Важно:** перед запуском `pnpm test:visual` Storybook должен быть запущен:

   ```bash
   # Терминал 1
   pnpm storybook

   # Терминал 2
   pnpm test:visual
   ```
   ````

   Первый запуск создаёт baseline скриншоты в `__snapshots__/`.
   Последующие запуски сравнивают с baseline.

   ```

   ```

8. Выведи итог:
   - Что установлено
   - Как запустить: сначала `pnpm storybook`, затем `pnpm test:visual`
   - Где лежат тестовые файлы
