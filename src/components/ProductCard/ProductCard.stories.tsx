import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { ProductCard } from './ProductCard.js';
import { Button } from '../Button/Button.js';
import { Rating } from '../Rating/Rating.js';
import { WishlistButton } from '../WishlistButton/WishlistButton.js';

const meta = {
  title: 'Commerce/Product card',
  component: ProductCard,
  parameters: {
    docs: {
      description: {
        component:
          '"**The whole card is not a link**; the name is, and the action is a button. One tab '
          + 'stop each." Almost every storefront wraps the card in an anchor instead. That gives '
          + 'a screen reader one enormous link whose name is every word on the card, such as '
          + '"Harbour print A2 39.99 reduced from 49.99 four point five out of five in stock add '
          + 'to basket", and nests the Add control inside it, which is invalid and behaves '
          + 'differently in every browser. It also takes away the two things a reader wants: '
          + 'going to the product, and buying it, as two decisions.\n\n'
          + 'A pointer still gets a large target, because the name\'s hit area is stretched '
          + 'over the card by the stylesheet. That is a pointer affordance rather than a second '
          + 'control, so the tab order stays at two.',
      },
    },
  },
  args: {
    name: 'Harbour print, A2',
    href: '#harbour',
    price: { amount: 39.99, currency: 'GBP' },
    availability: 'in-stock',
  },
} satisfies Meta<typeof ProductCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Tab through it: two stops, the name and the action. */
export const Default: Story = {
  render: (args) => (
    <div style={{ maxWidth: 'var(--cr-layout-min-cell-width)' }}>
      <ProductCard
        {...only(args)}
        rating={<Rating label="Rating" value={4.5} isReadOnly />}
        action={<Button variant="primary">Add to basket</Button>}
      />
    </div>
  ),
};

/** Reduced. The badge computes the reduction from the two amounts, so it cannot
 *  disagree with the price beside it, and the old price is struck through in the
 *  markup rather than only in the stylesheet. */
export const Reduced: Story = {
  render: (args) => (
    <div style={{ maxWidth: 'var(--cr-layout-min-cell-width)' }}>
      <ProductCard
        {...only(args)}
        was={{ amount: 49.99, currency: 'GBP' }}
        action={<Button variant="primary">Add to basket</Button>}
        aside={<WishlistButton item="Harbour print, A2" isSaved={false} onChange={() => {}} iconOnly />}
      />
    </div>
  ),
};

/** Out of stock. The card and its link stay, because the product page is still
 *  where a reader goes to find out when it will be back. The action goes,
 *  because there is nothing to press. */
export const OutOfStock: Story = {
  render: (args) => (
    <div style={{ maxWidth: 'var(--cr-layout-min-cell-width)' }}>
      <ProductCard
        {...only(args)}
        availability="out-of-stock"
        action={<Button variant="primary">Add to basket</Button>}
      />
    </div>
  ),
};
