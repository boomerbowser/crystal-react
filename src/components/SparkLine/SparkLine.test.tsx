import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { SparkLine } from './SparkLine.js';

describe('SparkLine', () => {
  /* "It is never the only carrier of the value." That is the API here, not
     advice: the summary is required and it is rendered. */
  it('shows the summary beside the line', () => {
    renderWithCrystal(<SparkLine values={[1, 4, 2, 6]} summary="+42% this week" />);
    expect(screen.getByText('+42% this week')).toBeInTheDocument();
  });

  /* The picture is decoration: everything it carries is in the summary, and a
     reader who hears both hears the same thing twice. */
  it('hides the picture from the accessibility tree', () => {
    const { container } = renderWithCrystal(<SparkLine values={[1, 4, 2]} summary="+2" />);
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  /* A flat series has no range to scale into, and dividing by it would put every
     point at infinity. */
  it('draws a flat series flat rather than drawing nothing', () => {
    const { container } = renderWithCrystal(<SparkLine values={[5, 5, 5]} summary="No change" />);
    const d = container.querySelector('path')?.getAttribute('d') ?? '';
    expect(d).not.toMatch(/NaN|Infinity/);
    expect(d.length).toBeGreaterThan(0);
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <SparkLine values={[1, 4, 2, 6]} summary="+42% this week" />,
    );
    await expectNoAxeViolations(container);
  });
});
