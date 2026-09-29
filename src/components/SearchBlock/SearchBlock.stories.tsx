import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { SearchBlock, type SearchResult, type SearchState, type SearchSuggestion } from './SearchBlock.js';

const catalogue: SearchSuggestion[] = [
  { id: 'harbour', label: 'harbour', description: 'Projects and documents' },
  { id: 'harbour-master', label: 'harbour master' },
  { id: 'harvest', label: 'harvest report' },
  { id: 'hiring', label: 'hiring plan' },
];

const index: SearchResult[] = [
  { id: 'r1', title: 'Harbour redevelopment', href: '#harbour', description: 'Project · updated yesterday' },
  { id: 'r2', title: 'Harbour master contacts', href: '#contacts', description: 'Document · Operations' },
  { id: 'r3', title: 'Harvest report 2026', href: '#harvest', description: 'Document · Finance' },
];

const meta = {
  title: 'Blocks/SearchBlock',
  component: SearchBlock,
  parameters: {
    docs: {
      description: {
        component:
          '"A combobox: results are announced by count, and arrow keys move without losing the typed value."\n\n'
          + 'Focus stays in the field and the arrow keys move a highlight named by `aria-activedescendant`; the '
          + 'typed text is never replaced by a highlighted row. Recent searches are offered, as their own group, '
          + 'before anything is typed. React Aria announces the suggestions\' count; the block says "Searching" '
          + 'and how many results a search found. Suggestions arrive with `menu-in` on Frost; results arrive '
          + 'with `list-in` as Haze rows.',
      },
    },
  },
  args: {
    query: '', onQueryChange: () => {}, onSearch: () => {},
    recent: ['quarterly figures', 'board minutes'],
  },
  decorators: [(Story) => <div style={{ maxInlineSize: 560, minBlockSize: 420 }}><Story /></div>],
} satisfies Meta<typeof SearchBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AtRest: Story = {};
export const Loading: Story = { args: { query: 'harbour', state: 'loading' } };
export const WithResults: Story = { args: { query: 'harbour', results: index.slice(0, 2), searchedFor: 'harbour' } };
export const Empty: Story = { args: { query: 'zzz', results: [], searchedFor: 'zzz', state: 'empty' } };

/** Type to see suggestions; Enter or a row searches, and the results arrive. */
export const AWorkingSearch: Story = {
  render: function Working(args) {
    const [query, setQuery] = useState('');
    const [state, setState] = useState<SearchState>('at-rest');
    const [results, setResults] = useState<readonly SearchResult[] | null>(null);
    const [searchedFor, setSearchedFor] = useState('');
    const [recent, setRecent] = useState(args.recent ?? []);
    const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => () => { if (timer) clearTimeout(timer); }, [timer]);
    const suggestions = query.trim()
      ? catalogue.filter((one) => one.label.includes(query.trim().toLowerCase()))
      : [];
    return (
      <SearchBlock
        {...args}
        query={query}
        onQueryChange={setQuery}
        suggestions={suggestions}
        recent={recent}
        state={state}
        results={results}
        searchedFor={searchedFor}
        onSearch={(what) => {
          setState('loading');
          setRecent((all) => [what, ...all.filter((one) => one !== what)].slice(0, 5));
          setTimer(setTimeout(() => {
            const found = index.filter((one) => String(one.title).toLowerCase().includes(what.toLowerCase().split(' ')[0] ?? ''));
            setResults(found);
            setSearchedFor(what);
            setState(found.length === 0 ? 'empty' : 'at-rest');
          }, 500));
        }}
      />
    );
  },
};
