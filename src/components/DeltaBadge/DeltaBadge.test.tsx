import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { DeltaBadge, deltaSign } from './DeltaBadge.js';

describe('DeltaBadge', () => {
  /* U+2212, not the hyphen a keyboard produces: a hyphen is read as a hyphen and
     rendered at hyphen width, so a column of deltas signed with hyphens does not
     line up. */
  it('signs a negative with a minus sign rather than a hyphen', () => {
    expect(deltaSign(-1)).toBe('−');
    expect(deltaSign(-1)).not.toBe('-');
    expect(deltaSign(1)).toBe('+');
    expect(deltaSign(0)).toBe('');
  });

  it('formats the magnitude and writes the sign itself', () => {
    renderWithCrystal(
      <DeltaBadge value={-0.024} format={{ style: 'percent', minimumFractionDigits: 1 }} locale="en-GB" />,
    );
    expect(screen.getByText('−2.4%')).toBeInTheDocument();
  });

  it('carries the state as data, and zero is neutral rather than positive', () => {
    const { rerenderWithCrystal } = renderWithCrystal(<DeltaBadge value={0} data-testid="d" />);
    expect(screen.getByTestId('d').dataset['state']).toBe('neutral');
    rerenderWithCrystal(<DeltaBadge value={3} data-testid="d" />);
    expect(screen.getByTestId('d').dataset['state']).toBe('positive');
    rerenderWithCrystal(<DeltaBadge value={-3} data-testid="d" />);
    expect(screen.getByTestId('d').dataset['state']).toBe('negative');
  });

  /* A synthesiser may or may not expand "+" and "−", and what the badge means
     should not depend on which. */
  it('says the direction in words, and names what changed', () => {
    renderWithCrystal(
      <DeltaBadge value={-0.024} format={{ style: 'percent', minimumFractionDigits: 1 }}
        locale="en-GB" description="refunds" />,
    );
    expect(screen.getByText(/2\.4% down/)).toBeInTheDocument();
    expect(screen.getByText(/refunds/)).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<DeltaBadge value={12} description="open tickets" />);
    await expectNoAxeViolations(container);
  });
});
