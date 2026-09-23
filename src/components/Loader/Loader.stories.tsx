import type { Meta, StoryObj } from '@storybook/react-vite';
import { Loader } from './Loader.js';

const meta = {
  title: 'Feedback/Loader',
  component: Loader,
  parameters: {
    docs: {
      description: {
        component:
          '"Accompanied by text saying what is loading" — so the text is a **required** prop. '
          + 'A bare spinner tells a sighted reader that something is happening and everyone '
          + 'else nothing at all; and even for them, "is this stuck, and on what" is usually '
          + 'the question.\n\n'
          + '`role="status"`, not `role="progressbar"`: there is no range and no position, and '
          + 'a progressbar without either has to be explained.\n\n'
          + 'The mark is the same `ActivityArc` an indeterminate `RingProgress` draws, so a '
          + 'loader and a ring progress cannot end up two sizes of the same idea. Under reduced '
          + 'motion the ring becomes one uniform dimmed circle rather than an arc stopped '
          + 'somewhere — a sixth of a circle frozen at an angle reads as a position, and the '
          + 'whole point of the shape is that there is none.',
      },
    },
  },
  args: { label: 'Loading invoices' },
} satisfies Meta<typeof Loader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Medium: Story = {};
export const Small: Story = { args: { size: 'small' } };
export const Large: Story = { args: { size: 'large' } };
export const WordsForScreenReadersOnly: Story = { args: { hideLabel: true } };
