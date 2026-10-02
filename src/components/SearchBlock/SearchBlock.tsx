'use client';

/* SearchBlock.
 *
 * Search with suggestions, recent queries and results.
 *
 * "**A combobox: results are announced by count, and arrow keys move without
 * losing the typed value.**" States: `at-rest`, `open`, `loading`, `empty`,
 * `focus-visible`.
 *
 * The backend and the ranking are the product's. The block owns the field, the
 * list and the announcements:
 *
 *   - The typed value is never taken away. Focus stays in the field. The arrow
 *     keys move a highlight named by `aria-activedescendant`, and the text the
 *     reader typed stays exactly as typed until they choose a row. React Aria's
 *     combobox does this, and the block keeps it by owning the input's value and
 *     never writing a highlighted row into it.
 *   - Recent queries appear when nothing is typed, as their own labelled group,
 *     so the list is useful before the first keystroke.
 *   - Counts are announced. React Aria's combobox announces how many
 *     suggestions there are as the list opens and as the number changes. The
 *     block's polite region says "Searching" while the product fetches, then how
 *     many results a search found ("12 results for harbour") or that there were
 *     none. The results heading says the same in text.
 *   - Enter searches for what was typed. A row is a shortcut to a query, and the
 *     field sits in a `role="search"` form.
 *
 * Motion is the catalogue's: the suggestions arrive with `menu-in` and leave
 * with `menu-out`; results arrive with `list-in` and leave with `list-out`.
 * "Frost overlay with Haze rows": the suggestions are the Frost popover with the
 * combobox's own row treatment, and the results are Haze rows.
 */
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  ComboBox, Input, Label, ListBox, ListBoxItem, ListBoxSection, Header, Button as AriaButton, type Key,
} from 'react-aria-components';
import { ArrivingPopover } from '../../overlays/ArrivingPopover.js';
import { FieldGroupShell } from '../FormField/FieldShell.js';
import { ListPresence, PresenceItem } from '../../motion/ListPresence.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import { cx } from '../../styles/cx.js';
import styles from './SearchBlock.module.scss';

export type SearchState = 'at-rest' | 'loading' | 'empty';

export interface SearchSuggestion {
  id: string;
  /** The query this suggestion searches for. Also its text. */
  label: string;
  description?: ReactNode;
}

export interface SearchResult {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  /** Where the result lives. Without it the title is text. */
  href?: string;
}

export interface SearchBlockProps {
  label?: string;
  placeholder?: string;
  /** What is typed. The block never writes a highlighted row into it. */
  query: string;
  onQueryChange: (query: string) => void;
  /** Suggestions for what is typed, already ranked by the product. */
  suggestions?: readonly SearchSuggestion[];
  /** Recent queries, newest first. Offered when nothing is typed. */
  recent?: readonly string[];
  /** Search for this query: Enter in the field, or a row chosen. */
  onSearch: (query: string) => void;
  /** `loading` while suggestions or results are fetched; `empty` when a search found nothing. */
  state?: SearchState;
  /** The results of the last search, or null before there has been one. */
  results?: readonly SearchResult[] | null;
  /** The query the results are for. */
  searchedFor?: string;
  resultCount?: (count: number, query: string) => string;
  /** The results heading's level. */
  headingLevel?: 2 | 3;
  className?: string;
}

const RECENT = 'recent:';

export function SearchBlock({
  label = 'Search', placeholder, query, onQueryChange, suggestions = [], recent = [], onSearch, state = 'at-rest',
  results = null, searchedFor = '',
  resultCount = (count, what) => (count === 0 ? `No results for ${what}` : `${String(count)} ${count === 1 ? 'result' : 'results'} for ${what}`),
  headingLevel = 2, className,
}: SearchBlockProps): React.JSX.Element {
  const Heading = `h${headingLevel}` as 'h2';
  const resultsHeadingId = useId();
  const typed = query.trim() !== '';
  const offering = typed ? suggestions.length : recent.length;

  /* The block's polite region says "Searching", and a search's count once it
     lands. React Aria announces the suggestions' count: its combobox says how
     many options there are as the list opens and as the number changes,
     through an announcer that its own `aria-hidden` sweep leaves alone. A
     region of the block's would be hidden by that sweep while the list is open,
     and would repeat the announcement when it was not. */
  const [said, setSaid] = useState('');
  useEffect(() => {
    if (state === 'loading') setSaid('Searching');
  }, [state]);
  /* The count is announced when a search lands. The formatter is read through a
     ref, because a default argument is a new function on every render. */
  const count = useRef(resultCount);
  count.current = resultCount;
  useEffect(() => {
    if (results) setSaid(count.current(results.length, searchedFor));
  }, [results, searchedFor]);

  const choose = (key: Key | null): void => {
    if (key === null) return;
    const id = String(key);
    const chosen = id.startsWith(RECENT) ? id.slice(RECENT.length) : suggestions.find((one) => one.id === id)?.label;
    if (chosen === undefined) return;
    onQueryChange(chosen);
    onSearch(chosen);
  };

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (typed) onSearch(query.trim());
  };

  return (
    <div className={cx(styles['search'], className)} data-cr-state={state}>
      <form role="search" onSubmit={submit} className={cx(styles['form'])}>
        <ComboBox
          inputValue={query}
          onInputChange={onQueryChange}
          onSelectionChange={choose}
          selectedKey={null}
          allowsCustomValue
          allowsEmptyCollection
          menuTrigger="focus"
          className={cx(styles['field'])}
        >
          <Label className={cx(styles['label'])}>{label}</Label>
          <FieldGroupShell isInvalid={false} className={cx(styles['shell'], 'cr-field-shell')}>
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true" className={cx(styles['glass'])}>
              <circle cx="11" cy="11" r="6" /><path d="M20 20l-4.5-4.5" />
            </svg>
            <Input className={cx(styles['control'])} {...(placeholder ? { placeholder } : {})} />
            {/* So a pointer can open the list without typing. React Aria keeps it
                out of the tab order and names it; the field is the stop. */}
            <AriaButton className={cx(styles['trigger'], 'cr-bare')}>
              <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
            </AriaButton>
          </FieldGroupShell>
          <ArrivingPopover recipe="menu-in" exit="menu-out" className={cx(styles['popover'], 'cr-frost', 'cr-scroll-frost')}>
            {state === 'loading' && typed && offering === 0 ? (
              <div className={cx(styles['state'])}>Searching</div>
            ) : (
              <ListBox
                className={cx(styles['list'])}
                renderEmptyState={() => (
                  <div className={cx(styles['state'])}>{typed ? 'No suggestions' : 'No recent searches'}</div>
                )}
              >
                {typed ? (
                  suggestions.map((one) => (
                    <ListBoxItem key={one.id} id={one.id} textValue={one.label} className={cx(styles['option'])}>
                      <span>{one.label}</span>
                      {one.description ? <span className={cx(styles['optionDescription'])}>{one.description}</span> : null}
                    </ListBoxItem>
                  ))
                ) : recent.length > 0 ? (
                  <ListBoxSection className={cx(styles['section'])}>
                    <Header className={cx(styles['header'])}>Recent searches</Header>
                    {recent.map((one) => (
                      <ListBoxItem key={one} id={`${RECENT}${one}`} textValue={one} className={cx(styles['option'])}>
                        {one}
                      </ListBoxItem>
                    ))}
                  </ListBoxSection>
                ) : null}
              </ListBox>
            )}
          </ArrivingPopover>
        </ComboBox>
      </form>

      {results ? (
        <Heading id={resultsHeadingId} className={cx(styles['resultsHeading'])}>{resultCount(results.length, searchedFor)}</Heading>
      ) : null}
      {/* Mounted from the first frame, so the first results arrive with `list-in`
          instead of being treated as the list's starting contents. */}
      <ul
        className={cx(styles['results'])}
        {...(results ? { 'aria-labelledby': resultsHeadingId } : { hidden: true })}
      >
        <ListPresence>
          {(results ?? []).map((result) => (
            <PresenceItem key={result.id} className={cx(styles['result'], 'cr-haze')}>
              {result.href ? (
                <a href={result.href} className={cx(styles['resultTitle'])}>{result.title}</a>
              ) : (
                <span className={cx(styles['resultTitle'])}>{result.title}</span>
              )}
              {result.description ? <span className={cx(styles['resultDescription'])}>{result.description}</span> : null}
            </PresenceItem>
          ))}
        </ListPresence>
      </ul>

      <VisuallyHidden role="status">{said}</VisuallyHidden>
    </div>
  );
}
