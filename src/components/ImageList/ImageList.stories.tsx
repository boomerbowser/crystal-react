import type { Meta, StoryObj } from '@storybook/react-vite';
import { ImageList } from './ImageList.js';

/* The sources are chosen not to resolve, because a story that depends on the
   network sometimes shows a broken image icon. What shows is the
   reserved box, the Haze placeholder and the caption bar, which is the
   composition this component is about. */
const items = [
  { id: 'a', src: '/harbour-1.jpg', alt: 'A harbour at first light', caption: 'Sunrise, 5:40am' },
  { id: 'b', src: '/harbour-2.jpg', alt: 'A jetty in fog', caption: 'Fog, 7:10am' },
  { id: 'c', src: '/harbour-3.jpg', alt: 'Masts against a grey sky', caption: 'Overcast, 11:20am' },
  { id: 'd', src: '/harbour-4.jpg', alt: 'The same jetty at dusk', caption: 'Dusk, 8:05pm' },
];

const meta = {
  title: 'Data display/Image list',
  component: ImageList,
  parameters: {
    docs: {
      description: {
        component:
          'A real `ul`, so a reader is told how many images there are before walking them. A '
          + 'grid of divs announces nothing and gives no way out. Every item requires `alt`, '
          + 'exactly as `Image` does: empty means decorative, absent means announced by '
          + 'filename, and the author has to say which. The caption says what the picture '
          + 'means, and the alt says what it is. The caption bar is Haze on a pseudo-element so '
          + 'its text stays crisp, and it keeps the tile\'s radius on the two corners it meets. '
          + 'The corners use logical properties, so a right-to-left grid needs no second rule.',
      },
    },
  },
  args: { items, label: 'Harbour series', ratio: 1 },
} satisfies Meta<typeof ImageList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Landscape tiles, and no captions: the alt text still carries what each
 *  picture is. */
export const WithoutCaptions: Story = {
  args: { ratio: 16 / 9, items: items.map(({ caption: _c, ...rest }) => rest) },
};

/** Tiles that are links. The focus ring lands on the tile, inset so it is not
 *  clipped by the tile's own radius. */
export const Linked: Story = {
  args: { items: items.map((item) => ({ ...item, href: `#${item.id}` })) },
};
