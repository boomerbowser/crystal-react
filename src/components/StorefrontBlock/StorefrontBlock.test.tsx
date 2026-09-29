import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent, within } from '../../test/render.js';
import { StorefrontBlock, type StorefrontBlockProps } from './StorefrontBlock.js';
import { Checkbox } from '../Checkbox/Checkbox.js';

const gbp = (amount: number) => ({ amount, currency: 'GBP' });
const props: StorefrontBlockProps = {
  title: 'Kitchen',
  products: [
    { id: 'mug', name: 'Enamel mug', href: '#mug', price: gbp(24) },
    { id: 'pot', name: 'Tea pot', href: '#pot', price: gbp(40) },
  ],
  resultCount: 2,
  filters: <Checkbox>In stock</Checkbox>,
  sort: { options: [{ value: 'popular', label: 'Most popular' }, { value: 'price', label: 'Price, low to high' }] },
};

describe('StorefrontBlock', () => {
  /* The opinion: the products are a list named for what they are, so a reader
     hears how many before the first one. */
  it('lists the products as a labelled list, and shows the count in words', () => {
    renderWithCrystal(<StorefrontBlock {...props} />);
    const list = screen.getByRole('list', { name: 'Products' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('2 products')).toBeInTheDocument();
  });

  it('replaces the list while loading, and says so', () => {
    renderWithCrystal(<StorefrontBlock {...props} state="loading" />);
    expect(screen.queryByRole('list', { name: 'Products' })).toBeNull();
    expect(screen.getByText('Kitchen').closest('[data-cr-state]')?.querySelector('[aria-busy=true]')).not.toBeNull();
  });

  it('keeps the results in place while filtering, marked busy', () => {
    renderWithCrystal(<StorefrontBlock {...props} state="filtering" />);
    expect(screen.getByRole('list', { name: 'Products' }).closest('[aria-busy=true]')).not.toBeNull();
  });

  it('says nothing matched, with a way out, when the filters find nothing', async () => {
    const onClearFilters = vi.fn();
    renderWithCrystal(<StorefrontBlock {...props} products={[]} resultCount={0} state="empty" onClearFilters={onClearFilters} />);
    expect(screen.getByText('No products match these filters')).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: /Clear/ }).at(-1)!);
    expect(onClearFilters).toHaveBeenCalled();
  });

  it('offers pages only when there is more than one', () => {
    const { unmount } = renderWithCrystal(<StorefrontBlock {...props} page={1} totalPages={3} onPageChange={() => {}} />);
    expect(screen.getByRole('navigation', { name: 'Pages of products' })).toBeInTheDocument();
    unmount();
    renderWithCrystal(<StorefrontBlock {...props} page={1} totalPages={1} onPageChange={() => {}} />);
    expect(screen.queryByRole('navigation', { name: /Pages/ })).toBeNull();
  });

  it.each([
    ['at rest', {}],
    ['loading', { state: 'loading' as const }],
    ['empty', { state: 'empty' as const, products: [], resultCount: 0 }],
    ['filtering', { state: 'filtering' as const, applied: [{ id: 'stock', label: 'In stock' }] }],
  ])('has no axe violations %s', async (_, extra) => {
    const { container } = renderWithCrystal(<StorefrontBlock {...props} {...extra} />);
    await expectNoAxeViolations(container);
  });
});
