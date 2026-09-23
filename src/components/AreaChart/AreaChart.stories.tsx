import type { Meta, StoryObj } from '@storybook/react-vite';
import { AreaChart } from './AreaChart.js';

const meta = {
  title: 'Charts/Area chart',
  component: AreaChart,
  parameters: {
    docs: {
      description: {
        component:
          '"Fill never obscures gridlines beneath it." That is the design of this component: '
          + 'the fill is Crystal\'s `--cr-chart-fill-opacity` rather than a solid, so two '
          + 'overlapping series are still two and the gridlines a reader measures against are '
          + 'still legible through both. A solid area chart with three series is a picture of '
          + 'the topmost series and two rumours.\n\n'
          + 'Stacked changes what the chart *means* rather than only how it looks: unstacked '
          + 'areas each measure from zero and overlap, stacked ones measure from the one below '
          + 'and the top edge is the total. So a stacked chart\'s table carries the total '
          + 'column — the total is what the picture is asserting, and a reader should not have '
          + 'to add six numbers to check it.',
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
 *  quietly wrong. */
export const SmoothStacked: Story = { args: { stacked: true, curve: 'smooth' } };

export const OneSeries: Story = {
  args: {
    label: 'Sessions',
    series: [{ name: 'Sessions', values: [12, 18, 15, 22, 19, 26] }],
    points: true,
  },
};
