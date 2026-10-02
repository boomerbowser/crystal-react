import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { GeoMap } from './GeoMap.js';

const features = [
  {
    type: 'Feature', id: 'north', properties: { name: 'North' },
    geometry: { type: 'Polygon', coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]] },
  },
  {
    type: 'Feature', id: 'south', properties: { name: 'South' },
    geometry: { type: 'Polygon', coordinates: [[[0, -10], [10, -10], [10, 0], [0, 0], [0, -10]]] },
  },
];

describe('GeoMap', () => {
  /* On a map the picture carries the identity of each mark as well as its
     value. A reader who cannot see it cannot tell which shape is which. */
  it('names every region and states its value', () => {
    renderWithCrystal(<GeoMap label="Sales" features={features} values={{ north: 42 }} />);
    expect(screen.getByLabelText('North, 42')).toBeInTheDocument();
  });

  /* A region the join missed is different from a region with the lowest value.
     Painting them the same would invent a measurement for every miss. */
  it('says a region has no value rather than painting it the lowest step', () => {
    renderWithCrystal(<GeoMap label="Sales" features={features} values={{ north: 42 }} />);
    const missed = screen.getByLabelText('South, no value');
    expect(missed.hasAttribute('data-empty')).toBe(true);
  });

  it('lists every region in the table, joined or not', () => {
    renderWithCrystal(<GeoMap label="Sales" features={features} values={{ north: 42 }} />);
    expect(screen.getByRole('rowheader', { name: 'North' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'South' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '—' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <GeoMap label="Sales by region" features={features} values={{ north: 42, south: 18 }} />,
    );
    await expectNoAxeViolations(container);
  });
});
