import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSizeSync } from 'gzip-size';
import { sync as brotliSizeSync } from 'brotli-size';

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
