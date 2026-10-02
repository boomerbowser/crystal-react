import type { Meta, StoryObj } from '@storybook/react-vite';
import { PriceRange } from './PriceRange.js';

const meta = {
  title: 'Commerce/Price range',
  component: PriceRange,
  parameters: {
    docs: {
      description: {
        component:
          '"Reads as a sentence rather than two numbers with a dash." A dash between two '
          + 'prices means nothing out loud. A screen reader says "forty dash sixty", or nothing '
          + 'at all, and a reader who cannot see the layout has to guess whether the second '
          + 'number is an upper bound, an instalment or a saving. So the ends are joined by '
          + 'words, and the words are a prop, because the sentence is different in every '
          + 'language and this component must not assume English word order.',
      },
    },
  },
  args: { from: { amount: 39.99, currency: 'GBP' }, to: { amount: 89.99, currency: 'GBP' } },
} satisfies Meta<typeof PriceRange>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** A range whose ends are equal is a price. Saying it twice tells a reader there
 *  is a spread when there is not, so that case collapses. So do a missing upper
 *  bound and two different currencies, which are not an interval at all. */
export const WhenItIsNotARange: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 8 }}>
      <PriceRange from={{ amount: 39.99, currency: 'GBP' }} />
      <PriceRange
        from={{ amount: 39.99, currency: 'GBP' }}
        to={{ amount: 39.99, currency: 'GBP' }}
      />
      <PriceRange
        from={{ amount: 39.99, currency: 'GBP' }}
        to={{ amount: 89.99, currency: 'JPY' }}
      />
    </div>
  ),
};

/** The sentence, in another language's word order. */
export const InAnotherLanguage: Story = {
  args: {
    from: { amount: 39.99, currency: 'EUR' },
    to: { amount: 89.99, currency: 'EUR' },
    sentence: (low, high) => <>Von {low} bis {high}</>,
    fromSentence: (low) => <>Ab {low}</>,
  },
};
