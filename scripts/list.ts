import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const EXPERIMENTS_DIR = join(ROOT, 'experiments');

interface SandboxMeta {
  template?: string;
  created?: string;
}

interface PkgJson {
  sandbox?: SandboxMeta;
  dependencies?: Record<string, string>;
}

function padEnd(str: string, len: number): string {
  return str.length >= len ? str : str + ' '.repeat(len - str.length);
}

function main(): void {
  if (!existsSync(EXPERIMENTS_DIR)) {
    console.log('No experiments found.');
    return;
  }

  const entries = readdirSync(EXPERIMENTS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  if (entries.length === 0) {
    console.log('No experiments yet. Run: pnpm run create -- --template react-vite --name my-exp');
    return;
  }

  const rows: Array<{ name: string; template: string; created: string; deps: string }> = [];

  for (const name of entries) {
    const pkgPath = join(EXPERIMENTS_DIR, name, 'package.json');
    if (!existsSync(pkgPath)) continue;

    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as PkgJson;
    const meta = pkg.sandbox ?? {};
    const deps = Object.keys(pkg.dependencies ?? {});

    rows.push({
      name,
      template: meta.template ?? '—',
      created: meta.created ?? '—',
      deps: deps.length > 0 ? deps.join(', ') : '—',
    });
  }

  const nameWidth = Math.max(24, ...rows.map((r) => r.name.length)) + 2;
  const COL = { name: nameWidth, template: 14, created: 13, deps: 0 };
  const header =
    padEnd('Name', COL.name) +
    padEnd('Template', COL.template) +
    padEnd('Created', COL.created) +
    'Dependencies';
  const divider = '-'.repeat(header.length + 20);

  console.log('\n' + header);
  console.log(divider);
  for (const row of rows) {
    console.log(
      padEnd(row.name, COL.name) +
        padEnd(row.template, COL.template) +
        padEnd(row.created, COL.created) +
        row.deps
    );
  }
  console.log();
}

main();
