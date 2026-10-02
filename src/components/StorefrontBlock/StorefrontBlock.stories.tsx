import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { StorefrontBlock, type StorefrontProduct } from './StorefrontBlock.js';
import { Checkbox, CheckboxGroup } from '../Checkbox/Checkbox.js';

const gbp = (amount: number) => ({ amount, currency: 'GBP' });
const picture = (colour: string) => (
  <div style={{ aspectRatio: '4 / 3', background: colour, borderRadius: 'inherit' }} />
);
const products: StorefrontProduct[] = [
  { id: 'mug', name: 'Enamel mug', href: '#mug', price: gbp(24), availability: 'in-stock', media: picture('var(--cr-primary-soft)') },
  { id: 'pot', name: 'Tea pot', href: '#pot', price: gbp(40), availability: 'low', media: picture('var(--cr-surface-alt)') },
  { id: 'caddy', name: 'Tea caddy', href: '#caddy', price: gbp(18), was: gbp(22), media: picture('var(--cr-primary-soft)') },
  { id: 'tray', name: 'Serving tray', href: '#tray', price: gbp(32), availability: 'out-of-stock', media: picture('var(--cr-surface-alt)') },
];
const sort = { options: [{ value: 'popular', label: 'Most popular' }, { value: 'price', label: 'Price, low to high' }], defaultSelectedKey: 'popular' };
const facets = (
  <CheckboxGroup label="Availability">
    <Checkbox value="stock">In stock</Checkbox>
    <Checkbox value="sale">On sale</Checkbox>
  </CheckboxGroup>
);

const meta = {
  title: 'Blocks/StorefrontBlock',
  component: StorefrontBlock,
  parameters: {
    docs: {
      description: {
        component:
          '"Result count is announced on filter change; the grid is a labelled list."\n\n'
          + 'The announcement of what is applied and how many results there are is `FilterPanel`’s, '
          + 'and the block does not repeat it. The block provides the list: a `ul` named "Products", so a '
          + 'reader hears how many before the first card, with the count shown in words beside the '
          + 'sort. Loading replaces the list; filtering keeps it in place, marked busy; empty says '
          + 'the filters found nothing and offers a way out.',
      },
    },
  },
  args: { title: 'Kitchen', products, resultCount: 4, filters: facets, sort, onClearFilters: fn() },
} satisfies Meta<typeof StorefrontBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AtRest: Story = {};
export const Loading: Story = { args: { state: 'loading' } };
export const Filtering: Story = { args: { state: 'filtering', applied: [{ id: 'stock', label: 'In stock' }] } };
export const Empty: Story = { args: { state: 'empty', products: [], resultCount: 0, applied: [{ id: 'sale', label: 'On sale' }] } };
export const Paged: Story = { args: { page: 1, totalPages: 3, onPageChange: fn() } };

/** Filtering for real: apply "In stock" and the list, the count and the announcement follow. */
export const FilteringForReal: Story = {
  render: function FilteringStory(args) {
    const [inStock, setInStock] = useState(false);
    const shown = inStock ? products.filter((product) => product.availability !== 'out-of-stock') : products;
    return (
      <StorefrontBlock
        {...args}
        products={shown}
        resultCount={shown.length}
        applied={inStock ? [{ id: 'stock', label: 'In stock' }] : []}
        onRemoveFilter={() => { setInStock(false); }}
        onClearFilters={() => { setInStock(false); }}
        filters={<Checkbox isSelected={inStock} onChange={setInStock}>In stock</Checkbox>}
      />
    );
  },
};
