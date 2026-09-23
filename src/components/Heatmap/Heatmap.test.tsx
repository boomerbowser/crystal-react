import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Heatmap } from './Heatmap.js';

const rows = [[1, 8, null], [4, 2, 9]];
const rowLabels = ['Europe', 'Americas'];
const columnLabels = ['Mon', 'Tue', 'Wed'];

describe('Heatmap', () => {
  /* "Intensity is paired with a value; colour alone never carries meaning." */
  it('states every cell as a row, a column and a number', () => {
    renderWithCrystal(
      <Heatmap label="Incidents" rows={rows} rowLabels={rowLabels} columnLabels={columnLabels} />,
    );
    expect(screen.getByLabelText('Americas, Wed, 9')).toBeInTheDocument();
  });

  /* "No data" and "the least data" are different facts. A cell with nothing in
     it is the plot showing through, and it says so. */
  it('says a missing measurement rather than drawing the palest step', () => {
    const { container } = renderWithCrystal(
      <Heatmap label="Incidents" rows={rows} rowLabels={rowLabels} columnLabels={columnLabels} />,
    );
    const empty = screen.getByLabelText('Europe, Wed, no measurement');
    expect(empty.hasAttribute('data-empty')).toBe(true);
    expect(container.querySelectorAll('[data-empty]').length).toBe(1);
  });

  /* Each cell carries the ink Crystal measured against its own step, which is
     what makes the pairing readable rather than merely present. */
  it('gives every cell the ink measured against its own step', () => {
    const { container } = renderWithCrystal(
      <Heatmap label="Incidents" rows={rows} rowLabels={rowLabels} columnLabels={columnLabels} />,
    );
    const inks = new Set(Array.from(container.querySelectorAll('[role="graphics-symbol"]'))
      .map((cell) => (cell as HTMLElement).style.getPropertyValue('--cell-ink')));
    expect(inks.size).toBeGreaterThan(1);
    for (const ink of inks) expect(ink).toMatch(/--cr-chart-on-heat-\d|--cr-muted/);
  });

  /* Three states, three marks. A cell of nought and a cell nobody measured are
     as different from each other as either is from a busy one, and drawing them
     alike is a chart inventing a zero. */
  it('tells a measured nought from a missing measurement', () => {
    renderWithCrystal(
      <Heatmap label="Incidents" rows={[[0, null]]} rowLabels={['Europe']} columnLabels={['Mon', 'Tue']} />,
    );
    const nought = screen.getByLabelText('Europe, Mon, 0');
    const missing = screen.getByLabelText('Europe, Tue, no measurement');
    expect(nought.hasAttribute('data-empty')).toBe(true);
    expect(nought.hasAttribute('data-missing')).toBe(false);
    expect(missing.hasAttribute('data-missing')).toBe(true);
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <Heatmap label="Incidents by day" rows={rows} rowLabels={rowLabels} columnLabels={columnLabels} />,
    );
    await expectNoAxeViolations(container);
  });
});
