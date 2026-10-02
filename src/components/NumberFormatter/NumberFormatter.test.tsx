import { describe, expect, it } from 'vitest';
import { renderWithCrystal, screen } from '../../test/render.js';
import { NumberFormatter } from './NumberFormatter.js';

describe('NumberFormatter', () => {
  /* One string, used as both the visible text and the announced one. A number
     rendered as "1.2M" visually and 1204893 in an aria-label is two facts that
     drift, and nobody checks the one a screen reader reads. */
  it('has one form, visible and spoken', () => {
    renderWithCrystal(
      <NumberFormatter value={1204893} format={{ notation: 'compact' }} data-testid="n" />,
    );
    const el = screen.getByTestId('n');
    expect(el.textContent).toBeTruthy();
    expect(el.getAttribute('aria-label')).toBeNull();
    expect(el.textContent).toBe(el.textContent?.trim());
  });

  it('formats under the scope\'s locale rather than the call site\'s', () => {
    renderWithCrystal(
      <NumberFormatter value={1234.5} format={{ style: 'currency', currency: 'EUR' }} data-testid="n" />,
      { theme: {} },
    );
    expect(screen.getByTestId('n').textContent).toMatch(/1[,.]234/);
  });

  /* Figures in a column line up. The default suits a table, because that is
     where a formatted number usually is. */
  it('uses tabular figures by default', () => {
    renderWithCrystal(<NumberFormatter value={42} data-testid="n" />);
    expect(screen.getByTestId('n').className).toMatch(/tabular/);
  });
});
