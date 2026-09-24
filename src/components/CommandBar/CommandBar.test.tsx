import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { CommandBar } from './CommandBar.js';
import { Button } from '../Button/Button.js';

const overflow = (_hidden: readonly unknown[], count: number) => (
  <Button>{count} more</Button>
);

describe('CommandBar', () => {
  /* "role=toolbar with one tab stop." A row of eight commands each taking a tab
     stop would put eight presses between the reader and the next field; React
     Aria's toolbar collapses them to one and moves between them with arrows. */
  it('is a named toolbar', () => {
    renderWithCrystal(
      <CommandBar aria-label="Report commands" renderOverflow={overflow}>
        <Button>Export</Button>
        <Button>Share</Button>
      </CommandBar>,
    );
    expect(screen.getByRole('toolbar', { name: 'Report commands' })).toBeInTheDocument();
  });

  /* Nothing is dropped during the measuring pass — everything is laid out
     invisibly so the widths exist to be read. This environment has no widths at
     all, which is exactly why the overflow *behaviour* is asked in
     `verify:appearance` and only the reachability is asked here. */
  it('keeps every command reachable', () => {
    renderWithCrystal(
      <CommandBar aria-label="Report commands" renderOverflow={overflow}>
        <Button>Export</Button>
        <Button>Share</Button>
        <Button>Duplicate</Button>
      </CommandBar>,
    );
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Duplicate' })).toBeInTheDocument();
  });

  /* The overflow affordance is rendered inside the row rather than beside it,
     because an item that leaves the toolbar leaves its roving tab index with
     it — the trigger that reaches the hidden ones has to be in the toolbar.
   *
   * Nothing overflows here: this environment gives every element a width of
   * zero, so the measuring row concludes that everything fits and the
   * affordance is never rendered. Asserting "it is inside the toolbar if it
   * exists" would therefore be an assertion about nothing. What is determinate
   * is that the row the affordance is rendered into is itself inside the
   * toolbar, so whatever appears in it appears there too. Whether the
   * affordance actually appears when the bar is too narrow is asked in
   * `verify:appearance`, at a width. */
  it('renders its row inside the toolbar, so the overflow trigger lands there', () => {
    const { container } = renderWithCrystal(
      <CommandBar aria-label="Report commands" renderOverflow={overflow}>
        <Button>Export</Button>
      </CommandBar>,
    );
    const toolbar = container.querySelector('[role="toolbar"]');
    const command = screen.getByRole('button', { name: 'Export' });
    expect(toolbar).not.toBeNull();
    /* The command sits in the measuring row, and the row sits in the toolbar. */
    expect(toolbar?.contains(command)).toBe(true);
    expect(command.parentElement).not.toBe(toolbar);
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <CommandBar aria-label="Report commands" renderOverflow={overflow}>
        <Button>Export</Button>
        <Button>Share</Button>
      </CommandBar>,
    );
    await expectNoAxeViolations(container);
  });
});
