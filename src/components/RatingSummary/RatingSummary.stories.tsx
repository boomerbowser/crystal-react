import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { RatingSummary } from './RatingSummary.js';
import { Rating } from '../Rating/Rating.js';

const meta = {
  title: 'Commerce/Rating summary',
  component: RatingSummary,
  parameters: {
    docs: {
      description: {
        component:
          '"**The average and the count are both stated**; bars are labelled." Both, because '
          + 'either alone is a different claim: "4.8 out of 5" from three people and from three '
          + 'thousand are not the same fact, and a distribution without a count cannot be read '
          + 'at all — a bar at 60% could be six votes or six hundred.\n\n'
          + 'The bars are a `MeterGroup`, which already solves the part that is easy to get '
          + 'wrong: each segment is its own `meter` with its own name and value, rather than a '
          + 'row of coloured `div`s whose proportions exist only as pixels. A distribution '
          + 'drawn as widths is invisible to everything except an eye.',
      },
    },
  },
  args: { average: 4.6, count: 128, distribution: [96, 20, 6, 3, 3] },
} satisfies Meta<typeof RatingSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <RatingSummary {...only(args)} stars={<Rating label="Average rating" value={4.6} isReadOnly />} />
  ),
};

/** Nothing rated yet, which is the absence of an average rather than an average
 *  of nought — "0 out of 5" tells a reader the product was rated badly.
 *
 *  Rendered rather than argued, because omitting a prop and passing `undefined`
 *  are different things under `exactOptionalPropertyTypes`, and this story is
 *  about the first. */
export const NothingRatedYet: Story = {
  args: { average: 4.6, count: 0, distribution: [96, 20, 6, 3, 3] },
  render: () => <RatingSummary count={0} />,
};

/** One rating. The wording is singular, which is the sort of thing a template
 *  string gets wrong and a reader notices immediately. */
export const OneRating: Story = { args: { average: 5, count: 1, distribution: [1, 0, 0, 0, 0] } };
