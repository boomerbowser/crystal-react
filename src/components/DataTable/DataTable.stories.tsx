import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { only } from '../../../.storybook/environment.js';
import { Pagination } from '../Pagination/Pagination.js';
import { DataTable, type DataTableRow, type DataTableSelection, type DataTableSort } from './DataTable.js';

const columns = [
  { id: 'workspace', header: 'Workspace', isSortable: true, isResizable: true, width: '2fr' as const },
  { id: 'plan', header: 'Plan', isResizable: true },
  { id: 'seats', header: 'Seats', isSortable: true, align: 'end' as const },
  { id: 'renews', header: 'Renews' },
];

const rows: DataTableRow[] = [
  { id: 'gather', name: 'Gather', cells: { workspace: 'Gather', plan: 'Team', seats: '12', renews: '14 March 2027' } },
  { id: 'atlas', name: 'Atlas', cells: { workspace: 'Atlas', plan: 'Solo', seats: '1', renews: '2 April 2027' } },
  { id: 'harbour', name: 'Harbour', cells: { workspace: 'Harbour', plan: 'Team', seats: '34', renews: '9 June 2027' } },
  { id: 'prism', name: 'Prism', cells: { workspace: 'Prism', plan: 'Enterprise', seats: '210', renews: '30 November 2027' } },
];

const meta = {
  title: 'Data display/Data table',
  component: DataTable,
  parameters: {
    docs: {
      description: {
        component:
          'React Aria\'s `Table`, where this library\'s `Table` is a plain one — and the split is '
          + 'the catalogue\'s. A static table is a **document**: a reader moves through it with '
          + 'their screen reader\'s own table commands, and a plain `<table>` is what those '
          + 'commands are for. An interactive one is a **grid widget**: roving focus, arrow keys '
          + 'that move a cursor between cells, selection, controls inside cells — and '
          + '`role="grid"` is what tells assistive technology to switch from reading mode to '
          + 'interaction mode. Rendering the interactive one as a plain table leaves every one of '
          + 'those keys doing nothing.\n\n'
          + '**Selection is label weight, not a check badge on the row.** The checkbox is the '
          + 'control that makes the selection; the row shows that it *is* selected by being '
          + 'heavier, as every selected thing in Crystal does. React Aria composes each '
          + 'checkbox\'s name from its own label plus the row\'s text value, so the label passed '
          + 'in is the verb alone — "Select Gather" would otherwise announce as "Select Gather '
          + 'Gather", which is how that was found.',
      },
    },
  },
  args: { columns, rows, label: 'Workspaces' },
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Selection through real checkboxes, with the row heavier because it is
 *  selected rather than because a box is ticked. */
export const Selectable: Story = {
  render: (args) => {
    const Demo = () => {
      const [selected, setSelected] = useState<DataTableSelection>(new Set(['atlas']));
      return (
        <DataTable
          {...only(args)}
          selectionMode="multiple"
          selectedKeys={selected}
          onSelectionChange={setSelected}
        />
      );
    };
    return <Demo />;
  },
};

/** Sorting, driven. `aria-sort` lands on one header at a time, because it
 *  describes the table's order rather than each column's capability. */
export const Sortable: Story = {
  render: (args) => {
    const Demo = () => {
      const [sort, setSort] = useState<DataTableSort>({ column: 'seats', direction: 'descending' });
      const ordered = [...rows].sort((a, b) => {
        const left = String(a.cells[String(sort.column)] ?? '');
        const right = String(b.cells[String(sort.column)] ?? '');
        const compare = sort.column === 'seats'
          ? Number(left) - Number(right)
          : left.localeCompare(right);
        return sort.direction === 'ascending' ? compare : -compare;
      });
      return <DataTable {...only(args)} rows={ordered} sortDescriptor={sort} onSortChange={setSort} />;
    };
    return <Demo />;
  },
};

/** With paging under it. `Pagination` is its own component; the table's footer
 *  is where it sits. */
export const WithPaging: Story = {
  args: {
    rows: rows.slice(0, 2),
    footer: <Pagination total={2} page={1} onPageChange={() => undefined} aria-label="Workspace pages" />,
  },
};

export const Empty: Story = {
  args: { rows: [], empty: 'No workspaces yet.' },
};
