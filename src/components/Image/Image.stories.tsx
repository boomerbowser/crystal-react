import type { Meta, StoryObj } from '@storybook/react-vite';
import { Image } from './Image.js';

const meta = {
  title: 'Data display/Image',
  component: Image,
  parameters: {
    docs: {
      description: {
        component:
          'Media with the ratio reserved before anything loads, which is the reason this exists '
          + 'rather than an `img` tag: an image that arrives and pushes the paragraph below it down '
          + 'the page is the most common layout shift on the web, and it is one a component can '
          + 'simply not do. The placeholder is Haze rather than a grey rectangle, because a grey '
          + 'rectangle on Crystal\'s coloured atmosphere reads as a hole in the page. `alt` is '
          + 'required and may be empty — empty means decorative, absent means announced as a '
          + 'filename, and the author has to say which.',
      },
    },
  },
  args: { src: 'https://example.invalid/harbour.jpg', alt: 'A harbour at first light', ratio: 16 / 9 },
} satisfies Meta<typeof Image>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The source does not resolve, so this is the reserved box with its placeholder
 *  and then its fallback — which is the state worth reviewing, because it is the
 *  one users actually hit. */
export const Default: Story = {
  args: { fallback: 'Photograph unavailable' },
};

/** Square, and unclipped. */
export const SquareAndUnrounded: Story = {
  args: { ratio: 1, rounded: false, fallback: 'Photograph unavailable' },
};

/** Empty alt: decorative, and said so deliberately. */
export const Decorative: Story = {
  args: { alt: '', fallback: '' },
};
