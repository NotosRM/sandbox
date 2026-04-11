Добавь E2E-тесты (Playwright) в существующий эксперимент.

Параметры: $ARGUMENTS
Ожидаемый формат: `<имя-эксперимента> [что тестировать]`
Пример: `zustand-counter проверить что счётчик инкрементируется`

Шаги:

1. Проверь, что `experiments/<имя>` существует. Если нет — сообщи об ошибке и остановись.
2. Создай папку `experiments/<имя>/e2e/`.
3. Создай `experiments/<имя>/playwright.config.ts`:

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

4. Добавь скрипт в `experiments/<имя>/package.json`:
   `"test:e2e": "playwright test"`
5. Создай `experiments/<имя>/e2e/basic.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test('app loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
});
```

6. Если в аргументах указан сценарий — напиши дополнительный тест под него в том же файле.
7. `@playwright/test` установлен в корне workspace — дополнительная установка не нужна.
8. Запусти `pnpm test:e2e` и убедись, что тест проходит.
9. Выведи итог: какие тесты добавлены, как запускать.
