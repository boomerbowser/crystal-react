import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent, waitFor } from '../../test/render.js';
import { CartDrawer, type CartDrawerProps } from './CartDrawer.js';

const gbp = (amount: number) => ({ amount, currency: 'GBP' });
const props: CartDrawerProps = {
  isOpen: true,
  onOpenChange: () => {},
  lines: [
    { id: 'mug', name: 'Enamel mug', nameText: 'Enamel mug', quantity: 2, unitPrice: gbp(12), subtotal: gbp(24) },
    { id: 'tea', name: 'Loose tea', nameText: 'Loose tea', quantity: 1, unitPrice: gbp(8), subtotal: gbp(8) },
  ],
  summary: [{ id: 'subtotal', label: 'Subtotal', amount: gbp(32) }],
  total: gbp(32),
  onQuantityChange: () => {},
  onRemove: () => {},
  onCheckout: () => {},
};

describe('CartDrawer', () => {
  it('opens as a dialog named for the basket, with focus inside it', async () => {
    renderWithCrystal(<CartDrawer {...props} />);
    const dialog = await screen.findByRole('dialog', { name: 'Your basket' });
    await waitFor(() => { expect(dialog.contains(document.activeElement)).toBe(true); });
  });

  /* The settled total is said once, when it changes. It is not said on opening,
     or while it is still being recalculated. */
  it('announces the total when it settles on a new figure, and not before', async () => {
    const { rerenderWithCrystal } = renderWithCrystal(<CartDrawer {...props} />);
    expect(screen.queryByText(/Basket total now/)).toBeNull();

    rerenderWithCrystal(<CartDrawer {...props} total={gbp(44)} isUpdating />);
    expect(screen.queryByText(/Basket total now/)).toBeNull();

    rerenderWithCrystal(<CartDrawer {...props} total={gbp(44)} />);
    await waitFor(() => { expect(screen.getByText(/Basket total now £44\.00/)).toBeInTheDocument(); });
    expect(screen.getByText(/Basket total now/).closest('[role=status]')).not.toBeNull();
  });

  it('holds checkout while the figures are being recalculated', () => {
    const { rerenderWithCrystal } = renderWithCrystal(<CartDrawer {...props} isUpdating />);
    expect(screen.getByRole('button', { name: 'Checkout' })).toBeDisabled();
    rerenderWithCrystal(<CartDrawer {...props} />);
    expect(screen.getByRole('button', { name: 'Checkout' })).toBeEnabled();
  });

  it('says it is empty and offers no checkout when there is nothing in it', () => {
    renderWithCrystal(<CartDrawer {...props} lines={[]} />);
    expect(screen.getByText('Your basket is empty')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Checkout' })).toBeNull();
  });

  it('removes the line it was asked to', async () => {
    const onRemove = vi.fn();
    renderWithCrystal(<CartDrawer {...props} onRemove={onRemove} />);
    await userEvent.click(screen.getByRole('button', { name: /Remove Loose tea/ }));
    expect(onRemove).toHaveBeenCalledWith('tea');
  });

  it.each([
    ['open', {}],
    ['updating', { isUpdating: true }],
    ['empty', { lines: [] }],
  ])('has no axe violations %s', async (_, extra) => {
    renderWithCrystal(<CartDrawer {...props} {...extra} />);
    await expectNoAxeViolations(await screen.findByRole('dialog'));
  });
});
