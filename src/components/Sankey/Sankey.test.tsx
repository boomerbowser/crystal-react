import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Sankey } from './Sankey.js';

const nodes = [{ name: 'Search' }, { name: 'Direct' }, { name: 'Signed up' }, { name: 'Left' }];
const links = [
  { source: 'Search', target: 'Signed up', value: 40 },
  { source: 'Search', target: 'Left', value: 60 },
  { source: 'Direct', target: 'Signed up', value: 30 },
];

describe('Sankey', () => {
  /* The nodes are the labels and the links are the data, so naming only the
     nodes would describe nothing. */
  it('states both endpoints and the volume of every link', () => {
    renderWithCrystal(<Sankey label="Traffic" nodes={nodes} links={links} />);
    expect(screen.getByLabelText('Search to Left, 60')).toBeInTheDocument();
    expect(screen.getByLabelText('Direct to Signed up, 30')).toBeInTheDocument();
  });

  it('lists every link in the table', () => {
    renderWithCrystal(<Sankey label="Traffic" nodes={nodes} links={links} />);
    expect(screen.getByRole('columnheader', { name: 'From' })).toBeInTheDocument();
    expect(screen.getAllByRole('row').length).toBe(links.length + 1);
  });

  /* `d3-sankey` writes its layout onto the objects it is given, so the input is
     cloned. Otherwise a second render would lay out the first render's output,
     and the picture would drift on every re-render. */
  it('does not write the layout back onto the caller data', () => {
    const own = links.map((link) => ({ ...link }));
    renderWithCrystal(<Sankey label="Traffic" nodes={nodes} links={own} />);
    for (const link of own) {
      expect(Object.keys(link).sort()).toEqual(['source', 'target', 'value']);
      expect(typeof link.source).toBe('string');
    }
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<Sankey label="Traffic" nodes={nodes} links={links} />);
    await expectNoAxeViolations(container);
  });
});
