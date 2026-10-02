'use client';

/* Mark and Highlight.
 *
 * `Mark` is one run of highlighted text. `Highlight` finds the matches inside a
 * string and marks them, for search results. Doing it by hand means splitting a
 * sentence into an array of fragments, which a screen reader reads as
 * fragments.
 *
 * The whole string stays one text node's worth of content with `mark` elements
 * inside it, which is what the catalogue means by "the surrounding sentence
 * remains readable as one string".
 *
 * Highlighting is never the only indication of a match. That is the
 * catalogue's rule, and this component cannot enforce it: a results list has to
 * say in text how many matches there are, or which field matched. Colour alone
 * is not an indication, and neither is a background nobody can see.
 */
import { useEffect, useMemo, useRef, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import { useMotion } from '../../motion/useMotion.js';
import { Arrival } from '../../motion/Arrival.js';
import styles from './Highlight.module.scss';

export interface MarkProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
  /**
   * The mark has just appeared because what is being searched for changed, so
   * it plays Crystal's \`highlight\` once as it arrives. \`Highlight\` sets it; a
   * mark rendered by hand with the rest of the page does not need it.
   */
  arriving?: boolean;
}

/** One run of highlighted text. A real `mark`. */
export function Mark({ className, children, arriving = false, ...props }: MarkProps): React.JSX.Element {
  return (
    <mark {...props} className={cx(styles['mark'], className)}>
      {children}
      {arriving ? <ArrivingCue /> : null}
    </mark>
  );
}

/* The wash \`highlight\` plays on, under the mark's text, once, on the mount that
   is the mark's arrival. */
function ArrivingCue(): React.JSX.Element {
  const [scope, play] = useMotion();
  return (
    <span ref={scope as never} aria-hidden="true" className={cx(styles['cue'])}>
      <Arrival play={play} recipe="highlight" />
    </span>
  );
}

export interface HighlightProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** The full text. Stays one readable string; only the matches are wrapped. */
  children: string;
  /** What to mark. A string, or several. An empty one marks nothing. */
  query: string | readonly string[];
  /** Match regardless of case. On by default, because a search usually should. */
  ignoreCase?: boolean;
}

/* Escaped, because a query is somebody's typing and not a pattern. Without
   this a search for "c++" or "(" throws on an input a person is allowed to
   make. */
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

  /* Marks on the first render were there when the text arrived. Marks after it
     appeared because the query changed, and those play the catalogue's
     \`highlight\`. Keyed by the query as well as the position, so a new query
     mounts new marks instead of reusing old ones with new words in them. */
  const settled = useRef(false);
  useEffect(() => { settled.current = true; });
  const generation = queries.join('\u0000');

  return (
    <span {...props} className={className}>
      {parts.map((part, index) => (
        matches.has(ignoreCase ? part.toLowerCase() : part)
          // eslint-disable-next-line react/no-array-index-key
          ? <Mark key={`${generation}:${index}`} arriving={settled.current}>{part}</Mark>
          // eslint-disable-next-line react/no-array-index-key
          : <span key={index}>{part}</span>
      ))}
    </span>
  );
}
