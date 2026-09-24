import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { Review } from './Review.js';
import { Rating } from '../Rating/Rating.js';

const meta = {
  title: 'Commerce/Review',
  component: Review,
  parameters: {
    docs: {
      description: {
        component:
          '"**The rating is text as well as stars**" — which `Rating` already does in read-only '
          + 'mode, so the rating here is a `Rating` and not a second row of glyphs. The '
          + 'sentence is in the catalogue because a row of five stars is, to anything that does '
          + 'not see it, either nothing or "star star star star star", and neither is four out '
          + 'of five.\n\n'
          + 'The author and the date are not decoration: a review with no attribution is an '
          + 'assertion from nobody, and one with no date is from any time. Both change how much '
          + 'weight it should carry, which is the reader\'s judgement to make rather than ours '
          + 'to remove.',
      },
    },
  },
  args: {
    title: 'Exactly the light I remember',
    author: 'Ada',
    date: '2 October 2026',
    dateTime: '2026-10-02',
    children:
      'The quay at dusk, and the colour is exactly right — I have walked past that spot a '
      + 'hundred times and it is the first print that has looked like the evening rather than '
      + 'like a photograph of it. The frame is heavier than I expected, in a good way.',
  },
} satisfies Meta<typeof Review>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Review {...only(args)} rating={<Rating label="Rating" value={5} isReadOnly />} />
  ),
};

/** Collapsed. The hidden text is still in the document, so a screen reader and
 *  a page search both find it — which is the difference between a review that
 *  is folded and one the reader is told exists and cannot read. */
export const Collapsible: Story = {
  render: (args) => (
    <Review
      {...only(args)}
      collapsible
      rating={<Rating label="Rating" value={4} isReadOnly />}
      badge="Verified purchase"
    />
  ),
};
