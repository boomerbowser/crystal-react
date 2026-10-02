import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Price } from './Price.js';

const forty = { amount: 40, currency: 'GBP' };

describe('Price', () => {
  /* "The formatted value is the text content." One string is both what is seen
     and what is read; the component adds no second form. */
  it('formats the amount in its currency', () => {
    renderWithCrystal(<Price value={forty} data-testid="p" />);
    expect(screen.getByTestId('p')).toHaveTextContent('£40.00');
  });

  it('takes the currency from the value, not from a symbol in a string', () => {
    renderWithCrystal(<Price value={{ amount: 40, currency: 'JPY' }} data-testid="p" />);
    /* The currency's own precision: the yen has no minor unit. That fact comes
       from the platform's currency data; this library does not keep it. */
    expect(screen.getByTestId('p')).toHaveTextContent('¥40');
  });

  /* "Currency is stated, not implied by a symbol alone." When a product asks,
     the currency is spelled out for everybody, so what is announced and what is
     shown are the same. */
  it('can state the currency in words', () => {
    renderWithCrystal(<Price value={forty} currencyDisplay="name" data-testid="p" />);
    expect(screen.getByTestId('p')).toHaveTextContent(/40.00 British pounds/);
  });

  /* "Tabular figures so a column of prices aligns." */
  it('uses tabular figures so a column of prices aligns', () => {
    renderWithCrystal(<Price value={forty} data-testid="p" />);
    expect(screen.getByTestId('p').className).toMatch(/tabular/);
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(<Price value={forty} />);
    await expectNoAxeViolations(container);
  });
});
