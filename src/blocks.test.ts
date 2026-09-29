/* The blocks entry and the main entry agree.
 *
 * Every block is exported from both (`@crystal-ui/react` and
 * `@crystal-ui/react/blocks`), and they must be the same objects: a block added
 * to the main barrel's Blocks section and forgotten here would exist in one
 * entry and not the other, which is exactly the drift a second entry point
 * invites.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as blocks from './blocks.js';
import * as main from './index.js';

const barrel = readFileSync(fileURLToPath(new URL('./components/index.ts', import.meta.url)), 'utf8');
const section = barrel.slice(barrel.indexOf('/* Blocks'));
const listed = [...section.matchAll(/export \* from '\.\/(\w+)\/index\.js';/g)].map((match) => match[1]);
const entry = readFileSync(fileURLToPath(new URL('./blocks.ts', import.meta.url)), 'utf8');

describe('the blocks entry', () => {
  it('exports every block the main barrel lists as one', () => {
    expect(listed.length).toBeGreaterThan(0);
    for (const name of listed) expect(entry, `${name} is a block in the main barrel and missing from blocks.ts`).toContain(`./components/${name}/index.js`);
  });

  it('exports the same objects as the main entry', () => {
    for (const [name, value] of Object.entries(blocks)) {
      expect((main as Record<string, unknown>)[name], name).toBe(value);
    }
  });
});
