import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { SortSelect } from './SortSelect.js';

const options = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price-asc', label: 'Price, lowest first' },
  { value: 'newest', label: 'Newest' },
];

describe('SortSelect', () => {
  /* "A select whose current ordering is announced on change." Pressing this
     silently rewrites a list the reader is not looking at: a sighted reader
     sees it flip, a screen reader hears the select close and then nothing. */
  it('announces the ordering when it changes', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<SortSelect options={options} defaultSelectedKey="relevance" />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();

    await user.click(screen.getByRole('button', { name: /Sort by/ }));
    await user.click(screen.getByRole('option', { name: 'Newest' }));
    expect(screen.getByRole('status')).toHaveTextContent('Sorted by Newest');
  });

  /* A list that arrives sorted has not been reordered. */
  it('says nothing about the ordering it started in', () => {
    renderWithCrystal(<SortSelect options={options} defaultSelectedKey="newest" />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <SortSelect options={options} defaultSelectedKey="relevance" />,
    );
    await expectNoAxeViolations(container);
  });
});
