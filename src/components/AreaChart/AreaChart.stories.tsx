import type { Meta, StoryObj } from '@storybook/react-vite';
import { AreaChart } from './AreaChart.js';

const meta = {
  title: 'Charts/Area chart',
  component: AreaChart,
  parameters: {
    docs: {
      description: {
        component:
          '"Fill never obscures gridlines beneath it." The fill is Crystal\'s '
          + '`--cr-chart-fill-opacity` and not a solid, so two overlapping series stay distinct '
          + 'and the gridlines a reader measures against stay legible through both. A solid area '
          + 'chart with three series hides everything below the topmost one.\n\n'
          + 'Stacking changes what the chart means. Unstacked areas each measure from zero and '
          + 'overlap. Stacked ones measure from the one below, and the top edge is the total. A '
          + 'stacked chart\'s table carries a total column, so a reader does not have to add six '
          + 'numbers to check it.',
      },
    },
  },
  args: {
    label: 'Sessions by source',
    description: 'Half-year to June, in thousands',
    series: [
      { name: 'Direct', values: [12, 18, 15, 22, 19, 26] },
      { name: 'Referral', values: [8, 9, 11, 10, 12, 13] },
      { name: 'Search', values: [15, 14, 17, 19, 21, 20] },
    ],
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  },
} satisfies Meta<typeof AreaChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Three overlapping series at a quarter opacity. Every one is still readable,
 *  and so are the gridlines. */
export const Overlapping: Story = {};

/** Stacked, where the top edge is the total. */
export const Stacked: Story = { args: { stacked: true } };

/** Smoothed and stacked, which is the case a reversed-path implementation gets
 *  wrong. */
export const SmoothStacked: Story = { args: { stacked: true, curve: 'smooth' } };

export const OneSeries: Story = {
  args: {
    label: 'Sessions',
    series: [{ name: 'Sessions', values: [12, 18, 15, 22, 19, 26] }],
    points: true,
  },
};
