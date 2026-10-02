import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heatmap } from './Heatmap.js';

const meta = {
  title: 'Charts/Heatmap',
  component: Heatmap,
  parameters: {
    docs: {
      description: {
        component:
          '"Intensity is paired with a value; colour alone never carries meaning." Every cell is '
          + "labelled with its number, and every cell's label reads on its own paint, because "
          + "Crystal's intensity ramp ships the ink for each step. A single ink across a "
          + 'five-step ramp is unreadable at one end of it.\n\n'
          + 'The buckets are equal-width, never quantiles. Quantiles put the same number of '
          + 'cells in each bucket, so any data looks evenly spread. A week where one day had four '
          + 'times the traffic would look exactly like a week where every day was the same.\n\n'
          + 'Under forced colours the ramp becomes one colour, so the intensity becomes the '
          + '*size* of the mark instead. A strong cell fills its square and a weak one is a small '
          + 'square inside it.',
      },
    },
  },
  args: {
    label: 'Incidents by day and region',
    rows: [
      [2, 0, 5, 3, 9, 1, 0],
      [1, 4, 2, 8, 6, 0, null],
      [0, 1, 0, 2, 3, 7, 4],
    ],
    rowLabels: ['Europe', 'Americas', 'Asia'],
    columnLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  },
} satisfies Meta<typeof Heatmap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Cells too small for a number still carry it in their label and in the table. */
export const Dense: Story = {
  args: {
    label: 'Requests by hour',
    height: 200,
    showValues: false,
    rowLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    columnLabels: Array.from({ length: 24 }, (_, h) => String(h)),
    rows: Array.from({ length: 5 }, (_, d) => Array.from({ length: 24 }, (_, h) => (
      Math.round(20 + Math.sin((h - 6) / 3.4) * 18 + d * 3)
    ))),
  },
};

/** A fixed range, so two heatmaps of different weeks are comparable. */
export const AFixedRange: Story = { args: { domain: [0, 20] } };
