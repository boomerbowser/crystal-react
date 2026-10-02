import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Gauge } from './Gauge.js';

describe('Gauge', () => {
  /* A meter is a measurement within a known range. A progress bar is a task
     getting closer to finishing. They announce differently, and a gauge is a
     meter. */
  it('is a meter with a text value, not a progress bar', () => {
    renderWithCrystal(<Gauge label="Disk used" value={62} valueLabel="62%" />);
    const meter = screen.getByRole('meter', { name: 'Disk used' });
    expect(meter.getAttribute('aria-valuenow')).toBe('62');
    expect(meter.getAttribute('aria-valuemax')).toBe('100');
    expect(meter.getAttribute('aria-valuetext')).toBe('62%');
  });

  /* "Threshold colour from status tokens", and never colour alone. The band's
     name is in the meter's own text and on the screen beside the number. */
  it('names the band as well as colouring it', () => {
    renderWithCrystal(
      <Gauge label="Disk used" value={94} valueLabel="94%" status="danger" statusLabel="Nearly full" />,
    );
    expect(screen.getByRole('meter').getAttribute('aria-valuetext')).toBe('94%, Nearly full');
    expect(screen.getByText('Nearly full')).toBeInTheDocument();
  });

  it('clamps a value outside its range rather than drawing past the arc', () => {
    const { container } = renderWithCrystal(<Gauge label="Load" value={180} max={100} />);
    for (const path of Array.from(container.querySelectorAll('path'))) {
      expect(path.getAttribute('d')).not.toMatch(/NaN/);
    }
    expect(screen.getByRole('meter').getAttribute('aria-valuenow')).toBe('180');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <Gauge label="Disk used" value={62} valueLabel="62%" />,
    );
    await expectNoAxeViolations(container);
  });
});
