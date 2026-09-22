import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, within } from '../../test/render.js';
import { Table, nextSort, type TableSort } from './Table.js';

const columns = [
  { id: 'name', header: 'Name', sortable: true },
  { id: 'plan', header: 'Plan' },
  { id: 'seats', header: 'Seats', sortable: true, align: 'end' as const },
];

const rows = [
  { id: 'a', cells: { name: 'Gather', plan: 'Team', seats: '12' } },
  { id: 'b', cells: { name: 'Atlas', plan: 'Solo', seats: '1' }, isSelected: true },
];

describe('Table', () => {
  /* There is no ARIA pattern that recovers header association once the elements
     are divs, which is the whole reason this is a real table. */
  it('is a real table with a scope on every header', () => {
    const { container } = renderWithCrystal(<Table columns={columns} rows={rows} label="Workspaces" />);
    expect(container.querySelector('table')).not.toBeNull();
    const columnHeaders = [...container.querySelectorAll('thead th')];
    expect(columnHeaders).toHaveLength(3);
    expect(columnHeaders.every((th) => th.getAttribute('scope') === 'col')).toBe(true);
    /* And the first cell of each row is the row's header. */
    const rowHeaders = [...container.querySelectorAll('tbody th')];
    expect(rowHeaders).toHaveLength(2);
    expect(rowHeaders.every((th) => th.getAttribute('scope') === 'row')).toBe(true);
  });

  /* `aria-sort` describes the table's current order, not each column's
     capability — so exactly one header carries it, and a sortable column that is
     not sorted carries nothing. */
  it('puts aria-sort on one header only, and on the header rather than the button', () => {
    const sort: TableSort = { column: 'name', direction: 'ascending' };
    const { container } = renderWithCrystal(
      <Table columns={columns} rows={rows} label="Workspaces" sort={sort} onSortChange={vi.fn()} />,
    );
    const sorted = [...container.querySelectorAll('[aria-sort]')];
    expect(sorted).toHaveLength(1);
    expect(sorted[0]?.tagName).toBe('TH');
    expect(sorted[0]).toHaveAttribute('aria-sort', 'ascending');
    expect(screen.getByRole('button', { name: /Name/ })).not.toHaveAttribute('aria-sort');
  });

  it('offers sorting as a button, and asks for the next order when pressed', async () => {
    const onSortChange = vi.fn();
    renderWithCrystal(
      <Table columns={columns} rows={rows} label="Workspaces"
        sort={{ column: 'name', direction: 'ascending' }} onSortChange={onSortChange} />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Name/ }));
    expect(onSortChange).toHaveBeenCalledWith({ column: 'name', direction: 'descending' });
  });

  it('starts a new column ascending and then alternates', () => {
    expect(nextSort('seats', undefined)).toEqual({ column: 'seats', direction: 'ascending' });
    expect(nextSort('seats', { column: 'name', direction: 'descending' }))
      .toEqual({ column: 'seats', direction: 'ascending' });
    expect(nextSort('seats', { column: 'seats', direction: 'ascending' }))
      .toEqual({ column: 'seats', direction: 'descending' });
  });

  it('gives no sort control to a column that is not sortable', () => {
    renderWithCrystal(
      <Table columns={columns} rows={rows} label="Workspaces" onSortChange={vi.fn()} />,
    );
    expect(screen.queryByRole('button', { name: /Plan/ })).toBeNull();
  });

  /* The shell scrolls, and a scroll container with nothing focusable in it
     cannot be reached without a pointer. */
  it('makes the scrolling shell a named, focusable region', () => {
    renderWithCrystal(<Table columns={columns} rows={rows} label="Workspaces" />);
    const region = screen.getByRole('region', { name: 'Workspaces' });
    expect(region).toHaveAttribute('tabindex', '0');
    expect(region.className).toMatch(/cr-table-scroll/);
  });

  it('shows the empty state instead of an empty body', () => {
    renderWithCrystal(<Table columns={columns} rows={[]} label="Workspaces" empty="No workspaces yet." />);
    expect(screen.getByText('No workspaces yet.')).toBeInTheDocument();
  });

  it('marks a selected row as data rather than only as a class', () => {
    const { container } = renderWithCrystal(<Table columns={columns} rows={rows} label="Workspaces" />);
    expect(container.querySelectorAll('tbody tr[data-selected]')).toHaveLength(1);
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <Table columns={columns} rows={rows} label="Workspaces" caption="Workspaces and their seats"
        sort={{ column: 'seats', direction: 'descending' }} onSortChange={vi.fn()} />,
    );
    await expectNoAxeViolations(container);
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(3);
  });
});
