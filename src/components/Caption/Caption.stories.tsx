import type { Meta, StoryObj } from '@storybook/react-vite';
import { crystalTokens } from '../../theme/tokens.generated.js';
import { Caption } from './Caption.js';
import { photos } from '../../../.storybook/fixtures/index.js';

/* A real photograph from the story fixtures, served locally, so the caption is
   judged against a picture, light sky and dark rock both, with no network.
   The figure fills its column, as it would in an article, and the column here
   is 560px wide. */
const Media = () => (
  <img
    src={photos.rockyShore}
    alt="A rocky shore at low tide"
    width={560}
    height={373}
    style={{ display: 'block', inlineSize: '100%', blockSize: 'auto' }}
  />
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
  args: { caption: 'Low tide on the east shore, 5:40am', children: <Media /> },
  decorators: [(Story) => <div style={{ inlineSize: 'min(560px, 100%)' /* crystal-allow-literal: a story's column width */ }}><Story /></div>],
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
