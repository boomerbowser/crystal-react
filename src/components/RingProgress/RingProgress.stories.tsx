import type { Meta, StoryObj } from '@storybook/react-vite';
import { RingProgress } from './RingProgress.js';

const meta = {
  title: 'Feedback/Ring progress',
  component: RingProgress,
  parameters: {
    docs: {
      description: {
        component:
          'The circular form of `Progress`, with the same semantics, including the rule that '
          + 'an indeterminate ring carries no value.\n\n'
          + 'The centre label is not the only representation. The number in the middle is a '
          + 'convenience. The value lives in `aria-valuetext`, so a ring rendered without a '
          + 'centre label loses nothing an assistive technology needs.\n\n'
          + 'The stroke is `--cr-progress-ring-stroke`, which Crystal publishes as one value for '
          + 'this and for the gauge arc the catalogue says matches it. A gauge is a progress '
          + 'ring that has been told what it is measuring, and one token keeps the two the same.',
      },
    },
  },
  /* See `Progress`: indeterminate is the absence of `value`, not `undefined`. */
  args: { label: 'Sync' },
} satisfies Meta<typeof RingProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Determinate: Story = { args: { value: 68, centre: '68%' } };

export const Indeterminate: Story = {};

export const WithoutACentreLabel: Story = { args: { value: 68 } };

export const Failed: Story = {
  args: { value: 32, state: 'error', centre: '32%', valueLabel: 'Failed at 32%' },
};

export const Large: Story = { args: { value: 68, centre: '68%', size: 160 } };
