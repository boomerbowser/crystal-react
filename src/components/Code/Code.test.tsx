import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Code } from './Code.js';

describe('Code', () => {
  it('is a real code element inline, and a pre around one as a block', () => {
    const { container, rerenderWithCrystal } = renderWithCrystal(<Code>npm i</Code>);
    expect(container.querySelector('code')).not.toBeNull();
    expect(container.querySelector('pre')).toBeNull();

    rerenderWithCrystal(<Code block>npm i</Code>);
    expect(container.querySelector('pre > code')).not.toBeNull();
  });

  /* A block wider than its column scrolls, and a scroll container with nothing
     focusable in it cannot be reached without a pointer. */
  it('makes a block a tab stop with a Resin scrollbar', () => {
    const { container } = renderWithCrystal(<Code block>npm i</Code>);
    const pre = container.querySelector('pre');
    expect(pre).toHaveAttribute('tabindex', '0');
    expect(pre?.className).toMatch(/cr-scroll-resin/);
  });

  it('leaves an inline fragment out of the tab order', () => {
    const { container } = renderWithCrystal(<Code>npm i</Code>);
    expect(container.querySelector('code')).not.toHaveAttribute('tabindex');
  });

  it('offers a copy control on a block, naming what it copies', () => {
    renderWithCrystal(<Code block copyable copyLabel="Copy the install command">npm i</Code>);
    expect(screen.getByRole('button', { name: 'Copy the install command' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<Code block copyable>npm i @crystal-ui/react</Code>);
    await expectNoAxeViolations(container);
  });
});
