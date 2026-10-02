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
          '"The average and the count are both stated; bars are labelled." Either alone is a '
          + 'different claim: "4.8 out of 5" from three people and from three thousand are not '
          + 'the same fact. A distribution without a count cannot be read, because a bar at 60% '
          + 'could be six votes or six hundred.\n\n'
          + 'The bars are a `MeterGroup`. Each segment is its own `meter` with its own name and '
          + 'value, so the proportions are available to assistive technology and not only as '
          + 'pixel widths.',
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

/** Nothing rated yet. This is the absence of an average, and "0 out of 5" would
 *  tell a reader the product was rated badly.
 *
 *  Uses `render` rather than args, because omitting a prop and passing
 *  `undefined` differ under `exactOptionalPropertyTypes`, and this story needs
 *  the prop omitted. */
export const NothingRatedYet: Story = {
  args: { average: 4.6, count: 0, distribution: [96, 20, 6, 3, 3] },
  render: () => <RatingSummary count={0} />,
};

/** One rating. The wording is singular. */
export const OneRating: Story = { args: { average: 5, count: 1, distribution: [1, 0, 0, 0, 0] } };
