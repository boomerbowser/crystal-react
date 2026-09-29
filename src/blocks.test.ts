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
import { join } from 'node:path';
import * as blocks from './blocks.js';
import * as main from './index.js';

/* From the package root, which is where the test runner starts: in the jsdom
   environment `import.meta.url` is not a file URL. */
const barrel = readFileSync(join(process.cwd(), 'src/components/index.ts'), 'utf8');
const section = barrel.slice(barrel.indexOf('/* Blocks'));
const listed = [...section.matchAll(/export \* from '\.\/(\w+)\/index\.js';/g)].map((match) => match[1]);
const entry = readFileSync(join(process.cwd(), 'src/blocks.ts'), 'utf8');

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
