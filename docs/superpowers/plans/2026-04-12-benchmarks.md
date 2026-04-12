# Benchmarks Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement bundle size analysis script with named snapshots and add `bench` script to `react-full` / `vue-full` templates.

**Architecture:** Two independent changes — (1) a new `scripts/bundle-size.ts` CLI that builds an experiment, measures JS/CSS file sizes (raw/gzip/brotli), and manages named snapshots in a per-experiment JSON file; (2) a one-line addition to two template `package.json.tpl` files. The script uses `tsx` (already in root devDependencies) to run, and `gzip-size` / `brotli-size` for compression measurements.

**Tech Stack:** Node.js ESM, TypeScript via `tsx`, `gzip-size` ^7, `brotli-size` ^4, `node:fs`, `node:path`, `node:child_process`

---

## File Map

| Action | File                                    | Responsibility                                               |
| ------ | --------------------------------------- | ------------------------------------------------------------ |
| Create | `scripts/bundle-size.ts`                | CLI entry point — arg parsing, orchestration                 |
| Modify | `package.json`                          | Add `bundle-size` script + `gzip-size`/`brotli-size` devDeps |
| Modify | `templates/react-full/package.json.tpl` | Add `"bench": "vitest bench"` script                         |
| Modify | `templates/vue-full/package.json.tpl`   | Add `"bench": "vitest bench"` script                         |

---

## Task 1: Add dependencies and root script

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Install gzip-size and brotli-size**

```bash
cd D:/Projects/sandbox-notosrm
pnpm add -D -w gzip-size brotli-size
```

Expected: both packages added to root `node_modules`, `package.json` devDependencies updated.

- [ ] **Step 2: Add `bundle-size` script to root `package.json`**

Open `package.json` and add to `"scripts"`:

```json
"bundle-size": "tsx scripts/bundle-size.ts"
```

Final scripts block should look like:

```json
"scripts": {
  "create": "tsx scripts/create.ts",
  "list": "tsx scripts/list.ts",
  "clean": "tsx scripts/clean.ts",
  "bundle-size": "tsx scripts/bundle-size.ts",
  "lint": "oxlint .",
  "format": "prettier --write .",
  "typecheck": "tsc --noEmit",
  "prepare": "husky",
  "test": "vitest",
  "test:run": "vitest run"
}
```

- [ ] **Step 3: Commit**

```bash
rtk git add package.json pnpm-lock.yaml && rtk git commit -m "chore: add gzip-size, brotli-size deps and bundle-size script entry"
```

---

## Task 2: Implement `scripts/bundle-size.ts`

**Files:**

- Create: `scripts/bundle-size.ts`

- [ ] **Step 1: Create the file with imports and types**

Create `scripts/bundle-size.ts`:

```typescript
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { gzipSizeSync } from 'gzip-size';
import { brotliSizeSync } from 'brotli-size';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const EXPERIMENTS_DIR = join(ROOT, 'experiments');
const HISTORY_FILE = '.bundle-size-history.json';

interface FileMetrics {
  raw: number;
  gzip: number;
  brotli: number;
}

interface Snapshot {
  timestamp: string;
  files: Record<string, FileMetrics>;
}

type History = Record<string, Snapshot>;
```

- [ ] **Step 2: Add arg parsing**

Append to `scripts/bundle-size.ts`:

```typescript
function parseArgs(): { name: string; save?: string; compare?: string } {
  const args = process.argv.slice(2);
  const name = args[0];
  if (!name || name.startsWith('--')) {
    console.error(
      'Usage: pnpm run bundle-size <experiment-name> [--save <label>] [--compare <label>]'
    );
    process.exit(1);
  }
  const getFlag = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };
  return { name, save: getFlag('--save'), compare: getFlag('--compare') };
}
```

- [ ] **Step 3: Add dist scanner**

Append to `scripts/bundle-size.ts`:

```typescript
function scanDist(distDir: string): Record<string, FileMetrics> {
  const result: Record<string, FileMetrics> = {};
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (['.js', '.css'].includes(extname(entry.name))) {
        const content = readFileSync(full);
        const rel = full.slice(distDir.length + 1).replace(/\\/g, '/');
        result[rel] = {
          raw: statSync(full).size,
          gzip: gzipSizeSync(content),
          brotli: brotliSizeSync(content),
        };
      }
    }
  };
  walk(distDir);
  return result;
}
```

- [ ] **Step 4: Add formatting helpers**

Append to `scripts/bundle-size.ts`:

```typescript
function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} kB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function formatDelta(delta: number): string {
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${formatBytes(delta)}`;
}

function formatPct(delta: number, base: number): string {
  if (base === 0) return 'N/A';
  const pct = (delta / base) * 100;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

/** Strip Vite content hash from filename: "index-Abc123De.js" → "index.js" */
function stripHash(filename: string): string {
  return filename.replace(/-[A-Za-z0-9]{8,}(\.[a-z]+)$/, '$1');
}
```

- [ ] **Step 5: Add snapshot read/write helpers**

Append to `scripts/bundle-size.ts`:

```typescript
function readHistory(experimentDir: string): History {
  const path = join(experimentDir, HISTORY_FILE);
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as History;
  } catch {
    console.warn(`Warning: could not parse ${HISTORY_FILE}, starting fresh.`);
    return {};
  }
}

function writeHistory(experimentDir: string, history: History): void {
  const path = join(experimentDir, HISTORY_FILE);
  writeFileSync(path, JSON.stringify(history, null, 2) + '\n');
}
```

- [ ] **Step 6: Add print functions**

Append to `scripts/bundle-size.ts`:

```typescript
function printSnapshot(files: Record<string, FileMetrics>): void {
  const rows: Record<string, string>[] = Object.entries(files).map(([file, m]) => ({
    file,
    raw: formatBytes(m.raw),
    gzip: formatBytes(m.gzip),
    brotli: formatBytes(m.brotli),
  }));
  console.table(rows);
}

function printComparison(
  current: Record<string, FileMetrics>,
  saved: Record<string, FileMetrics>,
  label: string
): void {
  console.log(`\nComparison vs snapshot "${label}":\n`);

  // Build lookup by stripped basename for saved entries
  const savedByBase: Record<string, { key: string; metrics: FileMetrics }> = {};
  for (const [key, metrics] of Object.entries(saved)) {
    savedByBase[stripHash(basename(key))] = { key, metrics };
  }

  const rows: Record<string, string>[] = [];
  for (const [file, cur] of Object.entries(current)) {
    const base = stripHash(basename(file));
    const prev = savedByBase[base];
    if (!prev) {
      rows.push({
        file,
        raw: formatBytes(cur.raw),
        'raw Δ': '(new)',
        gzip: formatBytes(cur.gzip),
        'gzip Δ': '(new)',
        brotli: formatBytes(cur.brotli),
        'brotli Δ': '(new)',
      });
    } else {
      const rawD = cur.raw - prev.metrics.raw;
      const gzipD = cur.gzip - prev.metrics.gzip;
      const brotliD = cur.brotli - prev.metrics.brotli;
      rows.push({
        file,
        raw: formatBytes(cur.raw),
        'raw Δ': `${formatDelta(rawD)} (${formatPct(rawD, prev.metrics.raw)})`,
        gzip: formatBytes(cur.gzip),
        'gzip Δ': `${formatDelta(gzipD)} (${formatPct(gzipD, prev.metrics.gzip)})`,
        brotli: formatBytes(cur.brotli),
        'brotli Δ': `${formatDelta(brotliD)} (${formatPct(brotliD, prev.metrics.brotli)})`,
      });
    }
  }
  console.table(rows);
}
```

- [ ] **Step 7: Add main function**

Append to `scripts/bundle-size.ts`:

```typescript
function main(): void {
  const { name, save, compare } = parseArgs();

  const experimentDir = join(EXPERIMENTS_DIR, name);
  if (!existsSync(experimentDir)) {
    console.error(`Experiment "${name}" not found at experiments/${name}`);
    process.exit(1);
  }

  // Build
  console.log(`\nBuilding "${name}"...`);
  execSync('pnpm build', { cwd: experimentDir, stdio: 'inherit' });

  const distDir = join(experimentDir, 'dist');
  if (!existsSync(distDir)) {
    console.error(`dist/ not found after build. Does the experiment have a build script?`);
    process.exit(1);
  }

  // Scan
  const currentFiles = scanDist(distDir);
  console.log(`\nBundle sizes for "${name}":\n`);
  printSnapshot(currentFiles);

  const history = readHistory(experimentDir);

  // Compare
  if (compare) {
    const snapshot = history[compare];
    if (!snapshot) {
      const available = Object.keys(history).join(', ') || '(none)';
      console.error(`Snapshot "${compare}" not found. Available: ${available}`);
      process.exit(1);
    }
    printComparison(currentFiles, snapshot.files, compare);
  }

  // Save
  if (save) {
    history[save] = {
      timestamp: new Date().toISOString(),
      files: currentFiles,
    };
    writeHistory(experimentDir, history);
    console.log(`\nSnapshot saved as "${save}" to experiments/${name}/${HISTORY_FILE}`);
  }
}

main();
```

- [ ] **Step 8: Verify the script type-checks**

```bash
cd D:/Projects/sandbox-notosrm && npx tsc --noEmit --skipLibCheck --module nodenext --moduleResolution nodenext --target esnext scripts/bundle-size.ts
```

If there are type errors, fix them. Common issues: `brotli-size` may need `@types` — check with `pnpm ls brotli-size`.

> **Note:** `brotli-size` exports `brotliSizeSync` as a named export in v4. If the import fails at runtime, check with `node --input-type=module <<< "import('brotli-size').then(console.log)"`.

- [ ] **Step 9: Commit**

```bash
rtk git add scripts/bundle-size.ts && rtk git commit -m "feat(scripts): add bundle-size CLI with named snapshots"
```

---

## Task 3: Add `bench` script to `react-full` and `vue-full` templates

**Files:**

- Modify: `templates/react-full/package.json.tpl`
- Modify: `templates/vue-full/package.json.tpl`

- [ ] **Step 1: Update `react-full` template**

In `templates/react-full/package.json.tpl`, add `"bench"` after `"test:run"`:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc --noEmit && vite build",
  "preview": "vite preview",
  "storybook": "storybook dev -p 6006",
  "build-storybook": "storybook build",
  "test": "vitest",
  "test:run": "vitest run",
  "bench": "vitest bench"
},
```

- [ ] **Step 2: Update `vue-full` template**

In `templates/vue-full/package.json.tpl`, add `"bench"` after `"test:run"`:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc --noEmit && vite build",
  "preview": "vite preview",
  "storybook": "storybook dev -p 6006",
  "build-storybook": "storybook build",
  "test": "vitest",
  "test:run": "vitest run",
  "bench": "vitest bench"
},
```

- [ ] **Step 3: Commit**

```bash
rtk git add templates/react-full/package.json.tpl templates/vue-full/package.json.tpl && rtk git commit -m "feat(templates): add bench script to react-full and vue-full"
```

---

## Task 4: Smoke test

- [ ] **Step 1: Verify an experiment exists to test against (or create one)**

```bash
cd D:/Projects/sandbox-notosrm && pnpm run list
```

If no experiments exist, create one:

```bash
pnpm run create -- --template react-full --name bench-smoke && pnpm install
```

- [ ] **Step 2: Run bundle-size without flags**

```bash
pnpm run bundle-size bench-smoke
```

Expected: build runs, a `console.table` with `file | raw | gzip | brotli` columns appears, no errors.

- [ ] **Step 3: Save a snapshot**

```bash
pnpm run bundle-size bench-smoke --save baseline
```

Expected: same table, then `Snapshot saved as "baseline"`. Check the file exists:

```bash
cat experiments/bench-smoke/.bundle-size-history.json
```

Expected: JSON with a `"baseline"` key containing `timestamp` and `files`.

- [ ] **Step 4: Compare against snapshot**

```bash
pnpm run bundle-size bench-smoke --compare baseline
```

Expected: current table, then a comparison table with `Δ` columns showing `+0 B (0.0%)` for all files (comparing against itself).

- [ ] **Step 5: Verify bench script in new react-full experiment**

```bash
pnpm run create -- --template react-full --name bench-template-check && pnpm install
cd experiments/bench-template-check && pnpm bench
```

Expected: vitest bench runs (may find no bench files — that's fine, just verify the script exists and vitest bench starts).

- [ ] **Step 6: Clean up smoke test experiments**

```bash
cd D:/Projects/sandbox-notosrm
rm -rf experiments/bench-smoke experiments/bench-template-check
pnpm install
```

- [ ] **Step 7: Final commit**

```bash
rtk git add -A && rtk git commit -m "chore: remove smoke test experiments"
```
