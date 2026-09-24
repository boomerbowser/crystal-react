import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProductGallery } from './ProductGallery.js';

const plate = (label: string, hue: number) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420"><rect width="640" height="420" fill="hsl(${hue} 45% 62%)"/><text x="320" y="230" font-family="system-ui" font-size="44" fill="white" text-anchor="middle">${label}</text></svg>`,
  )}`;

const media = [
  { id: 'front', alt: 'The print, framed, from the front', thumbnail: <img alt="" src={plate('Front', 268)} /> },
  { id: 'detail', alt: 'A close view of the paper texture', thumbnail: <img alt="" src={plate('Detail', 198)} /> },
  { id: 'wall', alt: 'The print hung on a wall', thumbnail: <img alt="" src={plate('On a wall', 22)} /> },
];

const meta = {
  title: 'Commerce/Product gallery',
  component: ProductGallery,
  parameters: {
    docs: {
      description: {
        component:
          'The catalogue entry is `gallery`\'s word for word — "arrow keys move between items '
          + 'with position announced", "Haze thumbnails; Mirage scrim when enlarged", "the '
          + 'viewer is full-bleed within the scrim" — and there is nothing in it that a '
          + 'product\'s media needs and a photographer\'s set does not.\n\n'
          + 'So this is `Gallery` with the vocabulary a shop uses, and no second implementation '
          + 'of a listbox, a roving tabindex, a dialog, a zoom, a pan or a position '
          + 'announcement. It is worth being explicit that this is a rename with a narrower '
          + 'API rather than a component, because the temptation in a commerce slice is to '
          + 'build a second viewer with "product" in its name and discover a year later that '
          + 'only one of the two had the focus fix.',
      },
    },
  },
  args: { media, label: 'Harbour print' },
} satisfies Meta<typeof ProductGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
