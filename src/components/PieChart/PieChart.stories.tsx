import type { Meta, StoryObj } from '@storybook/react-vite';
import { PieChart } from './PieChart.js';

const meta = {
  title: 'Charts/Pie chart',
  component: PieChart,
  parameters: {
    docs: {
      description: {
        component:
          '"Each segment is labelled with its value; the total is stated." The second is the '
          + 'one people leave out. A pie asserts that its segments are *the whole of something*, '
          + 'and a reader cannot check that, or notice that 4% is missing, unless the total is '
          + 'written down. It is always in the table.\n\n'
          + 'A wedge is an area, so its second channel is the label rather than a hatch. The '
          + 'label is drawn only where the wedge can hold it; the same words are on the mark and '
          + 'in the table either way.\n\n'
          + 'Segments are separated by a hairline in the surface colour, a gap that shows the '
          + 'ground through, so two adjacent segments read as two pieces of one circle. The '
          + 'order is the caller\'s and is never sorted here.',
      },
    },
  },
  args: {
    label: 'Sessions by source',
    slices: [
      { name: 'Direct', value: 50 },
      { name: 'Referral', value: 30 },
      { name: 'Search', value: 14 },
      { name: 'Social', value: 6 },
    ],
  },
} satisfies Meta<typeof PieChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** A sliver too small for a label keeps its place in the picture and its row in
 *  the table. */
export const WithASliver: Story = {
  args: {
    slices: [
      { name: 'Direct', value: 78 },
      { name: 'Referral', value: 18 },
      { name: 'Search', value: 3 },
      { name: 'Social', value: 1 },
    ],
  },
};

/** More segments than the scale has colours. The seventh repeats the first, and
 *  the label tells them apart, as it always does. */
export const MoreThanSix: Story = {
  args: {
    label: 'Spend by category',
    slices: [
      { name: 'Salaries', value: 42 }, { name: 'Hosting', value: 15 },
      { name: 'Tooling', value: 12 }, { name: 'Travel', value: 9 },
      { name: 'Office', value: 8 }, { name: 'Legal', value: 7 },
      { name: 'Other', value: 7 },
    ],
  },
};

export const Empty: Story = { args: { slices: [] } };
