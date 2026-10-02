import type { Meta, StoryObj } from '@storybook/react-vite';
import { ScatterChart } from './ScatterChart.js';

const rand = (seed: number) => {
  let value = seed;
  return () => {
    value = (value * 1103515245 + 12345) % 2147483648;
    return value / 2147483648;
  };
};

const next = rand(7);

const meta = {
  title: 'Charts/Scatter chart',
  component: ScatterChart,
  parameters: {
    docs: {
      description: {
        component:
          '"Point size is a scale, not an arbitrary radius." A third value is mapped onto '
          + "Crystal's point scale by area rather than by diameter. A point twice as wide is "
          + 'four times as big to the eye, so sizing by diameter doubles every difference in '
          + 'the data without saying so.\n\n'
          + '"Dense regions remain describable; a table equivalent is required." The table is '
          + 'the surface\'s and is never optional. This chart also keeps a dense region '
          + 'navigable: every point is a mark, the arrow keys move between them in the order '
          + 'given, and each says both of its coordinates.\n\n'
          + "Both axes fit their data. A scatter's marks are positions in both directions, so "
          + "the bar chart's zero rule does not apply in either.",
      },
    },
  },
  args: {
    label: 'Sessions against seats',
    xLabel: 'Seats',
    yLabel: 'Sessions',
    series: [{
      name: 'Accounts',
      points: Array.from({ length: 24 }, (_, i) => ({
        x: Math.round(2 + next() * 40),
        y: Math.round(20 + next() * 200),
        name: `Account ${i + 1}`,
      })),
    }],
  },
} satisfies Meta<typeof ScatterChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Two series, told apart by shape as well as colour. */
export const TwoSeries: Story = {
  args: {
    series: [
      {
        name: 'Trial',
        points: Array.from({ length: 16 }, () => ({
          x: Math.round(2 + next() * 18), y: Math.round(10 + next() * 90),
        })),
      },
      {
        name: 'Paid',
        points: Array.from({ length: 16 }, () => ({
          x: Math.round(14 + next() * 30), y: Math.round(60 + next() * 160),
        })),
      },
    ],
  },
};

/** A third value as the point's area. */
export const Sized: Story = {
  args: {
    label: 'Sessions against seats, sized by spend',
    series: [{
      name: 'Accounts',
      points: Array.from({ length: 18 }, (_, i) => ({
        x: Math.round(2 + next() * 40),
        y: Math.round(20 + next() * 200),
        size: Math.round(1 + next() * 40),
        name: `Account ${i + 1}`,
      })),
    }],
    formatSize: (value: number) => `£${value}k spend`,
  },
};
