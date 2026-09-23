import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { ResizableTable } from './ResizableTable.js';

const columns = [
  { id: 'workspace', header: 'Workspace' },
  { id: 'plan', header: 'Plan' },
  { id: 'seats', header: 'Seats', isResizable: false, align: 'end' as const },
];

const rows = [
  { id: 'gather', name: 'Gather', cells: { workspace: 'Gather', plan: 'Team', seats: '12' } },
];

describe('ResizableTable', () => {
  /* The difference from `DataTable`: resizing is the point, so it is opt-out
     rather than opt-in. */
  it('makes every column resizable unless it says otherwise', () => {
    renderWithCrystal(<ResizableTable columns={columns} rows={rows} label="Workspaces" />);
    expect(screen.getByRole('slider', { name: 'Resize Workspace' })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Resize Plan' })).toBeInTheDocument();
    expect(screen.queryByRole('slider', { name: /Seats/ })).toBeNull();
  });

  /* "The resizer is a slider: arrow keys resize, and the new width is
     announced." The *announcement* is assertable here; the resize is not —
     jsdom has no layout, so every column is the same default width and an
     arrow key has nothing to move. The width actually changing is checked in a
     browser, by `verify:behaviour`, which is where every other assertion made
     of layout in this library lives. */
  it('announces the width as a real slider value', () => {
    renderWithCrystal(<ResizableTable columns={columns} rows={rows} label="Workspaces" />);
    const resizer = screen.getByRole('slider', { name: 'Resize Workspace' }) as HTMLInputElement;
    expect(resizer.type).toBe('range');
    expect(resizer).toHaveAttribute('aria-valuetext', expect.stringMatching(/pixels/));
    /* A range with somewhere to go, which is what makes the arrow keys mean
       something once there is layout for them to act on. */
    expect(Number(resizer.max)).toBeGreaterThan(Number(resizer.min));
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <ResizableTable columns={columns} rows={rows} label="Workspaces" />,
    );
    await expectNoAxeViolations(container);
  });
});
