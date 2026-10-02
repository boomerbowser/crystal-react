import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { WishlistButton } from './WishlistButton.js';

const meta = {
  title: 'Commerce/Wishlist button',
  component: WishlistButton,
  parameters: {
    docs: {
      description: {
        component:
          '"A toggle with a pressed state and a name that says what it will do." The name does '
          + 'not flip with the state. A name that changed from "Save" to "Remove" once saved '
          + 'would be announced as "Remove from wishlist, pressed", which contradicts itself: '
          + 'pressed says the item is in the list, and the name says pressing puts it there. '
          + 'The name is a verb phrase, so it says what the control is for, and `aria-pressed` '
          + 'carries whether it has been done. `MediaControls` makes the same decision about '
          + 'play and pause.\n\n'
          + 'The item is in the name, because a listing page has thirty of these and thirty '
          + 'controls called "Save to wishlist" are thirty identical rows in an element list.',
      },
    },
  },
  args: { item: 'Harbour print', isSaved: false, onChange: () => {} },
} satisfies Meta<typeof WishlistButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Both shapes the catalogue allows ("Resin pill or icon button"), with the
 *  same name either way, because an icon has no other. Press either and the
 *  name does not change. */
export const BothShapes: Story = {
  render: (args) => {
    function Pair() {
      const [saved, setSaved] = useState(false);
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <WishlistButton {...only(args)} isSaved={saved} onChange={setSaved} />
          <WishlistButton {...only(args)} isSaved={saved} onChange={setSaved} iconOnly />
        </div>
      );
    }
    return <Pair />;
  },
};

/** Saved. The mark fills in, and `aria-pressed` carries the state. The fill is
 *  the second signal, never the only one. */
export const Saved: Story = { args: { item: 'Harbour print', isSaved: true, onChange: () => {} } };
