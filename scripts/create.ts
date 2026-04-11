import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const TEMPLATES_DIR = join(ROOT, 'templates');
const EXPERIMENTS_DIR = join(ROOT, 'experiments');

const TEXT_EXTENSIONS = ['.ts', '.tsx', '.vue', '.html', '.md'];

/** Templates that include MSW and need mockServiceWorker.js in public/ */
const MSW_TEMPLATES = new Set(['react-full', 'vue-full']);

function processDir(dir: string, name: string): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      processDir(fullPath, name);
    } else if (TEXT_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      const content = readFileSync(fullPath, 'utf-8');
      if (content.includes('{{name}}')) {
        writeFileSync(fullPath, content.replaceAll('{{name}}', name));
      }
    }
  }
}

function parseArgs(): { template: string; name: string } {
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };
  const template = get('--template');
  const name = get('--name');
  if (!template || !name) {
    console.error('Usage: pnpm run create -- --template <name> --name <experiment-name>');
    process.exit(1);
  }
  if (!/^[a-z0-9-]+$/.test(name)) {
    console.error('Experiment name must be lowercase letters, digits, and hyphens only.');
    process.exit(1);
  }
  return { template, name };
}

function main(): void {
  const today = new Date().toISOString().slice(0, 10);
  const { template, name } = parseArgs();

  const templateDir = join(TEMPLATES_DIR, template);
  if (!existsSync(templateDir)) {
    const available = readdirSync(TEMPLATES_DIR).join(', ');
    console.error(`Template "${template}" not found. Available: ${available}`);
    process.exit(1);
  }

  const experimentDir = join(EXPERIMENTS_DIR, name);
  if (existsSync(experimentDir)) {
    console.error(`Experiment "${name}" already exists at experiments/${name}`);
    process.exit(1);
  }

  // 1. Copy template
  // cpSync creates experimentDir itself when recursive: true
  cpSync(templateDir, experimentDir, { recursive: true });

  // 2. Process .tpl files
  const tplPath = join(experimentDir, 'package.json.tpl');
  if (existsSync(tplPath)) {
    const content = readFileSync(tplPath, 'utf-8').replaceAll('{{name}}', name);
    const pkg = JSON.parse(content) as Record<string, unknown>;

    // 3. Add sandbox metadata
    pkg['sandbox'] = {
      template,
      created: today,
    };

    writeFileSync(join(experimentDir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
    rmSync(tplPath);
  }

  // Replace {{name}} in all other text files
  processDir(experimentDir, name);

  // 4. Copy mockServiceWorker.js for MSW-enabled templates
  if (MSW_TEMPLATES.has(template)) {
    const mswWorkerSrc = join(ROOT, 'node_modules', 'msw', 'lib', 'mockServiceWorker.js');
    if (existsSync(mswWorkerSrc)) {
      const publicDir = join(experimentDir, 'public');
      mkdirSync(publicDir, { recursive: true });
      cpSync(mswWorkerSrc, join(publicDir, 'mockServiceWorker.js'));
    } else {
      console.warn(
        '  ⚠ msw not found in node_modules — run `npx msw init public/` inside the experiment'
      );
    }
  }

  // 5. Create README.md
  const readme = `# ${name}

**Шаблон:** ${template}
**Дата:** ${today}
**Статус:** in-progress

## Цель

Что хочу проверить / изучить / сравнить.

## Выводы

Что узнал, что выбрал, что запомнить.
`;
  const readmePath = join(experimentDir, 'README.md');
  if (!existsSync(readmePath)) {
    writeFileSync(readmePath, readme);
  }

  console.log(`\n✓ Experiment "${name}" created from template "${template}"\n`);
  console.log('Next steps:');
  console.log('  1. Run pnpm install in the repo root (to pick up the new workspace)');
  if (MSW_TEMPLATES.has(template)) {
    console.log(`  2. cd experiments/${name} && pnpm dev`);
    console.log(
      '     MSW is active in DEV — check the browser console for "[MSW] Mocking enabled"\n'
    );
  } else {
    console.log(`  2. cd experiments/${name} && pnpm dev\n`);
  }
}

main();
