import type { Meta, StoryObj } from '@storybook/react-vite';
import { OverlayArrow } from './OverlayArrow.js';
import { Popover } from '../Popover/Popover.js';
import { Button } from '../Button/Button.js';
import { DialogTrigger } from 'react-aria-components';

const meta = {
  title: 'Overlays/OverlayArrow',
  component: OverlayArrow,
  parameters: {
    docs: {
      description: {
        component:
          'The point an anchored surface makes at the thing it belongs to. It is part of the '
          + 'surface — the same material, the same edge — rather than a separate shape laid against '
          + 'it, so a Frost popover points with Frost. Popovers and tooltips draw it with '
          + '`hasArrow`; this story opens one that does.',
      },
    },
  },
  args: {},
  render: () => (
    <DialogTrigger defaultOpen>
      <Button>Details</Button>
      <Popover label="Details" hasArrow>
        <p style={{ margin: 0 }}>Renews on 14 March 2027.</p>
      </Popover>
    </DialogTrigger>
  ),
} satisfies Meta<typeof OverlayArrow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** On a popover, pointing at its trigger. */
export const OnAPopover: Story = {};
