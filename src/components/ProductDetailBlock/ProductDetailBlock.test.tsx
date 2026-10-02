import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent, waitFor } from '../../test/render.js';
import { ProductDetailBlock, type ProductDetailBlockProps } from './ProductDetailBlock.js';

const gbp = (amount: number) => ({ amount, currency: 'GBP' });
const props: ProductDetailBlockProps = {
  name: 'Enamel mug',
  nameText: 'Enamel mug',
  media: [{ id: 'front', alt: 'The mug from the front', thumbnail: <span>Front</span> }],
  variantLabel: 'Colour',
  variants: [
    { value: 'slate', label: 'Slate', price: gbp(24), availability: 'in-stock' },
    { value: 'rust', label: 'Rust', price: gbp(26), availability: 'low' },
    { value: 'sand', label: 'Sand', price: gbp(24), availability: 'out-of-stock' },
  ],
  onAddToCart: () => {},
};

describe('ProductDetailBlock', () => {
  it('shows the first variant’s price and stock, and says nothing on load', () => {
    renderWithCrystal(<ProductDetailBlock {...props} />);
    expect(screen.getByText('£24.00')).toBeInTheDocument();
    expect(screen.getByText('In stock')).toBeInTheDocument();
    expect(screen.getByRole('status', { hidden: true }).textContent ?? '').not.toMatch(/Slate/);
  });

  /* Price and stock change together, and the change is said as one sentence. */
  it('updates price and stock together when the variant changes, and says both', async () => {
    renderWithCrystal(<ProductDetailBlock {...props} />);
    await userEvent.click(screen.getByRole('radio', { name: 'Rust' }));
    expect(screen.getByText('£26.00')).toBeInTheDocument();
    expect(screen.getByText('Low stock')).toBeInTheDocument();
    await waitFor(() => { expect(screen.getByText('Rust: £26.00, low stock')).toBeInTheDocument(); });
  });

  it('refuses a variant that is out of stock, and says why on the control', async () => {
    renderWithCrystal(<ProductDetailBlock {...props} />);
    await userEvent.click(screen.getByRole('radio', { name: 'Sand' }));
    expect(screen.getByRole('button', { name: 'Out of stock' })).toBeDisabled();
  });

  it('adds the chosen variant', async () => {
    const onAddToCart = vi.fn();
    renderWithCrystal(<ProductDetailBlock {...props} onAddToCart={onAddToCart} />);
    await userEvent.click(screen.getByRole('radio', { name: 'Rust' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add to basket' }));
    expect(onAddToCart).toHaveBeenCalledWith('rust');
  });

  it('waits while adding, and says so', () => {
    renderWithCrystal(<ProductDetailBlock {...props} isAdding />);
    expect(screen.getByRole('button', { name: 'Add to basket' })).toBeDisabled();
    expect(screen.getByText('Adding to your basket')).toBeInTheDocument();
  });

  it.each([
    ['at rest', {}],
    ['unavailable', { defaultValue: 'sand' }],
    ['adding', { isAdding: true }],
  ])('has no axe violations %s', async (_, extra) => {
    const { container } = renderWithCrystal(<ProductDetailBlock {...props} {...extra} />);
    await expectNoAxeViolations(container);
  });
});
