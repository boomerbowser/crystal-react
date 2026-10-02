import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { TrendIndicator } from './TrendIndicator.js';

describe('TrendIndicator', () => {
  /* "Direction is carried by a word and a symbol, never by colour alone." A
     reader who hears both hears it twice. The glyph is for the eye. */
  it('announces the words and hides the arrow', () => {
    renderWithCrystal(<TrendIndicator direction="up">4.2% up on last month</TrendIndicator>);
    expect(screen.getByText('↑')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('4.2% up on last month')).toBeInTheDocument();
  });

  it('draws a different glyph for each direction', () => {
    const { rerenderWithCrystal } = renderWithCrystal(<TrendIndicator direction="up">up</TrendIndicator>);
    expect(screen.getByText('↑')).toBeInTheDocument();
    rerenderWithCrystal(<TrendIndicator direction="down">down</TrendIndicator>);
    expect(screen.getByText('↓')).toBeInTheDocument();
    rerenderWithCrystal(<TrendIndicator direction="flat">flat</TrendIndicator>);
    expect(screen.getByText('→')).toBeInTheDocument();
  });

  it('carries the direction as data, so one rule per direction selects the ink', () => {
    renderWithCrystal(<TrendIndicator direction="down" data-testid="trend">down</TrendIndicator>);
    expect(screen.getByTestId('trend').dataset['direction']).toBe('down');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <p>Revenue <TrendIndicator direction="flat">unchanged on last month</TrendIndicator></p>,
    );
    await expectNoAxeViolations(container);
  });
});
