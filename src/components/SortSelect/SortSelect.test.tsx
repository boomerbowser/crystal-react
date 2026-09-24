import { describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
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
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Sorted by Newest');
    });
  });

  /* Said after the list has moved, not when moving it was asked for. Most
     orderings are a round trip; a reader told "sorted by newest" who then
     arrives at the old list has been told something false by the one thing
     whose job was to tell them the truth. */
  it('waits for the list to actually be reordered', async () => {
    const user = userEvent.setup();
    let finish = () => {};
    const reorder = vi.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
    renderWithCrystal(
      <SortSelect options={options} defaultSelectedKey="relevance" onSelectionChange={reorder} />,
    );
    await user.click(screen.getByRole('button', { name: /Sort by/ }));
    await user.click(screen.getByRole('option', { name: 'Newest' }));

    expect(reorder).toHaveBeenCalled();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();

    finish();
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Sorted by Newest');
    });
  });

  /* A sort that failed is the product's to report, and this component saying it
     succeeded would be worse than silence. */
  it('says nothing when the reorder fails', async () => {
    const user = userEvent.setup();
    renderWithCrystal(
      <SortSelect
        options={options}
        defaultSelectedKey="relevance"
        onSelectionChange={() => Promise.reject(new Error('the server refused'))}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Sort by/ }));
    await user.click(screen.getByRole('option', { name: 'Newest' }));
    await new Promise((resolve) => { setTimeout(resolve, 50); });
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
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
