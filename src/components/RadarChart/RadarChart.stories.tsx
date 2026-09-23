import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadarChart } from './RadarChart.js';

const meta = {
  title: 'Charts/Radar chart',
  component: RadarChart,
  parameters: {
    docs: {
      description: {
        component:
          '"Axis labels sit outside the outer ring" and "axes are labelled; series are named". '
          + 'A radar is the chart most often shipped as a decorative polygon with no axis labels '
          + 'at all, at which point it says only "this shape is bigger than that shape" — which '
          + 'is not what the measures were for.\n\n'
          + '"Haze fill inside each series polygon", at Crystal\'s fill opacity, so two '
          + 'overlapping series stay two. The outline carries the series\' dash as well: two '
          + 'polygons at a quarter opacity are two very similar shapes, and the edge is what a '
          + 'reader follows round.\n\n'
          + 'Every axis of every series is a mark. A radar of six measures and two series is '
          + 'twelve numbers, and a reader who cannot see the shape needs all twelve rather than '
          + 'a description of the outline.',
      },
    },
  },
  args: {
    label: 'Review scores',
    series: [
      { name: 'This release', values: [8, 6, 9, 5, 7, 8] },
      { name: 'Last release', values: [6, 7, 5, 8, 4, 6] },
    ],
    axes: ['Speed', 'Clarity', 'Coverage', 'Stability', 'Docs', 'Support'],
    domain: [0, 10] as [number, number],
  },
} satisfies Meta<typeof RadarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** One series, which is the common case — a profile rather than a comparison. */
export const OneSeries: Story = {
  args: { series: [{ name: 'This release', values: [8, 6, 9, 5, 7, 8] }] },
};

/** Three, which is where the fill opacity and the dashes earn their keep. */
export const Three: Story = {
  args: {
    series: [
      { name: 'This release', values: [8, 6, 9, 5, 7, 8] },
      { name: 'Last release', values: [6, 7, 5, 8, 4, 6] },
      { name: 'Benchmark', values: [7, 7, 7, 7, 7, 7] },
    ],
  },
};
