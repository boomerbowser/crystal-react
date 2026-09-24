import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { ProductCard } from './ProductCard.js';
import { Button } from '../Button/Button.js';

describe('ProductCard', () => {
  /* "The whole card is not a link; the name is, and the action is a button.
     One tab stop each." A card wrapped in an anchor gives a screen reader one
     enormous link whose name is every word on the card, and nests the Add
     control inside it, which is invalid markup. */
  it('is exactly two tab stops, and the link is the name', () => {
    const { container } = renderWithCrystal(
      <ProductCard
        name="Harbour print"
        href="/harbour"
        price={{ amount: 39.99, currency: 'GBP' }}
        action={<Button>Add to basket</Button>}
      />,
    );
    const link = screen.getByRole('link', { name: 'Harbour print' });
    expect(link).toHaveAttribute('href', '/harbour');
    expect(container.querySelectorAll('a')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Add to basket' })).toBeInTheDocument();
  });

  /* Invalid markup, and it behaves differently in every browser. */
  it('never nests the action inside the link', () => {
    const { container } = renderWithCrystal(
      <ProductCard
        name="Harbour print"
        href="/harbour"
        price={{ amount: 39.99, currency: 'GBP' }}
        action={<Button>Add to basket</Button>}
        aside={<Button>Save</Button>}
      />,
    );
    const link = container.querySelector('a');
    expect(link?.querySelector('button')).toBeNull();
    for (const control of container.querySelectorAll('button')) {
      expect(control.closest('a')).toBeNull();
    }
  });

  /* A line through text is a drawing; `<s>` is what carries it to a reader. */
  it('marks a former price as former, in the markup', () => {
    const { container } = renderWithCrystal(
      <ProductCard
        name="Harbour print"
        href="/harbour"
        price={{ amount: 39.99, currency: 'GBP' }}
        was={{ amount: 49.99, currency: 'GBP' }}
      />,
    );
    expect(container.querySelector('s')).toHaveTextContent('£49.99');
    /* And the discount is computed from the pair rather than declared. */
    expect(container.textContent).toMatch(/20% off/);
  });

  /* An unavailable product keeps its card and loses its action: there is
     nothing to press, and the product page is still where a reader goes. */
  it('keeps the link and drops the action when it cannot be bought', () => {
    renderWithCrystal(
      <ProductCard
        name="Harbour print"
        href="/harbour"
        price={{ amount: 39.99, currency: 'GBP' }}
        availability="out-of-stock"
        action={<Button>Add to basket</Button>}
      />,
    );
    expect(screen.getByRole('link', { name: 'Harbour print' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add to basket' })).toBeNull();
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <ProductCard
        name="Harbour print"
        href="/harbour"
        price={{ amount: 39.99, currency: 'GBP' }}
        availability="in-stock"
        action={<Button>Add to basket</Button>}
      />,
    );
    await expectNoAxeViolations(container);
  });
});
