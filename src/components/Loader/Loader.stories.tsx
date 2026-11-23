import type { Meta, StoryObj } from '@storybook/react-vite';
import { Loader } from './Loader.js';
import { only } from '../../../.storybook/environment.js';

const meta = {
  title: 'Feedback/Loader',
  component: Loader,
  parameters: {
    docs: {
      description: {
        component:
          '"Accompanied by text saying what is loading", so the text is a required prop. '
          + 'A bare spinner tells a sighted reader that something is happening and everyone '
          + 'else nothing at all. Even for a sighted reader, "is this stuck, and on what" is '
          + 'usually the question.\n\n'
          + '`role="status"`, not `role="progressbar"`: there is no range and no position, and '
          + 'a progressbar without either has to be explained.\n\n'
          + 'The mark is the same `ActivityArc` an indeterminate `RingProgress` draws, so a '
          + 'loader and a ring progress cannot end up two sizes of the same idea. Under reduced '
          + 'motion the ring becomes one uniform dimmed circle. A sixth of a circle frozen at '
          + 'an angle would read as a position, and the shape exists to show there is none.',
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

/** Every shape, at the large size. `spinner` is the default; the others suit
 *  places a ring does not, such as inside a line of text or a button. */
export const Shapes: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 'var(--cr-spacing-md)' }}>
      {(['spinner', 'dots', 'bars', 'pulse', 'infinity'] as const).map((variant) => (
        <Loader key={variant} {...only(args)} size="large" variant={variant} label={`Loading (${variant})`} />
      ))}
    </div>
  ),
};
