# Benchmarks Infrastructure Design

**Date:** 2026-04-12  
**Scope:** Part 3 of sandbox specs — performance benchmarks

---

## Context

`shared/src/benchmark/` is already fully implemented:

- `measure.ts` — `measure`, `measureAsync`, `measureIterations`
- `react-profiler.tsx` — `Profiled`, `printRenderStats`
- `stress.ts` — `generateData`, `generateTree`
- `index.ts` — re-exports

Remaining work: bundle size script, template updates.

---

## 1. `scripts/bundle-size.ts`

### CLI

```bash
pnpm run bundle-size <name>                   # analyze current dist/, print table
pnpm run bundle-size <name> --save <label>    # analyze + save named snapshot
pnpm run bundle-size <name> --compare <label> # analyze + compare against saved snapshot
```

### Logic

1. Run `pnpm build` inside `experiments/<name>/`
2. Glob `dist/**/*.{js,css}` — for each file compute: raw bytes, gzip size, brotli size
3. Print `console.table`: `file | raw | gzip | brotli`
4. `--save <label>`: append/overwrite snapshot in `experiments/<name>/.bundle-size-history.json` under key `<label>`
5. `--compare <label>`: load snapshot by key, print second table with deltas (`+/- bytes` and `%`)

### Snapshot format

`experiments/<name>/.bundle-size-history.json`:

```json
{
  "before-treeshaking": {
    "timestamp": "2026-04-12T10:00:00Z",
    "files": {
      "assets/index-abc123.js": { "raw": 42000, "gzip": 12000, "brotli": 10000 }
    }
  },
  "after-treeshaking": {
    "timestamp": "2026-04-12T11:00:00Z",
    "files": {
      "assets/index-def456.js": { "raw": 30000, "gzip": 9000, "brotli": 7500 }
    }
  }
}
```

Comparison matches files by their **basename** (without hash), since Vite hashes change between builds.

### Dependencies (root `package.json` devDependencies)

```json
"gzip-size": "^7.x",
"brotli-size": "^4.x"
```

`rollup-plugin-visualizer` is out of scope — it belongs inside experiment vite configs, not in this script.

---

## 2. Template updates

Add `"bench": "vitest bench"` to `package.json` scripts in:

- `templates/react-full/`
- `templates/vue-full/`

Existing experiments are not modified — only templates, so new experiments get `pnpm bench` out of the box.

---

## Out of scope

- `.claude/commands/experiment-add-bench.md` — too trivial to warrant a command; Claude handles ad-hoc bench file creation without it.
- `rollup-plugin-visualizer` — vite-config concern, not a shared script dependency.
- Modifying existing experiments.
