import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent, waitFor, within } from '../../test/render.js';
import { SearchBlock, type SearchBlockProps, type SearchResult, type SearchSuggestion } from './SearchBlock.js';

const catalogue: SearchSuggestion[] = [
  { id: 'h1', label: 'harbour' },
  { id: 'h2', label: 'harbour master' },
  { id: 'h3', label: 'harvest' },
];

/* A search whose query is real, with suggestions filtered by prefix. */
function Harness({ onSearch = () => {}, ...rest }: Partial<SearchBlockProps>) {
  const [query, setQuery] = useState('');
  const suggestions = query ? catalogue.filter((one) => one.label.startsWith(query)) : [];
  return (
    <SearchBlock
      query={query}
      onQueryChange={setQuery}
      suggestions={suggestions}
      recent={['quarterly figures', 'board minutes']}
      onSearch={onSearch}
      {...rest}
    />
  );
}

const results: SearchResult[] = [
  { id: 'r1', title: 'Harbour redevelopment', href: '/p/harbour', description: 'Project' },
  { id: 'r2', title: 'Harbour master contacts', description: 'Document' },
];

describe('SearchBlock', () => {
  it('is a combobox inside a search landmark', () => {
    renderWithCrystal(<Harness />);
    expect(within(screen.getByRole('search')).getByRole('combobox', { name: 'Search' })).toBeInTheDocument();
  });

  it('offers recent searches as their own group before anything is typed', async () => {
    renderWithCrystal(<Harness />);
    await userEvent.click(screen.getByRole('combobox'));
    const listbox = await screen.findByRole('listbox');
    const group = within(listbox).getByRole('group', { name: 'Recent searches' });
    expect(within(group).getAllByRole('option').map((one) => one.textContent)).toEqual(['quarterly figures', 'board minutes']);
  });

  /* The opinion's first half: arrow keys move without losing the typed value. */
  it('keeps the typed value while the arrow keys move the highlight', async () => {
    renderWithCrystal(<Harness />);
    const field = screen.getByRole('combobox');
    await userEvent.type(field, 'harb');
    await screen.findByRole('listbox');
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(field).toHaveValue('harb');
    expect(field).toHaveFocus();
    const active = field.getAttribute('aria-activedescendant');
    expect(active).toBeTruthy();
    expect(document.getElementById(active!)).toHaveTextContent('harbour master');
  });

  it('searches for what was typed on Enter, and for a row when one is chosen', async () => {
    const onSearch = vi.fn();
    renderWithCrystal(<Harness onSearch={onSearch} />);
    const field = screen.getByRole('combobox');
    await userEvent.type(field, 'harv{Escape}{Enter}');
    expect(onSearch).toHaveBeenLastCalledWith('harv');
    await userEvent.clear(field);
    await userEvent.type(field, 'harb');
    await userEvent.click(await screen.findByRole('option', { name: 'harbour master' }));
    expect(onSearch).toHaveBeenLastCalledWith('harbour master');
    expect(field).toHaveValue('harbour master');
  });

  /* The opinion's second half: results are announced by count. */
  /* Through React Aria's announcer, which its own aria-hidden sweep leaves
     reachable while the list is open. */
  it('says how many suggestions there are as they change', async () => {
    renderWithCrystal(<Harness />);
    await userEvent.type(screen.getByRole('combobox'), 'har');
    await userEvent.type(screen.getByRole('combobox'), 'b');
    await waitFor(() => {
      expect(document.querySelector('[data-live-announcer]')).toHaveTextContent(/2 options available/);
    });
  });

  it('says searching, then how many results a search found, and heads the results with the same', () => {
    const { rerender } = renderWithCrystal(<SearchBlock query="harbour" onQueryChange={() => {}} onSearch={() => {}} />);
    expect(screen.getByRole('status')).toHaveTextContent('');
    rerender(<SearchBlock query="harbour" onQueryChange={() => {}} onSearch={() => {}} state="loading" />);
    expect(screen.getByRole('status')).toHaveTextContent('Searching');
    rerender(<SearchBlock query="harbour" onQueryChange={() => {}} onSearch={() => {}} results={results} searchedFor="harbour" />);
    expect(screen.getByRole('status')).toHaveTextContent('2 results for harbour');
    const list = screen.getByRole('list', { name: '2 results for harbour' });
    expect(within(list).getByRole('link', { name: 'Harbour redevelopment' })).toHaveAttribute('href', '/p/harbour');
  });

  it('says when a search found nothing', () => {
    renderWithCrystal(<SearchBlock query="zzz" onQueryChange={() => {}} onSearch={() => {}} results={[]} searchedFor="zzz" state="empty" />);
    expect(screen.getByRole('heading', { name: 'No results for zzz' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('No results for zzz');
  });

  it.each([
    ['at-rest', {}],
    ['loading', { state: 'loading' as const }],
    ['empty', { state: 'empty' as const, results: [], searchedFor: 'zzz' }],
    ['with results', { results, searchedFor: 'harbour' }],
  ])('has no axe violations %s', async (_, extra) => {
    const { container } = renderWithCrystal(<SearchBlock query="" onQueryChange={() => {}} onSearch={() => {}} {...extra} />);
    await expectNoAxeViolations(container);
  });

  /* The block and its popover are each checked in their own scope. On the whole
     body, axe's best-practice `region` rule objects to the portalled popover
     sitting outside the block's search landmark. Every React Aria popover does
     that on any page with a landmark, and no markup inside the block can change
     it. */
  it('has no axe violations open', async () => {
    const { container } = renderWithCrystal(<Harness />);
    await userEvent.type(screen.getByRole('combobox'), 'harb');
    const listbox = await screen.findByRole('listbox');
    await expectNoAxeViolations(container);
    await expectNoAxeViolations(listbox.parentElement!);
  });
});
