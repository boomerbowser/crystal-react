import type { Meta, StoryObj } from '@storybook/react-vite';
import { FunnelChart } from './FunnelChart.js';

const meta = {
  title: 'Charts/Funnel chart',
  component: FunnelChart,
  parameters: {
    docs: {
      description: {
        component:
          '"Each stage states its absolute and relative value." A stage can be relative to the '
          + 'first stage or to the one before. People mean different things by "conversion", so '
          + 'both shares are stated.\n\n'
          + '"Stages meet without gaps; labels sit outside when they do not fit." A funnel is '
          + 'one shape narrowing through its stages, so a gap between two would suggest '
          + 'something left the funnel other than by not converting.\n\n'
          + 'Drawn as bands and not as a tapering trapezoid. A trapezoid encodes each '
          + "stage's value in an area, which people read least accurately. A band encodes it in "
          + 'a width, which is a length, and people read lengths most accurately. The outline '
          + 'still narrows, so it still looks like a funnel.',
      },
    },
  },
  args: {
    label: 'Signup funnel',
    description: 'Last 30 days',
    stages: [
      { name: 'Visited', value: 12400 },
      { name: 'Signed up', value: 6120 },
      { name: 'Activated', value: 4180 },
      { name: 'Invited a colleague', value: 1960 },
      { name: 'Paid', value: 1020 },
    ],
    format: (value: number) => value.toLocaleString('en-GB'),
  },
} satisfies Meta<typeof FunnelChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** A sharp drop, where the last band is too narrow for its label and the label
 *  moves outside it. */
export const ASharpDrop: Story = {
  args: {
    stages: [
      { name: 'Visited', value: 48000 },
      { name: 'Signed up', value: 5200 },
      { name: 'Paid', value: 310 },
    ],
  },
};
