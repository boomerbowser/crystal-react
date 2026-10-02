import type { Meta, StoryObj } from '@storybook/react-vite';
import { SemiCircleProgress } from './SemiCircleProgress.js';

const meta = {
  title: 'Feedback/Semi-circle progress',
  component: SemiCircleProgress,
  parameters: {
    docs: {
      description: {
        component:
          'A half-ring, on the ring progress stroke contract. The catalogue asks for '
          + '`role="progressbar"` with a text value beside it, so the value is on the screen as '
          + 'well as in the accessible tree.\n\n'
          + 'Its indeterminate state is the whole arc at reduced strength, and nothing travels. '
          + 'A segment sliding from one end of a half circle to the other and jumping back reads '
          + 'as a value that reset.',
      },
    },
  },
  /* See `Progress`: indeterminate is the absence of `value`, not `undefined`. */
  args: { label: 'Battery' },
} satisfies Meta<typeof SemiCircleProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Determinate: Story = { args: { value: 70 } };

export const Indeterminate: Story = {};

export const Full: Story = { args: { value: 100, valueLabel: 'Charged' } };
