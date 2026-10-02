import type { Meta, StoryObj } from '@storybook/react-vite';
import { Progress } from './Progress.js';

const meta = {
  title: 'Feedback/Progress',
  component: Progress,
  parameters: {
    docs: {
      description: {
        component:
          '`role="progressbar"` with `aria-valuenow` when determinate; **indeterminate omits '
          + 'the value rather than faking one**. There is deliberately no `indeterminate` flag. '
          + 'Omit `value` and you get the indeterminate bar, so "we do not know" cannot be typed '
          + 'beside a number.\n\n'
          + 'The track is the slider\'s track (Crystal\'s `component.slider.trackHeight` at pill '
          + 'radius). The catalogue says "matching the slider track", so the two components '
          + 'must not drift.\n\n'
          + '`progress-change` plays when the value actually moves, after it has been applied. '
          + 'The indeterminate travel is Crystal\'s continuous recipe `activity-travel`, which '
          + 'runs only while the work is pending. Under reduced motion it becomes a still, '
          + 'filled track, which reads as busy and not as a measurement.',
      },
    },
  },
  /* `value` is not a meta arg. With `exactOptionalPropertyTypes`, a story
     cannot express "indeterminate" as `value: undefined`. It has to omit the
     prop, which is the same distinction the component makes. */
  args: { label: 'Uploading' },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Determinate: Story = { args: { value: 40 } };

export const Indeterminate: Story = {};

export const Complete: Story = { args: { value: 100, valueLabel: 'Done' } };

export const Failed: Story = {
  args: { value: 40, state: 'error', valueLabel: 'Failed at 40%' },
};

export const Paused: Story = {
  args: { value: 62, state: 'paused', valueLabel: 'Paused at 62%' },
};

export const LabelledButHidden: Story = { args: { value: 40, hideLabel: true } };
