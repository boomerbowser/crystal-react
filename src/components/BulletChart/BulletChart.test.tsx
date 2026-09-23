import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { BulletChart } from './BulletChart.js';

const ranges = [
  { to: 50, name: 'below plan' },
  { to: 75, name: 'acceptable' },
  { to: 100, name: 'good' },
];

describe('BulletChart', () => {
  /* The target is the point. A reader told "62" has been told nothing. */
  it('states the target in the meter text and on the screen', () => {
    renderWithCrystal(<BulletChart label="Revenue" value={62} target={80} ranges={ranges} />);
    const meter = screen.getByRole('meter', { name: 'Revenue' });
    expect(meter.getAttribute('aria-valuetext')).toBe('62 of a target of 80, acceptable');
    expect(screen.getByText('62 of a target of 80, acceptable')).toBeInTheDocument();
  });

  /* A band with no name is a colour, which is the thing the catalogue is ruling
     out — so the band a value falls in is named wherever the value is read. */
  it('names the band a value falls in', () => {
    const { rerenderWithCrystal } = renderWithCrystal(
      <BulletChart label="Revenue" value={92} target={80} ranges={ranges} />,
    );
    expect(screen.getByRole('meter').getAttribute('aria-valuetext')).toMatch(/good$/);
    rerenderWithCrystal(<BulletChart label="Revenue" value={20} target={80} ranges={ranges} />);
    expect(screen.getByRole('meter').getAttribute('aria-valuetext')).toMatch(/below plan$/);
  });

  it('works with no ranges at all', () => {
    renderWithCrystal(<BulletChart label="Revenue" value={62} target={80} />);
    expect(screen.getByRole('meter').getAttribute('aria-valuetext')).toBe('62 of a target of 80');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <BulletChart label="Revenue" value={62} target={80} ranges={ranges} />,
    );
    await expectNoAxeViolations(container);
  });
});
