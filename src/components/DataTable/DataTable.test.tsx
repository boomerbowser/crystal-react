import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, within } from '../../test/render.js';
import { DataTable } from './DataTable.js';

const columns = [
  { id: 'workspace', header: 'Workspace', isSortable: true, isResizable: true },
  { id: 'plan', header: 'Plan' },
  { id: 'seats', header: 'Seats', isSortable: true, align: 'end' as const },
];

const rows = [
  { id: 'gather', name: 'Gather', cells: { workspace: 'Gather', plan: 'Team', seats: '12' } },
  { id: 'atlas', name: 'Atlas', cells: { workspace: 'Atlas', plan: 'Solo', seats: '1' } },
];

describe('DataTable', () => {
  /* An interactive table is a grid widget: roving focus, arrow keys between
     cells, controls inside cells. `role="grid"` is what tells assistive
     technology to switch from reading mode to interaction mode. */
  it('is a grid, where the static Table is a document', () => {
    renderWithCrystal(<DataTable columns={columns} rows={rows} label="Workspaces" />);
    expect(screen.getByRole('grid', { name: 'Workspaces' })).toBeInTheDocument();
  });

  /* "Row selection through real checkboxes with names": a reader tabbing
     through them hears "Select Gather" rather than "checkbox" twice. React Aria
     composes that name from the checkbox's own label *plus* the row's text
     value, which is why the label passed in is the verb alone — "Select Gather"
     would produce "Select Gather Gather". */
  it('names every selection checkbox after its row', () => {
    renderWithCrystal(
      <DataTable columns={columns} rows={rows} label="Workspaces" selectionMode="multiple" />,
    );
    expect(screen.getByRole('checkbox', { name: 'Select Gather' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Select Atlas' })).toBeInTheDocument();
    /* And not "Select Gather Gather", which is what naming it by hand gives. */
    expect(screen.getByRole('checkbox', { name: 'Select all rows' })).toBeInTheDocument();
  });

  it('reports what was selected', async () => {
    const onSelectionChange = vi.fn();
    renderWithCrystal(
      <DataTable columns={columns} rows={rows} label="Workspaces" selectionMode="multiple"
        onSelectionChange={onSelectionChange} />,
    );
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Gather' }));
    expect(onSelectionChange).toHaveBeenCalled();
    expect(screen.getByRole('row', { name: /Gather/ })).toHaveAttribute('aria-selected', 'true');
  });

  /* Single selection has nothing to select all of, so there is no such box. */
  it('offers no select-all when only one row can be selected', () => {
    renderWithCrystal(
      <DataTable columns={columns} rows={rows} label="Workspaces" selectionMode="single" />,
    );
    expect(screen.queryByRole('checkbox', { name: 'Select all rows' })).toBeNull();
  });

  it('puts aria-sort on the sorted header and on no other', async () => {
    const onSortChange = vi.fn();
    const { container } = renderWithCrystal(
      <DataTable columns={columns} rows={rows} label="Workspaces"
        sortDescriptor={{ column: 'seats', direction: 'descending' }} onSortChange={onSortChange} />,
    );
    const sorted = [...container.querySelectorAll('[aria-sort]:not([aria-sort="none"])')];
    expect(sorted).toHaveLength(1);
    expect(sorted[0]).toHaveAttribute('aria-sort', 'descending');

    await userEvent.click(screen.getByRole('columnheader', { name: /Workspace/ }));
    expect(onSortChange).toHaveBeenCalled();
  });

  /* "The resizer is a slider: arrow keys resize, and the new width is
     announced." */
  it('offers the resizer as a named slider', () => {
    renderWithCrystal(<DataTable columns={columns} rows={rows} label="Workspaces" resizable />);
    /* "Resize" plus the column React Aria appends, and the width announced as
       `aria-valuetext` — "the new width is announced" is React Aria's to do and
       this asserts it arrived. */
    const resizer = screen.getByRole('slider', { name: 'Resize Workspace' });
    expect(resizer).toHaveAttribute('aria-valuetext', expect.stringMatching(/pixels/));
  });

  it('gives no resizer to a column that did not ask for one', () => {
    renderWithCrystal(<DataTable columns={columns} rows={rows} label="Workspaces" resizable />);
    expect(screen.queryByRole('slider', { name: /Plan/ })).toBeNull();
  });

  it('shows the empty state instead of an empty body', () => {
    renderWithCrystal(
      <DataTable columns={columns} rows={[]} label="Workspaces" empty="No workspaces yet." />,
    );
    expect(screen.getByText('No workspaces yet.')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <DataTable columns={columns} rows={rows} label="Workspaces" selectionMode="multiple"
        sortDescriptor={{ column: 'seats', direction: 'ascending' }} onSortChange={vi.fn()} />,
    );
    await expectNoAxeViolations(container);
    expect(within(screen.getByRole('grid')).getAllByRole('row')).toHaveLength(3);
  });
});
