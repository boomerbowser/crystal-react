import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { SharedElement } from './SharedElement.js';
import { Button } from '../Button/Button.js';

const meta = {
  title: 'Utilities/SharedElement',
  component: SharedElement,
  parameters: {
    docs: {
      description: {
        component:
          'One element carried between two views, so it reads as the same object rather than one '
          + 'thing vanishing and another appearing — a thumbnail and the hero it opens. Motion\'s '
          + '`layoutId` moves it; under reduced motion it is removed entirely rather than slowed, '
          + 'because a slower moving object is still a moving object. It is never the only sign '
          + 'that the view changed: the destination here has its own heading.',
      },
    },
  },
  args: { id: 'harbour' },
  render: function SharedElementStory(args) {
    const [open, setOpen] = useState(false);
    const picture = { background: 'var(--cr-primary-soft)', borderRadius: 'var(--cr-radius)' };
    return (
      <div style={{ display: 'grid', gap: 16, justifyItems: 'start' }}>
        {open ? (
          <section aria-labelledby="harbour-heading" style={{ display: 'grid', gap: 12 }}>
            <h2 id="harbour-heading" style={{ margin: 0 }}>Harbour at dusk</h2>
            <SharedElement {...args} style={{ ...picture, inlineSize: 480, blockSize: 270 }} />
          </section>
        ) : (
          <SharedElement {...args} style={{ ...picture, inlineSize: 120, blockSize: 68 }} />
        )}
        <Button onPress={() => { setOpen((shown) => !shown); }}>{open ? 'Back to the grid' : 'Open the photograph'}</Button>
      </div>
    );
  },
} satisfies Meta<typeof SharedElement>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A thumbnail that becomes the hero of the view it opens. */
export const ThumbnailToHero: Story = {};
