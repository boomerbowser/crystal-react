import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { TrendIndicator } from './TrendIndicator.js';

const meta = {
  title: 'Data display/Trend indicator',
  component: TrendIndicator,
  parameters: {
    docs: {
      description: {
        component:
          '"Direction is carried by a word and a symbol, never by colour alone." The component '
          + 'enforces three consequences. The words are required, because a direction with no '
          + 'words is a coloured arrow. The arrow is `aria-hidden`, because a reader who hears '
          + 'both hears it twice. `flat` takes the supporting ink instead of a third status '
          + 'colour, because "no change" is not a status and a status colour makes every '
          + 'unremarkable figure look like a report.',
      },
    },
  },
  args: { direction: 'up', children: '4.2% up on last month' },
} satisfies Meta<typeof TrendIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** All three, with the words that make each one readable without the colour. */
export const Directions: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cr-spacing-xs)' }}>
      <TrendIndicator {...only(args)} direction="up">4.2% up on last month</TrendIndicator>
      <TrendIndicator {...only(args)} direction="down">1.1% down on last month</TrendIndicator>
      <TrendIndicator {...only(args)} direction="flat">No change on last month</TrendIndicator>
    </div>
  ),
};
