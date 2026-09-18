import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { CodeBlock } from './CodeBlock.js';

const sample = 'const crystal = true;\nexport default crystal;';

describe('CodeBlock', () => {
  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<CodeBlock language="TypeScript">{sample}</CodeBlock>);
    await expectNoAxeViolations(container);
  });

  /* A code sample wider than its column scrolls, and a scroll container with
     nothing focusable inside it is unreachable without a pointer. */
  it('is a named region and a tab stop, so it can be read and scrolled by keyboard', () => {
    renderWithCrystal(<CodeBlock language="TypeScript">{sample}</CodeBlock>);
    const region = screen.getByRole('region', { name: 'TypeScript code' });
    expect(region.tagName).toBe('PRE');
    expect(region.tabIndex).toBe(0);
    /* A compact horizontal scroller is a control plane, so the Resin scrollbar. */
    expect(region.className).toMatch(/\bcr-scroll-resin\b/);
  });

  /* "Copied" alone is a claim about something the reader cannot see. */
  it('names what the copy control copies', () => {
    renderWithCrystal(<CodeBlock language="TypeScript">{sample}</CodeBlock>);
    expect(screen.getByRole('button', { name: 'Copy the TypeScript sample' })).toBeInTheDocument();
  });

  it('takes a filename over a language when given one', () => {
    renderWithCrystal(<CodeBlock language="TypeScript" label="crystal.ts">{sample}</CodeBlock>);
    expect(screen.getByRole('region', { name: 'crystal.ts' })).toBeInTheDocument();
  });
});
