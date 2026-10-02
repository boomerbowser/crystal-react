import type { Meta, StoryObj } from '@storybook/react-vite';
import { DescriptionList } from './DescriptionList.js';

const items = [
  { id: 'status', term: 'Status', value: 'Active' },
  { id: 'plan', term: 'Plan', value: 'Team, billed annually' },
  { id: 'seats', term: 'Seats', value: '12 of 20 used' },
  { id: 'renews', term: 'Renews', value: '14 March 2027' },
];

const meta = {
  title: 'Data display/Description list',
  component: DescriptionList,
  parameters: {
    docs: {
      description: {
        component:
          'Term and value pairs as a real `dl`, because a grid of divs cannot keep the term and '
          + 'the value associated. A screen reader moves through a two-column layout out of '
          + 'order, so "Status" and "Active" in separate cells are two unrelated words. In a '
          + 'definition list they are a pair. Each pair is wrapped in a `div`, which HTML allows '
          + 'inside `dl` so the pairs can be laid out as rows without breaking that association.',
      },
    },
  },
  args: { items, stacked: false },
} satisfies Meta<typeof DescriptionList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Term above value, for a narrow column. */
export const Stacked: Story = {
  args: { stacked: true },
};

export const Empty: Story = {
  args: { items: [], empty: 'No details recorded.' },
};
