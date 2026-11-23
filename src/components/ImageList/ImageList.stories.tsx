import type { Meta, StoryObj } from '@storybook/react-vite';
import { ImageList } from './ImageList.js';
import { photos } from '../../../.storybook/fixtures/index.js';

/* Real photographs from the story fixtures, served locally, so the caption
   bar is judged against a picture and the story needs no network. */
const items = [
  { id: 'a', src: photos.bay, alt: 'A calm bay below a clear sky', caption: 'Sunrise, 5:40am' },
  { id: 'b', src: photos.pier, alt: 'A pier on a grey morning', caption: 'Fog, 7:10am' },
  { id: 'c', src: photos.mooredBoat, alt: 'A moored boat on still water', caption: 'Overcast, 11:20am' },
  { id: 'd', src: photos.lighthouse, alt: 'A lighthouse above the rocks', caption: 'Dusk, 8:05pm' },
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
