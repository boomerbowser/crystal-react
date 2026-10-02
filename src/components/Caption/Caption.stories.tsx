import type { Meta, StoryObj } from '@storybook/react-vite';
import { crystalTokens } from '../../theme/tokens.generated.js';
import { Caption } from './Caption.js';

/* A drawn stand-in instead of a fetched photograph, because a story that
   depends on a network image sometimes shows a broken image icon. */
const Media = () => (
  <svg viewBox="0 0 480 280" role="img" aria-label="A harbour at first light" style={{ display: 'block', inlineSize: '100%' }}>
    <defs>
      <linearGradient id="cr-caption-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--cr-primary)" />
        <stop offset="100%" stopColor="var(--cr-surface-alt)" />
      </linearGradient>
    </defs>
    <rect width="480" height="280" fill="url(#cr-caption-sky)" />
    <circle cx="380" cy="80" r="34" fill="var(--cr-surface)" opacity="0.8" />
  </svg>
);

const meta = {
  title: 'Data display/Caption',
  component: Caption,
  parameters: {
    docs: {
      description: {
        component:
          'Media with its description, as a real `figure` and `figcaption`. A caption never replaces '
          + 'alt text. Alt text says what the image is, for someone who cannot see it, and a caption '
          + 'says what it means, to everyone. So this takes no `alt` prop and the media carries its '
          + `own. Overlaid, the caption sits on Stone: a ${Number(crystalTokens['material.stone.fill.light']) * 100}% fill in light and `
          + `${Number(crystalTokens['material.stone.fill.dark']) * 100}% in dark, feathered by ${crystalTokens['material.stone.feather']}, `
          + 'which keeps it legible over a white sky and a black one alike.',
      },
    },
  },
  args: { caption: 'Sunrise over the harbour, 5:40am', children: <Media /> },
} satisfies Meta<typeof Caption>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Below the media, on the page's own surface. Its contrast is already known,
 *  so there is no backing to paint. */
export const Default: Story = {};

/** Over the media, where contrast cannot be argued from the palette because the
 *  palette is whatever the photograph happens to be. */
export const Overlaid: Story = {
  args: { overlaid: true },
};

/** Present and associated, but out of the visual composition, for a gallery
 *  whose captions are read elsewhere. Not the same as having no caption. */
export const CaptionHidden: Story = {
  args: { captionHidden: true },
};
