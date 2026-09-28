import type { Meta, StoryObj } from '@storybook/react-vite';
import { DataTableBlock } from './DataTableBlock.js';
import { SearchInput } from '../SearchInput/SearchInput.js';

const columns = [
  { id: 'order', header: 'Order' },
  { id: 'customer', header: 'Customer' },
  { id: 'total', header: 'Total', align: 'end' as const },
];
const rows = [
  { id: 'a', name: 'Order 1042', cells: { order: '1042', customer: 'Ada Okafor', total: '£120.00' } },
  { id: 'b', name: 'Order 1043', cells: { order: '1043', customer: 'Bo Lindqvist', total: '£48.50' } },
  { id: 'c', name: 'Order 1044', cells: { order: '1044', customer: 'Chen Wei', total: '£310.20' } },
  { id: 'd', name: 'Order 1045', cells: { order: '1045', customer: 'Dara Byrne', total: '£72.00' } },
];
const noun = (count: number): string => (count === 1 ? 'order' : 'orders');

const meta = {
  title: 'Blocks/DataTableBlock',
  component: DataTableBlock,
  parameters: {
    docs: {
      description: {
        component:
          '"Selection count is announced; bulk actions describe what they will affect."\n\n'
          + 'A bulk action is a verb and a function from the count to the sentence its '
          + 'button says, so a button cannot read "Archive" while three rows are selected — '
          + 'it reads "Archive 3 orders". `selecting` is not a prop: it is what the block '
          + 'is in whenever anything is selected, so the two cannot disagree. Loading and '
          + 'failure replace the rows, because headers over no rows say "there are none"; '
          + 'empty keeps them, because there really are none.',
      },
    },
  },
  args: {
    title: 'Orders',
    label: 'Orders',
    columns,
    rows,
    filters: <SearchInput label="Search orders" />,
    bulkActions: [
      { id: 'archive', label: (count: number) => `Archive ${count} ${noun(count)}`, onAction: () => {} },
      { id: 'delete', label: (count: number) => `Delete ${count} ${noun(count)}`, onAction: () => {}, danger: true },
    ],
    selectedLabel: (count: number) => `${count} ${noun(count)} selected`,
    page: 1,
    totalPages: 4,
    onPageChange: () => {},
  },
} satisfies Meta<typeof DataTableBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Selecting: Story = { args: { defaultSelectedKeys: new Set(['a', 'c']) } };
export const Loading: Story = { args: { state: 'loading' } };
export const Empty: Story = { args: { state: 'empty', emptyLabel: 'No orders match these filters' } };
export const Failed: Story = { args: { state: 'error' } };
