import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Lightbox } from './Lightbox.js';
import { Button } from '../Button/Button.js';

const plate = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420">'
  + '<rect width="640" height="420" fill="hsl(268 45% 62%)"/>' /* crystal-allow-literal: sample photography, not a design value */
  + '<text x="320" y="230" font-family="system-ui" font-size="48" fill="white" '
  + 'text-anchor="middle">Harbour at dusk</text></svg>',
)}`;

const meta = {
  title: 'Media/Lightbox',
  component: Lightbox,
  parameters: {
    docs: {
      description: {
        component:
          '**A dialog**, which is React Aria\'s — focus containment, Escape and focus '
          + 'restoration are not rebuilt here, because rebuilding any of the three is how a '
          + 'reader ends up inside a viewer with no way out.\n\n'
          + '**Pan is the platform\'s, not a keyboard handler.** Once the item is bigger than '
          + 'the frame the reader tabs to its scroll container and pans with the arrow keys the '
          + 'way they pan anything else — the engine\'s own scrolling, its own scrollbars, its '
          + 'own behaviour under a screen reader. A component that read arrow keys itself would '
          + 'have to answer "what do arrows do here" differently depending on the zoom, which '
          + 'is a mode nobody was told about.\n\n'
          + '**Zoom is buttons first**, with `+` and `-` as well: a shortcut nobody can see is '
          + 'a feature for people who already know it is there.',
      },
    },
  },
  args: { label: 'Harbour at dusk', children: null },
} satisfies Meta<typeof Lightbox>;

export default meta;
type Story = StoryObj<typeof meta>;

function Opened(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onPress={() => setOpen(true)}>Open the photograph</Button>
      <Lightbox
        isOpen={open}
        onOpenChange={setOpen}
        isDismissable
        label="Harbour at dusk"
        caption="The east quay, October."
      >
        <img alt="" src={plate} />
      </Lightbox>
    </>
  );
}

/* Opened from a control rather than rendered open, because "closing returns
   focus to the thumbnail" is only true of a viewer something opened. */
export const FromAThumbnail: Story = {
  args: { label: 'Harbour at dusk', children: null },
  render: () => <Opened />,
};
