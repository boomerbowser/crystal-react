import type { Meta, StoryObj } from '@storybook/react-vite';
import { Image } from './Image.js';

const meta = {
  title: 'Data display/Image',
  component: Image,
  parameters: {
    docs: {
      description: {
        component:
          'Media with the ratio reserved before anything loads. An image that arrives and pushes '
          + 'the paragraph below it down the page is the most common layout shift on the web, and '
          + 'a component with a reserved box does not cause it. The placeholder is Haze, because '
          + 'a grey rectangle on Crystal\'s coloured atmosphere reads as a hole in the page. `alt` '
          + 'is required and may be empty. Empty means decorative, absent means announced as a '
          + 'filename, and the author has to say which.',
      },
    },
  },
  args: { src: 'https://example.invalid/harbour.jpg', alt: 'A harbour at first light', ratio: 16 / 9 },
} satisfies Meta<typeof Image>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The source does not resolve, so this is the reserved box with its placeholder
 *  and then its fallback. Review this state, because it is the one users hit. */
export const Default: Story = {
  args: { fallback: 'Photograph unavailable' },
};

/** Square, and unclipped. */
export const SquareAndUnrounded: Story = {
  args: { ratio: 1, rounded: false, fallback: 'Photograph unavailable' },
};

/** Empty alt: decorative, and stated as such by the author. */
export const Decorative: Story = {
  args: { alt: '', fallback: '' },
};
