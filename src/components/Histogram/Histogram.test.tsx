import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Histogram, binValues } from './Histogram.js';

const values = [1, 2, 2, 3, 4, 4, 4, 5, 8, 9, 10];

describe('Histogram', () => {
  /* "Bin bounds and counts are text" — not a position and a height. */
  it('states each bin by its bounds and its count', () => {
    renderWithCrystal(
      <Histogram label="Response times" values={values} bins={2} formatBin={(a, b) => `${a}–${b}`} />,
    );
    expect(screen.getByLabelText('1–5.5, 8')).toBeInTheDocument();
  });

  /* The largest value belongs in the last bin, not off the end of it: a
     half-open rule applied to every bin loses the maximum. */
  it('counts the largest value rather than dropping it off the end', () => {
    const bins = binValues([0, 5, 10], 2);
    expect(bins.map((bin) => bin.count)).toEqual([1, 2]);
  });

  /* "Bins meet without gaps." Adjacent edges, not a width per bin — a rounded
     width leaves a sub-pixel gap that draws a range where nothing was counted. */
  it('draws bins that meet', () => {
    /* Every bin has something in it, because a bin with nothing in it draws no
       path at all and there is then no edge to compare. */
    const { container } = renderWithCrystal(
      <Histogram label="Response times" values={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]} bins={4} />,
    );
    const edges = Array.from(container.querySelectorAll('[role="graphics-symbol"] path'))
      .map((path) => /^M([\d.]+),/.exec(path.getAttribute('d') ?? '')?.[1])
      .map(Number);
    const gaps = edges.slice(1).map((edge, i) => edge - edges[i]!);
    /* Every start is exactly one bin width from the last, which is only true
       when the bins abut. Compared to a tolerance rather than by rounding:
       rounding turns a real one-pixel gap into a pass on half the widths. */
    expect(Math.max(...gaps) - Math.min(...gaps)).toBeLessThan(0.001);
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<Histogram label="Response times" values={values} />);
    await expectNoAxeViolations(container);
  });
});
