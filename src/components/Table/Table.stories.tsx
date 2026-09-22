import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { only } from '../../../.storybook/environment.js';
import { Table, type TableRow, type TableSort } from './Table.js';

const columns = [
  { id: 'workspace', header: 'Workspace', sortable: true },
  { id: 'plan', header: 'Plan' },
  { id: 'seats', header: 'Seats', sortable: true, align: 'end' as const },
  { id: 'renews', header: 'Renews' },
];

const rows: TableRow[] = [
  { id: 'gather', cells: { workspace: 'Gather', plan: 'Team', seats: '12', renews: '14 March 2027' } },
  { id: 'atlas', cells: { workspace: 'Atlas', plan: 'Solo', seats: '1', renews: '2 April 2027' } },
  { id: 'harbour', cells: { workspace: 'Harbour', plan: 'Team', seats: '34', renews: '9 June 2027' } },
  { id: 'prism', cells: { workspace: 'Prism', plan: 'Enterprise', seats: '210', renews: '30 November 2027' } },
];

const meta = {
  title: 'Data display/Table',
  component: Table,
  parameters: {
    docs: {
      description: {
        component:
          'A real `table` with `scope` on every header, because header association is what lets '
          + 'a reader hear "Seats, column 3, 12" while moving across a row — and there is no '
          + 'ARIA pattern that recovers it once the elements are divs.\n\n'
          + 'Sorting follows the catalogue\'s other clause, "sort controls are buttons carrying '
          + '`aria-sort`", with the two things that are easy to get wrong handled here: '
          + '`aria-sort` belongs on the `th` rather than the button inside it, and only *one* '
          + 'column may carry it, because it describes the table\'s current order rather than '
          + 'each column\'s capability.\n\n'
          + 'The shell scrolls rather than the page, so it is a named tab stop — a scroll '
          + 'container with nothing focusable in it cannot be reached without a pointer — and '
          + 'its scrollbar is Resin, because a compact horizontal scroller is a control plane. '
          + 'The material is Crystal\'s own `.cr-table` recipe value for value, down to the Haze '
          + 'fill being inset 6px here rather than the usual 8.',  // crystal-allow-literal: quoting the two insets in prose
      },
    },
  },
  args: { columns, rows, label: 'Workspaces', caption: 'Workspaces and their seats' },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Sorting, driven. Press a header and the order changes; a column that is not
 *  the sorted one carries no `aria-sort` at all. */
export const Sortable: Story = {
  render: (args) => {
    const Demo = () => {
      const [sort, setSort] = useState<TableSort>({ column: 'seats', direction: 'descending' });
      const ordered = [...rows].sort((a, b) => {
        const left = a.cells[sort.column] ?? '';
        const right = b.cells[sort.column] ?? '';
        const compare = sort.column === 'seats'
          ? Number(left) - Number(right)
          : String(left).localeCompare(String(right));
        return sort.direction === 'ascending' ? compare : -compare;
      });
      return (
        <Table
          {...only(args)}
          rows={ordered}
          sort={sort}
          onSortChange={(next) => { setSort(next); }}
        />
      );
    };
    return <Demo />;
  },
};

/** A selected row. Selection is label weight; the soft fill is the second
 *  signal, and in forced colours it becomes a Highlight ring rather than a fill,
 *  because Chromium's text backplate erases a filled row's words. */
export const WithASelectedRow: Story = {
  args: { rows: rows.map((row, index) => (index === 1 ? { ...row, isSelected: true } : row)) },
};

export const Empty: Story = {
  args: { rows: [], empty: 'No workspaces yet.' },
};

export const Loading: Story = {
  args: { rows: [], loading: true, onSortChange: fn() },
};
