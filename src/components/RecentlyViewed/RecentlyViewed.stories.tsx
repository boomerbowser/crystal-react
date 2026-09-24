import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { RecentlyViewed } from './RecentlyViewed.js';
import { ProductCard } from '../ProductCard/ProductCard.js';

const products = [
  { name: 'Harbour print, A2', price: 39.99 },
  { name: 'Quay print, A2', price: 64 },
  { name: 'Bridge print, A3', price: 29.99 },
  { name: 'Rain on the quay, A2', price: 45 },
  { name: 'The long bridge, A1', price: 89 },
];

const meta = {
  title: 'Commerce/Recently viewed',
  component: RecentlyViewed,
  parameters: {
    docs: {
      description: {
        component:
          '"A labelled list; the strip is keyboard scrollable" and it "scrolls within its own '
          + 'container; **never the page**". The second is the one that gets broken: a '
          + 'horizontal strip built as an overflowing row inside a container with no `overflow` '
          + 'does not scroll — it makes the *page* wide, and a reader on a phone finds a '
          + 'horizontal scrollbar under the whole document.\n\n'
          + 'So the scrolling belongs to a `ScrollArea`, with **Resin** rather than Frost: '
          + 'Crystal\'s scroll contract puts Frost on panels and reading surfaces and Resin on '
          + 'compact or horizontal scrollers. A rule read off the contract, not a preference.',
      },
    },
  },
  args: {
    label: 'Recently viewed',
    heading: 'Recently viewed',
    children: products.map((one) => (
      <ProductCard
        key={one.name}
        name={one.name}
        href={`#${one.name}`}
        price={{ amount: one.price, currency: 'GBP' }}
      />
    )),
  },
} satisfies Meta<typeof RecentlyViewed>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <RecentlyViewed {...only(args)}>
      {products.map((one) => (
        <ProductCard
          key={one.name}
          name={one.name}
          href={`#${one.name}`}
          price={{ amount: one.price, currency: 'GBP' }}
        />
      ))}
    </RecentlyViewed>
  ),
};

/** Nothing viewed yet, which renders nothing at all: a "recently viewed" strip
 *  with an empty list is a heading over a void, and a first-time reader is told
 *  about a feature they have not used instead of being shown the shop. */
export const NothingViewedYet: Story = {
  render: (args) => <RecentlyViewed {...only(args)} count={0}>{[]}</RecentlyViewed>,
};
