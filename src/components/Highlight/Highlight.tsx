'use client';

/* Mark and Highlight.
 *
 * `Mark` is one run of highlighted text. `Highlight` finds the matches inside a
 * string and marks them, which is the search-results case and the reason both
 * exist: doing it by hand means splitting a sentence into an array of fragments,
 * and a sentence split into fragments is a sentence a screen reader reads as
 * fragments.
 *
 * So the whole string stays one text node's worth of content with `mark` elements
 * inside it, which is what the catalogue means by "the surrounding sentence
 * remains readable as one string".
 *
 * **Highlighting is never the only indication of a match.** That is the
 * catalogue's rule and it cannot be enforced here: a results list has to say how
 * many matches there are, or which field matched, in text. Colour alone is not an
 * indication, and neither is a background nobody can see.
 */
import { useMemo, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import styles from './Highlight.module.scss';

export interface MarkProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

/** One run of highlighted text. A real `mark`. */
export function Mark({ className, children, ...props }: MarkProps): React.JSX.Element {
  return <mark {...props} className={cx(styles['mark'], className)}>{children}</mark>;
}

export interface HighlightProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** The full text. Stays one readable string; only the matches are wrapped. */
  children: string;
  /** What to mark. A string, or several — an empty one marks nothing. */
  query: string | readonly string[];
  /** Match regardless of case. On by default: a search usually should. */
  ignoreCase?: boolean;
}

/* Escaped, because a query is somebody's typing rather than a pattern. Without
   this a search for "c++" or "(" throws, which is a crash on an input a person
   is allowed to make. */
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function Highlight({
  children, query, ignoreCase = true, className, ...props
}: HighlightProps): React.JSX.Element {
  const parts = useMemo(() => {
    const queries = (Array.isArray(query) ? query : [query])
      .filter((term): term is string => typeof term === 'string' && term.length > 0);
    if (queries.length === 0) return [children];

    const pattern = new RegExp(`(${queries.map(escapeRegExp).join('|')})`, ignoreCase ? 'gi' : 'g');
    return children.split(pattern);
  }, [children, query, ignoreCase]);

  const queries = (Array.isArray(query) ? query : [query]).filter(Boolean) as string[];
  const matches = new Set(queries.map((term) => (ignoreCase ? term.toLowerCase() : term)));

  return (
    <span {...props} className={className}>
      {parts.map((part, index) => (
        matches.has(ignoreCase ? part.toLowerCase() : part)
          // eslint-disable-next-line react/no-array-index-key
          ? <Mark key={index}>{part}</Mark>
          // eslint-disable-next-line react/no-array-index-key
          : <span key={index}>{part}</span>
      ))}
    </span>
  );
}
