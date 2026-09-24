import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { PriceRange } from './PriceRange.js';

const forty = { amount: 40, currency: 'GBP' };
const sixty = { amount: 60, currency: 'GBP' };

describe('PriceRange', () => {
  /* "Reads as a sentence rather than two numbers with a dash." A dash is a
     glyph that means nothing out loud. */
  it('reads as a sentence, not two numbers with a dash', () => {
    renderWithCrystal(<PriceRange from={forty} to={sixty} data-testid="r" />);
    const range = screen.getByTestId('r');
    expect(range).toHaveTextContent('From £40.00 to £60.00');
    expect(range.textContent).not.toMatch(/[–—-]/);
  });

  /* A range whose ends are equal is a price, and saying it twice tells a reader
     there is a spread when there is not. */
  it('collapses to one price when there is no spread', () => {
    renderWithCrystal(<PriceRange from={forty} to={forty} data-testid="r" />);
    expect(screen.getByTestId('r')).toHaveTextContent('From £40.00');
    expect(screen.getByTestId('r').textContent).not.toMatch(/to/);
  });

  it('is a from price when there is no upper bound', () => {
    renderWithCrystal(<PriceRange from={forty} data-testid="r" />);
    expect(screen.getByTestId('r')).toHaveTextContent('From £40.00');
  });

  /* The interval from a euro to a yen is not an interval. */
  it('refuses to read two currencies as a range', () => {
    renderWithCrystal(
      <PriceRange from={forty} to={{ amount: 60, currency: 'JPY' }} data-testid="r" />,
    );
    expect(screen.getByTestId('r')).toHaveTextContent('From £40.00');
    expect(screen.getByTestId('r').textContent).not.toMatch(/¥/);
  });

  /* The order of "from" and "to" is different in other languages, so the
     sentence is the product's and not this component's. */
  it('takes its sentence from the caller', () => {
    renderWithCrystal(
      <PriceRange
        from={forty}
        to={sixty}
        sentence={(low, high) => <>{low} bis {high}</>}
        data-testid="r"
      />,
    );
    expect(screen.getByTestId('r')).toHaveTextContent('£40.00 bis £60.00');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(<PriceRange from={forty} to={sixty} />);
    await expectNoAxeViolations(container);
  });
});
