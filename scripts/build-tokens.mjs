/* Generate Crystal React's token surfaces from Crystal's generated export.
 *
 * CONTRACT §1: "A hard-coded #7338EF, 40px or 1.95px anywhere in a library is a
 * defect, because it is a value that can no longer be changed centrally." That
 * makes this the only place a Crystal value may enter the library, and it makes
 * hand-writing _tokens.scss a defect on its first line. Both outputs are
 * gitignored for the same reason: a committed generated file is one somebody
 * will eventually edit.
 *
 * The source is the RESOLVED flat export, not the raw DTCG tree. The same
 * section says so — "Generated exports for TypeScript, Swift and Kotlin are
 * emitted from it into design-system/exports/. A library imports those" — and
 * reading the tree instead would mean a second implementation of alias
 * resolution, which is exactly the divergence §1 warns about.
 *
 * Palette colours are deliberately absent. Palette and mode are runtime
 * choices: their values arrive as custom properties from Crystal's theme
 * stylesheet, and the provider switches between them. What is generated here is
 * everything that does not vary that way.
 *
 * Two outputs, because SCSS and TypeScript need different things:
 *
 *   src/styles/_tokens.scss       compile-time values — arithmetic, media
 *                                 queries, and anything that cannot be a custom
 *                                 property, such as a blur radius inside a
 *                                 `filter` shorthand.
 *   src/theme/tokens.generated.ts a typed object, so reading the theme gives
 *                                 completion and a compile error rather than an
 *                                 undefined at runtime.
 *
 *   node scripts/build-tokens.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

/* Resolved rather than hard-coded, so moving the checkout fails loudly instead
   of silently falling back to stale values. */
const CANDIDATES = [
  resolve(ROOT, 'node_modules/@crystal/core/exports/crystal-tokens.ts'),
  resolve(ROOT, '../crystal-design-system/design-system/exports/crystal-tokens.ts'),
];
const SOURCE = CANDIDATES.find((path) => {
  try { readFileSync(path); return true; } catch { return false; }
});
if (!SOURCE) {
  console.error('Cannot find the generated crystal-tokens export. Looked in:\n  ' + CANDIDATES.join('\n  '));
  console.error('\nCrystal React consumes the design system; it does not carry its own copy of these values.');
  process.exit(1);
}

const body = readFileSync(SOURCE, 'utf8');
const open = body.indexOf('{');
const close = body.lastIndexOf('}');
if (open === -1 || close === -1) {
  console.error(`${SOURCE} is not the expected generated shape.`);
  process.exit(1);
}
/* Generated, so the shape is stable; a trailing comma is the one thing JSON
   will not accept from it. */
const literal = body.slice(open, close + 1).replace(/,(\s*[}\]])/g, '$1');

let tokenMap;
try {
  tokenMap = JSON.parse(literal);
} catch (error) {
  console.error(`Could not parse ${SOURCE}: ${error.message}`);
  process.exit(1);
}

/* An alias that reaches a stylesheet is a broken value, not a fallback, so it
   stops the build rather than being written out. */
for (const [name, value] of Object.entries(tokenMap)) {
  if (typeof value === 'string' && /^\{.+\}$/.test(value)) {
    console.error(`Unresolved alias ${value} at "${name}".`);
    console.error('The upstream export is stale — run tools/build-tokens.cjs in the design system.');
    process.exit(1);
  }
}

const kebab = (name) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/\./g, '-').toLowerCase();
/* Quote everything that is not provably safe bare, rather than quoting the cases
   that look dangerous.
 *
 * The first version quoted values containing a space or a comma, which let
 * `$cr-feedback-light-danger-symbol: !;` through — the danger status symbol is a
 * bare `!`, which SCSS reads as the start of `!important` and refuses. Status
 * symbols, font stacks and easing curves are all strings; only numbers, numbers
 * with a unit, and hex colours are values SCSS should read literally. */
const SAFE_BARE = /^(-?\d*\.?\d+[a-z%]*|#[0-9a-fA-F]{3,8})$/;
const scssValue = (value) => {
  if (typeof value === 'number') return String(value);
  const text = String(value);
  return SAFE_BARE.test(text) ? text : JSON.stringify(text);
};

const entries = Object.entries(tokenMap).filter(([, value]) => value === null || typeof value !== 'object');

const scss = [
  "// Generated from Crystal's design tokens. Do not edit, and do not commit.",
  `// Source: ${SOURCE}`,
  '//',
  '// These are the compile-time values. Everything that varies with palette,',
  '// mode or density is a custom property instead and is not listed here.',
  '',
  ...entries.map(([name, value]) => `$cr-${kebab(name)}: ${scssValue(value)};`),
  '',
].join('\n');

const ts = [
  "/* Generated from Crystal's design tokens. Do not edit, and do not commit. */",
  '',
  'export const crystalTokens = {',
  ...entries.map(([name, value]) => `  ${JSON.stringify(name)}: ${JSON.stringify(value)},`),
  '} as const;',
  '',
  'export type CrystalTokenName = keyof typeof crystalTokens;',
  '',
].join('\n');

mkdirSync(resolve(ROOT, 'src/styles'), { recursive: true });
mkdirSync(resolve(ROOT, 'src/theme'), { recursive: true });
writeFileSync(resolve(ROOT, 'src/styles/_tokens.scss'), scss);
writeFileSync(resolve(ROOT, 'src/theme/tokens.generated.ts'), ts);

/* Compile what was just written. A token file that does not parse fails here,
   with the offending line, rather than inside the first component that imports
   it — which is where the bare `!` surfaced the first time. */
const sass = await import('sass');
try {
  sass.compileString(scss, { syntax: 'scss' });
} catch (error) {
  console.error('The generated _tokens.scss does not compile:\n' + error.message);
  process.exit(1);
}

console.log(`${entries.length} tokens -> src/styles/_tokens.scss and src/theme/tokens.generated.ts (compiles)`);
