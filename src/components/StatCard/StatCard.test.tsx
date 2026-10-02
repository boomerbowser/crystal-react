import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { StatCard } from './StatCard.js';

describe('StatCard', () => {
  /* "The figure and its trend are one readable sentence". That is a rule about
     order, which a card can enforce. */
  it('reads label, figure, period, trend in that order', () => {
    const { container } = renderWithCrystal(
      <StatCard label="Revenue" value="£48,210" period="this month"
        trend={{ direction: 'up', label: '4.2% up on last month' }} />,
    );
    const text = (container.textContent ?? '').replace(/\s+/g, ' ');
    expect(text.indexOf('Revenue')).toBeLessThan(text.indexOf('£48,210'));
    expect(text.indexOf('£48,210')).toBeLessThan(text.indexOf('4.2% up on last month'));
  });

  it('is a Card, so the Haze fill and the region rule are not rebuilt here', () => {
    const { container } = renderWithCrystal(
      <StatCard label="Revenue" value="£48,210" aria-label="Revenue summary" />,
    );
    expect(container.querySelector('section')).not.toBeNull();
    expect(screen.getByRole('region', { name: 'Revenue summary' })).toBeInTheDocument();
  });

  /* A zero in place of "no data yet" is a measurement the product did not
     make. */
  it('says it has nothing rather than showing a zero', () => {
    renderWithCrystal(<StatCard label="Revenue" value="£0" empty="No sales yet." />);
    expect(screen.getByText('No sales yet.')).toBeInTheDocument();
    expect(screen.queryByText('£0')).toBeNull();
  });

  it('keeps the box while it loads, so a row of cards does not reflow', () => {
    renderWithCrystal(<StatCard label="Revenue" value="£48,210" loading />);
    expect(screen.queryByText('£48,210')).toBeNull();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <StatCard label="Revenue" value="£48,210" unit="GBP" period="this month"
        trend={{ direction: 'down', label: '1.1% down on last month' }} />,
    );
    await expectNoAxeViolations(container);
  });
});
