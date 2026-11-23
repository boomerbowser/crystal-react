import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { SharedElement, SharedElementReveal } from './SharedElement.js';
import { photos } from '../../../.storybook/fixtures/index.js';
import { Button } from '../Button/Button.js';
import { only } from '../../../.storybook/environment.js';

const meta = {
  title: 'Utilities/SharedElement',
  component: SharedElement,
  parameters: {
    docs: {
      description: {
        component:
          'One element carried between two views, such as a thumbnail and the hero it opens, so it '
          + 'reads as the same object instead of one thing vanishing and another appearing. Motion\'s '
          + '`layoutId` moves it. Under reduced motion the transition is removed entirely, not slowed, '
          + 'because a slower moving object is still a moving object. It is never the only sign '
          + 'that the view changed, so the destination here has its own heading.',
      },
    },
  },
  args: { id: 'harbour' },
  render: function SharedElementStory(args) {
    const [open, setOpen] = useState(false);
    /* A real photograph as the element's own background, so it scales with the
       box without distorting: both sizes are 16:9. */
    const picture = {
      backgroundColor: 'var(--cr-primary-soft)',
      backgroundImage: `url(${photos.mooredBoat})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      borderRadius: 'var(--cr-radius)',
    };
    return (
      <div style={{ display: 'grid', gap: 16, justifyItems: 'start' }}>
        {open ? (
          <section aria-labelledby="harbour-heading" style={{ display: 'grid', gap: 12 }}>
            <SharedElementReveal>
              <h2 id="harbour-heading" style={{ margin: 0 }}>A moored boat on still water</h2>
            </SharedElementReveal>
            <SharedElement {...only(args)} role="img" aria-label="A moored boat on still water" style={{ ...picture, inlineSize: 480, blockSize: 270 }} />
          </section>
        ) : (
          <SharedElement {...only(args)} role="img" aria-label="A moored boat on still water" style={{ ...picture, inlineSize: 120, blockSize: 68 }} />
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
