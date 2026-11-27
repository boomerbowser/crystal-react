#!/usr/bin/env node
/* A consumer with no bundler of its own, bundled with esbuild (R-30).
 *
 * The library is published for bundlers: `dist/` imports Prismata's token and
 * recipe JSON without an import attribute, which every bundler accepts and
 * plain Node ESM refuses. Meridian ruled on 16 November 2026 that this stays
 * so: Next.js, where the documentation site lives, brings its own bundler, and
 * wherever no bundler is provided the consumer uses webpack or esbuild.
 *
 * So this proves the esbuild path end to end. A server-rendering consumer
 * imports the built package by its published name (`@prismata/react`, the
 * package resolving itself through its `exports`), esbuild bundles it for
 * Node with the JSON inlined and the stylesheets left to the page, and the
 * bundle runs in plain Node and renders components to HTML. It also checks the
 * refusal the ruling answers, so the day plain Node starts accepting the
 * package this says so.
 *
 * Run after `pnpm build`.
 *
 *   node scripts/verify-bundled-consumer.mjs
 */
import { build } from 'esbuild';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
if (!existsSync(join(ROOT, 'dist/index.js'))) {
  console.error('No dist/. Run `pnpm build` first.');
  process.exit(1);
}
const WORK = join(ROOT, 'node_modules/.cache/bundled-consumer');
mkdirSync(WORK, { recursive: true });
const failures = [];

/* The consumer: what a product's server entry would write. */
const entry = join(WORK, 'entry.jsx');
writeFileSync(entry, `
import { renderToString } from 'react-dom/server';
import { PrismataProvider, Button, Tabs, SegmentedControl, Badge } from '@prismata/react';
const html = renderToString(
  <PrismataProvider>
    <Button>Save</Button>
    <Badge>4</Badge>
    <Tabs label="Sections" items={[{ id: 'a', label: 'Overview', content: 'One' }, { id: 'b', label: 'Usage', content: 'Two' }]} />
    <SegmentedControl label="View" defaultValue="day" options={[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }]} />
  </PrismataProvider>,
);
process.stdout.write(html);
`);

const out = join(WORK, 'server.mjs');
await build({
  entryPoints: [entry],
  outfile: out,
  bundle: true,
  platform: 'node',
  format: 'esm',
  jsx: 'automatic',
  /* The page loads the stylesheets; a server bundle has no use for them. */
  loader: { '.css': 'empty', '.scss': 'empty' },
  /* Resolved from the repository, as a product resolves from its own
     node_modules; the package finds itself by name through its exports. */
  nodePaths: [join(ROOT, 'node_modules')],
  absWorkingDir: ROOT,
  logLevel: 'silent',
  /* Some dependencies are CommonJS and call require() for Node built-ins. */
  banner: { js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" },
});

let html = '';
try {
  html = execFileSync(process.execPath, [out], { encoding: 'utf8' });
} catch (error) {
  failures.push(`the esbuild bundle did not run in Node: ${String(error.stderr || error.message).split('\n')[0]}`);
}
if (html) {
  for (const [what, found] of [
    ['a Prismata button', /class="[^"]*pr-button/.test(html)],
    ['the tab list with its tabs', /role="tablist"/.test(html) && /Overview/.test(html)],
    ['the segmented control on the dock', /pr-dock/.test(html) && /Week/.test(html)],
    ['the provider\'s theme scope', /--pr-primary/.test(html)],
  ]) if (!found) failures.push(`the rendered HTML has no ${what}`);
}

/* The refusal the ruling answers, recorded rather than assumed. */
let plainNode = 'imports';
try {
  execFileSync(process.execPath, ['--input-type=module', '-e', "await import('@prismata/react')"], { cwd: ROOT, stdio: 'pipe' });
} catch (error) {
  plainNode = /ERR_IMPORT_ATTRIBUTE_MISSING|ERR_UNKNOWN_FILE_EXTENSION|ERR_/.exec(String(error.stderr))?.[0] ?? 'fails';
}

console.log(JSON.stringify({
  suite: 'a consumer with no bundler, bundled with esbuild',
  renderedBytes: html.length,
  plainNodeImport: plainNode,
  failures,
}, null, 2));
if (failures.length) process.exit(1);
