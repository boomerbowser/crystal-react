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
          + 'the value rather than faking one**. There is deliberately no `indeterminate` flag: '
          + 'omit `value` and you get the indeterminate bar, so "we do not know" cannot be typed '
          + 'beside a number.\n\n'
          + 'The track is the slider\'s track — Crystal\'s `component.slider.trackHeight` at pill '
          + 'radius — because the catalogue says "matching the slider track", and that is a '
          + 'sentence about two components that must not drift.\n\n'
          + '`progress-change` plays when the value actually moves, after it has been applied. '
          + 'The indeterminate travel is not a Crystal recipe: Crystal publishes none for a '
          + 'continuous activity indicator, so its timing is Crystal\'s and its shape is this '
          + "component's. Under reduced motion it becomes a still, filled track — busy, and "
          + 'plainly not a measurement.',
      },
    },
  },
  /* `value` is not a meta arg. With `exactOptionalPropertyTypes`, a story
     cannot express "indeterminate" as `value: undefined` — it has to omit the
     prop, which is exactly the distinction the component itself makes. */
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
