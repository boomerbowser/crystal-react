import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { CompareTable, differs } from './CompareTable.js';

const products = [
  { id: 'a', label: 'Harbour print' },
  { id: 'b', label: 'Quay print' },
];

const attributes = [
  { id: 'size', label: 'Size', values: ['A2', 'A2'] },
  { id: 'frame', label: 'Frame', values: ['Oak', 'Ash'] },
  { id: 'weight', label: 'Weight', values: [<span key="a">1.2 kg</span>, '1.2 kg'] },
];

describe('CompareTable', () => {
  /* "A real table with row and column headers." In a comparison the row header
     is the attribute and the column header is the product. Without both, a cell
     reads as a bare value with no indication of what it belongs to. */
  it('has both row headers and column headers', () => {
    const { container } = renderWithCrystal(
      <CompareTable label="Compare prints" products={products} attributes={attributes} />,
    );
    expect(container.querySelectorAll('thead th[scope="col"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('tbody th[scope="row"]')).toHaveLength(3);
  });

  /* "Differences are stated in text". A reader comparing four products across
     twelve attributes is looking for the rows where they differ, and a tint
     alone tells only people who can see it. */
  it('says in words which rows differ', () => {
    renderWithCrystal(
      <CompareTable label="Compare prints" products={products} attributes={attributes} />,
    );
    expect(screen.getByRole('rowheader', { name: /Frame, differs/ })).toBeInTheDocument();
    expect(screen.queryByRole('rowheader', { name: /Size, differs/ })).toBeNull();
  });

  /* Two cells that read the same are the same, whatever elements they are made
     of, because a reader compares what is written. */
  it('compares what is written, not how it is written', () => {
    expect(differs(['1.2 kg', <span key="a">1.2 kg</span>])).toBe(false);
    expect(differs(['1.2 kg', '1.4 kg'])).toBe(true);
    /* One product is not a comparison. */
    expect(differs(['1.2 kg'])).toBe(false);
  });

  /* Computed from the values. A flag passed in from outside cannot be checked
     and goes stale as soon as a product joins the comparison. */
  it('works the difference out rather than being told', () => {
    const { rerenderWithCrystal } = renderWithCrystal(
      <CompareTable label="Compare" products={products} attributes={[attributes[0]!]} />,
    );
    expect(screen.queryByRole('rowheader', { name: /differs/ })).toBeNull();

    rerenderWithCrystal(
      <CompareTable
        label="Compare"
        products={[...products, { id: 'c', label: 'Bridge print' }]}
        attributes={[{ id: 'size', label: 'Size', values: ['A2', 'A2', 'A3'] }]}
      />,
    );
    expect(screen.getByRole('rowheader', { name: /Size, differs/ })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <CompareTable label="Compare prints" products={products} attributes={attributes} />,
    );
    await expectNoAxeViolations(container);
  });
});
