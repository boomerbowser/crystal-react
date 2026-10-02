import type { Meta, StoryObj } from '@storybook/react-vite';
import { Histogram } from './Histogram.js';

const times = Array.from({ length: 220 }, (_, i) => {
  const base = 90 + ((i * 37) % 160);
  return Math.round(base + Math.sin(i / 9) * 40);
});

const meta = {
  title: 'Charts/Histogram',
  component: Histogram,
  parameters: {
    docs: {
      description: {
        component:
          '"Bins meet without gaps." The x axis of a histogram is continuous and the bins '
          + 'partition it, so a gap between two bins draws a range where nothing was counted. '
          + 'The component computes the bins from the values. A caller who bins the data '
          + 'has to keep the bin edges and the axis in step by hand.'
          + '\n\n"Bin bounds and counts are text". Both appear in the mark\'s label and in the table.',
      },
    },
  },
  args: {
    label: 'Response times',
    description: 'Milliseconds, 220 requests',
    values: times,
    format: (value: number) => String(value),
    formatBin: (from: number, to: number) => `${Math.round(from)}–${Math.round(to)}ms`,
  },
} satisfies Meta<typeof Histogram>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Fewer, wider bins. */
export const Coarse: Story = { args: { bins: 5 } };

/** More, narrower ones. The axis labels thin out rather than colliding. */
export const Fine: Story = { args: { bins: 24 } };

/** A fixed range, so two histograms of different samples can be compared. */
export const AFixedRange: Story = { args: { domain: [0, 320], bins: 16 } };
