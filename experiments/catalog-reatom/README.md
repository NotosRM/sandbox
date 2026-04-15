# catalog-reatom

| Field    | Value                                                                                                                                        |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Template | react-full                                                                                                                                   |
| Created  | 2026-04-14                                                                                                                                   |
| Status   | complete                                                                                                                                     |
| Goal     | Port catalog-zustand to idiomatic Reatom v1000: computed+withAsyncData для server state, atoms для client state, reatomComponent throughout. |

## Выводы

- `computed(async () => { dep() }) + withAsyncData` — прямой аналог `reatomResource + withDataAtom/withErrorAtom/withStatusesAtom` из v3. Реактивность та же: смена зависимости пересчитывает ресурс автоматически.
- `reatomComponent` — компонент без `ctx`-пропса. Атомы читаются вызовом `atom()`, fine-grained подписки. Re-render только при изменении конкретно тех атомов, которые вызывались в рендере.
- `withLocalStorage` переехал из `@reatom/persist-web-storage` прямо в `@reatom/core`. Синтаксис сменился с `.pipe()` на `.extend()`.
- `computed(...)` — отдельная функция вместо `atom((ctx) => ctx.spy(...))`. Читаемее, типобезопасность лучше.
- Обработчики событий требуют `wrap()` для сохранения реактивного контекста. Альтернатива — `useAction()` для стабильных ссылок.
- Тесты: `createCtx()` → `context.start()`, операции в `frame.run()`. Для React-ре-рендеров после `frame.run()` нужен `await act(async () => {})` — иначе DOM остаётся stale.
- Boilerplate: `ctx` ушёл из аргументов — код компонентов и экшенов значительно чище.
