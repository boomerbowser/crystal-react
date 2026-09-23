import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, within } from '../../test/render.js';
import { DataView } from './DataView.js';

const items = [
  { id: 'a', content: <p>Gather</p> },
  { id: 'b', content: <p>Atlas</p> },
  { id: 'c', content: <p>Harbour</p> },
];

describe('DataView', () => {
  /* A grid of items is still a list of items: the arrangement is a visual
     choice and the count is information, so a reader is told "3 items" in
     either layout. */
  it('is a real list in both layouts', () => {
    const { rerenderWithCrystal } = renderWithCrystal(
      <DataView items={items} label="Workspaces" layout="grid" />,
    );
    expect(within(screen.getByRole('list')).getAllByRole('listitem')).toHaveLength(3);
    rerenderWithCrystal(<DataView items={items} label="Workspaces" layout="list" />);
    expect(within(screen.getByRole('list')).getAllByRole('listitem')).toHaveLength(3);
  });

  /* "The layout switch is a control with a pressed state, not a hidden toggle."
     It is a named radio group rather than `aria-pressed`, and the divergence is
     deliberate: picking one of two arrangements is a choice rather than a
     pressed state, and Crystal's segmented control and React Aria's
     single-selection toggle group both reach `role="radiogroup"` independently.
     What the clause rules out — two unlabelled icons whose state is a colour —
     is ruled out at least as firmly. */
  it('offers the layout switch as a named group of real options', async () => {
    const onLayoutChange = vi.fn();
    renderWithCrystal(
      <DataView items={items} label="Workspaces" defaultLayout="grid" onLayoutChange={onLayoutChange} />,
    );
    const group = screen.getByRole('radiogroup', { name: 'Layout' });
    expect(within(group).getByRole('radio', { name: 'Grid' })).toBeChecked();
    expect(within(group).getByRole('radio', { name: 'List' })).not.toBeChecked();

    await userEvent.click(within(group).getByRole('radio', { name: 'List' }));
    expect(onLayoutChange).toHaveBeenCalledWith('list');
    expect(screen.getByRole('radio', { name: 'List' })).toBeChecked();
  });

  it('names the switch with visible text rather than an aria-label', () => {
    renderWithCrystal(<DataView items={items} label="Workspaces" />);
    expect(screen.getByText('Layout')).toBeInTheDocument();
  });

  it('carries the layout as data, so one rule per layout arranges the grid', () => {
    const { container } = renderWithCrystal(<DataView items={items} label="Workspaces" layout="list" />);
    expect(container.querySelector('section')?.dataset['layout']).toBe('list');
  });

  it('can be told it has only one arrangement', () => {
    renderWithCrystal(<DataView items={items} label="Workspaces" switchable={false} />);
    expect(screen.queryByRole('radiogroup')).toBeNull();
  });

  it('shows the empty state instead of an empty list', () => {
    renderWithCrystal(<DataView items={[]} label="Workspaces" empty="No workspaces yet." />);
    expect(screen.getByText('No workspaces yet.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <DataView items={items} label="Workspaces" toolbar={<span>3 workspaces</span>} />,
    );
    await expectNoAxeViolations(container);
  });
});
