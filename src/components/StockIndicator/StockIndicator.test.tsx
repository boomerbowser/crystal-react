import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { StockIndicator } from './StockIndicator.js';

describe('StockIndicator', () => {
  /* "Words carry the state; status colour reinforces it." */
  it('says the state in words', () => {
    renderWithCrystal(<StockIndicator availability="low" data-testid="s" />);
    expect(screen.getByTestId('s')).toHaveTextContent('Low stock');
  });

  /* Backorder can be bought and arrives later, so it is `info` rather than a
     warning about an ordinary outcome. */
  it('reports backorder as information, not as a warning', () => {
    renderWithCrystal(<StockIndicator availability="backorder" data-testid="s" />);
    expect(screen.getByTestId('s')).toHaveAttribute('data-status', 'info');
  });

  it('maps each state to its status', () => {
    const { rerender } = renderWithCrystal(<StockIndicator availability="in-stock" data-testid="s" />);
    expect(screen.getByTestId('s')).toHaveAttribute('data-status', 'success');
    rerender(<StockIndicator availability="out-of-stock" data-testid="s" />);
    expect(screen.getByTestId('s')).toHaveAttribute('data-status', 'danger');
  });

  /* The wording is the product's: "Only 2 left" is a merchandising decision. */
  it('takes the product\'s words over its own', () => {
    renderWithCrystal(<StockIndicator availability="low" data-testid="s">Only 2 left</StockIndicator>);
    expect(screen.getByTestId('s')).toHaveTextContent('Only 2 left');
    expect(screen.getByTestId('s').textContent).not.toMatch(/Low stock/);
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(<StockIndicator availability="low" />);
    await expectNoAxeViolations(container);
  });
});
