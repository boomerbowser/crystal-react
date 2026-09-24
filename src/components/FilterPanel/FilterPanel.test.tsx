import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { FilterPanel } from './FilterPanel.js';
import { CheckboxGroup, Checkbox } from '../Checkbox/Checkbox.js';

const applied = [
  { id: 'blue', label: 'Blue' },
  { id: 'large', label: 'Large' },
];

function facets() {
  return (
    <CheckboxGroup label="Colour">
      <Checkbox value="blue">Blue (12)</Checkbox>
      <Checkbox value="green">Green (3)</Checkbox>
    </CheckboxGroup>
  );
}

describe('FilterPanel', () => {
  /* "Applied filters are announced." Filtering is the one interaction where the
     reader's action happens here and its whole effect happens somewhere else —
     a checkbox going on says "checked" and nothing about the four hundred
     products that just became eleven. */
  it('announces what is applied, with how many results it leaves', () => {
    renderWithCrystal(
      <FilterPanel applied={applied} resultCount={11}>{facets()}</FilterPanel>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Blue, Large. 11 results');
  });

  it('says nothing when nothing is applied', () => {
    renderWithCrystal(<FilterPanel>{facets()}</FilterPanel>);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  /* "Individually removable" — a control per filter, not just Clear all. A
     reader who has applied six filters and wants five of them is otherwise made
     to start again. */
  it('offers a named control for each applied filter', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    renderWithCrystal(
      <FilterPanel applied={applied} onRemove={onRemove}>{facets()}</FilterPanel>,
    );
    await user.click(screen.getByRole('button', { name: 'Remove Blue' }));
    expect(onRemove).toHaveBeenCalledWith('blue');
    expect(screen.getByRole('button', { name: 'Remove Large' })).toBeInTheDocument();
  });

  /* A disabled Clear all on a panel with nothing applied is a control that
     exists to be greyed out. */
  it('offers Clear all only when there is something to clear', () => {
    const { rerenderWithCrystal } = renderWithCrystal(
      <FilterPanel onClearAll={() => {}}>{facets()}</FilterPanel>,
    );
    expect(screen.queryByRole('button', { name: 'Clear all filters' })).toBeNull();

    rerenderWithCrystal(
      <FilterPanel applied={applied} onClearAll={() => {}}>{facets()}</FilterPanel>,
    );
    expect(screen.getByRole('button', { name: 'Clear all filters' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <FilterPanel applied={applied} onRemove={() => {}} onClearAll={() => {}} resultCount={11}>
        {facets()}
      </FilterPanel>,
    );
    await expectNoAxeViolations(container);
  });
});
