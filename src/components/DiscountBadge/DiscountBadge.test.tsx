import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { DiscountBadge } from './DiscountBadge.js';

const was = { amount: 50, currency: 'GBP' };
const now = { amount: 40, currency: 'GBP' };

describe('DiscountBadge', () => {
  /* "States what is reduced from what; a percentage alone is not a claim." The
     pill is short, so the whole statement is in the accessible name. It is the
     same fact, stated more completely. */
  it('states what is reduced from what', () => {
    renderWithCrystal(<DiscountBadge from={was} to={now} data-testid="d" />);
    const badge = screen.getByTestId('d');
    expect(badge).toHaveTextContent('20% off');
    expect(badge).toHaveTextContent('£40.00, reduced from £50.00, 20% off');
  });

  /* It computes the reduction instead of being handed one, so the badge cannot
     disagree with the price beside it. */
  it('computes the reduction from the two amounts', () => {
    renderWithCrystal(
      <DiscountBadge from={{ amount: 80, currency: 'GBP' }} to={{ amount: 60, currency: 'GBP' }} data-testid="d" />,
    );
    expect(screen.getByTestId('d')).toHaveTextContent('25% off');
  });

  it('can show the reduction as an amount instead', () => {
    renderWithCrystal(<DiscountBadge from={was} to={now} show="amount" data-testid="d" />);
    const badge = screen.getByTestId('d');
    expect(badge).toHaveTextContent('£10.00 off');
    /* The name still states the whole thing. The `show` prop only changes which
       figure a shopper scans for. */
    expect(badge).toHaveTextContent('reduced from £50.00');
  });

  /* An increase is not a discount, so the component renders nothing. */
  it('renders nothing for an increase', () => {
    const { container } = renderWithCrystal(<DiscountBadge from={now} to={was} />);
    expect(container.textContent).toBe('');
  });

  it('renders nothing across two currencies', () => {
    const { container } = renderWithCrystal(
      <DiscountBadge from={was} to={{ amount: 40, currency: 'JPY' }} />,
    );
    expect(container.textContent).toBe('');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(<DiscountBadge from={was} to={now} />);
    await expectNoAxeViolations(container);
  });
});
