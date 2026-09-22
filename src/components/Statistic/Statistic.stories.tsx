import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { Statistic } from './Statistic.js';

const meta = {
  title: 'Data display/Statistic',
  component: Statistic,
  parameters: {
    docs: {
      description: {
        component:
          'A large value with a label and an optional trend. "Trend direction is stated in text, '
          + 'not by colour or arrow alone", so `trend` carries a direction *and* the words that say '
          + 'it: the arrow is drawn beside the words and hidden from assistive technology. Figures '
          + 'are tabular, because a column of statistics whose digits do not line up cannot be read '
          + 'down its own length — which is the only reason to put them in a column.',
      },
    },
  },
  args: { label: 'Revenue', value: '£48,210', unit: 'this month' },
} satisfies Meta<typeof Statistic>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** All three directions. `flat` takes the muted ink rather than a third status
 *  colour: "no change" is not a status, and treating it as one would make every
 *  unremarkable figure look like a report. */
export const Trends: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--cr-spacing-2xl)' }}>
      <Statistic {...only(args)} label="Revenue" value="£48,210"
        trend={{ direction: 'up', label: '4.2% up on last month' }} />
      <Statistic {...only(args)} label="Refunds" value="£1,180"
        trend={{ direction: 'down', label: '1.1% down on last month' }} />
      <Statistic {...only(args)} label="Open tickets" value="34"
        trend={{ direction: 'flat', label: 'No change on last month' }} />
    </div>
  ),
};

/** The box keeps its size, so a row of statistics does not reflow as the figures
 *  arrive one at a time. */
export const Loading: Story = {
  args: { loading: true },
};
