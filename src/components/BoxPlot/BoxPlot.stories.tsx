import type { Meta, StoryObj } from '@storybook/react-vite';
import { BoxPlot } from './BoxPlot.js';

const meta = {
  title: 'Charts/Box plot',
  component: BoxPlot,
  parameters: {
    docs: {
      description: {
        component:
          '"Each summary statistic is reachable as text; outliers are counted, not only drawn." '
          + 'The second half is the one nobody does: a cluster of twelve outliers is twelve dots '
          + 'a sighted reader counts by eye and a reader who cannot see it is told nothing '
          + 'about. So the label says "3 outliers" and the table has a column for it beside the '
          + 'five numbers.\n\n'
          + '"Whisker caps align with the box width" — a narrower cap makes the whisker look '
          + 'like an arrow, which says direction where the data says extent.\n\n'
          + 'The five numbers are the caller\'s. This component does not compute quartiles, '
          + 'because there are several definitions of them and a chart that picked one would be '
          + 'asserting a statistic nobody chose.',
      },
    },
  },
  args: {
    label: 'Latency by region',
    description: 'Milliseconds',
    boxes: [
      { name: 'Europe', low: 42, q1: 58, median: 74, q3: 96, high: 128, outliers: [180, 212, 246] },
      { name: 'Americas', low: 51, q1: 66, median: 88, q3: 112, high: 150, outliers: [198] },
      { name: 'Asia', low: 68, q1: 92, median: 121, q3: 158, high: 204 },
    ],
    format: (value: number) => `${value}ms`,
  },
} satisfies Meta<typeof BoxPlot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** One group, with no outliers at all. */
export const NoOutliers: Story = {
  args: {
    label: 'Latency',
    boxes: [{ name: 'All regions', low: 42, q1: 66, median: 88, q3: 118, high: 164 }],
  },
};
