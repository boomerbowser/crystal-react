import type { Meta, StoryObj } from '@storybook/react-vite';
import { Scrim } from './Scrim.js';
import { Card } from '../Card/Card.js';

const meta = {
  title: 'Overlays/Scrim',
  component: Scrim,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Mirage: the wash that separates a modal surface from the page beneath it. It is not '
          + '`aria-hidden` — it usually wraps the surface it separates, and hiding the wrapper would '
          + 'hide the dialog — and it needs no hiding: a div with no role and nothing focusable is '
          + 'already nothing to announce. It arrives with Crystal\'s `mirage` and, shown and hidden '
          + 'inside `AnimatePresence`, leaves with `mirage-out`.',
      },
    },
  },
  args: { isCentred: true },
  render: (args) => (
    <div style={{ position: 'relative', blockSize: 360 }}>
      <Scrim {...args}>
        <Card>A surface above the wash.</Card>
      </Scrim>
    </div>
  ),
} satisfies Meta<typeof Scrim>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Centring what it holds, as a dialog's scrim does. */
export const Centred: Story = {};
/** Holding it where it is, as a drawer's scrim does. */
export const NotCentred: Story = { args: { isCentred: false } };
