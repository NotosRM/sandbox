import { existsSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = resolve(import.meta.dirname, '..');
const EXPERIMENTS_DIR = join(ROOT, 'experiments');

function cleanExperiment(name: string): void {
  const base = join(EXPERIMENTS_DIR, name);
  let cleaned = false;

  for (const target of ['dist', '.vite']) {
    const p = join(base, target);
    if (existsSync(p)) {
      rmSync(p, { recursive: true, force: true });
      console.log(`  removed ${name}/${target}`);
      cleaned = true;
    }
  }

  if (!cleaned) console.log(`  ${name}: nothing to clean`);
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.includes('--full')) {
    const nm = join(ROOT, 'node_modules');
    if (existsSync(nm)) {
      console.log('Removing root node_modules...');
      rmSync(nm, { recursive: true, force: true });
    }
    console.log('Running pnpm store prune...');
    execSync('pnpm store prune', { stdio: 'inherit' });
    console.log('\nDone. Run pnpm install to reinstall.');
    return;
  }

  if (args.includes('--all')) {
    if (!existsSync(EXPERIMENTS_DIR)) {
      console.log('No experiments found.');
      return;
    }
    console.log('Cleaning all experiments...');
    const entries = readdirSync(EXPERIMENTS_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
    for (const name of entries) cleanExperiment(name);
    return;
  }

  const name = args[0];
  if (!name) {
    console.error('Usage:');
    console.error('  pnpm run clean <name>   — clean dist/.vite for one experiment');
    console.error('  pnpm run clean --all    — clean all experiments');
    console.error('  pnpm run clean --full   — remove root node_modules + pnpm store prune');
    process.exit(1);
  }

  const expDir = join(EXPERIMENTS_DIR, name);
  if (!existsSync(expDir)) {
    console.error(`Experiment "${name}" not found`);
    process.exit(1);
  }

  cleanExperiment(name);
}

main();
