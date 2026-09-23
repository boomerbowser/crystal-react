import type { Meta, StoryObj } from '@storybook/react-vite';
import { DonutChart } from './DonutChart.js';

const meta = {
  title: 'Charts/Donut chart',
  component: DonutChart,
  parameters: {
    docs: {
      description: {
        component:
          '"Ring thickness is a declared proportion of the radius" and "the centre value is '
          + 'text, not an image". Both are the whole difference between this and the pie, and '
          + 'both are decisions rather than styling.\n\n'
          + 'The thickness comes from Crystal rather than from the caller, so a donut is '
          + 'recognisably the same object at every size — one whose ring thins as it grows is '
          + 'two different components.\n\n'
          + 'The centre is real text in the document: selectable, translatable, read out. It is '
          + 'not the total by default, because the middle of a donut is the most valuable space '
          + 'in the chart and what belongs there is what the chart is *for*, which only the '
          + 'caller knows.',
      },
    },
  },
  args: {
    label: 'Sessions by source',
    slices: [
      { name: 'Direct', value: 50 },
      { name: 'Referral', value: 30 },
      { name: 'Search', value: 20 },
    ],
  },
} satisfies Meta<typeof DonutChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** With a summary in the middle. */
export const WithACentreValue: Story = {
  args: {
    centre: (
      <span>
        {/* Relative to the reader's own text, not a design value: the centre of a
            donut scales with the donut, and a fixed size would outgrow a small one. */}
        <strong style={{ display: 'block', fontSize: '1.6em' }}>100k</strong>{/* crystal-allow-literal */}
        {' sessions'}
      </span>
    ),
  },
};

/** A thinner ring, where the centre is carrying most of the meaning. */
export const Thin: Story = { args: { hole: 0.82, centre: <strong>61%</strong> } };
