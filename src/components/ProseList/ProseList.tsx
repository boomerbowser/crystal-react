'use client';

/* ProseList and Cite.
 *
 * `ProseList` is a real `ul` or `ol`, which is the whole requirement: the count
 * and the nesting are announced because the element carries them. A list built
 * from divs with bullet characters is a list only to somebody who can see it, and
 * that is the most common way a "styled list" loses its meaning.
 *
 * `unmarked` removes the visible marker and keeps the element, for a list whose
 * items carry their own leading content, such as a checklist or a set of cards.
 * The list is still announced as a list of N.
 *
 * `Cite` names a work, not a person, which is what the element means. An
 * attribution reads "Name, Work" with only the second part marked up. Putting
 * the person inside the `cite` is a common error, and it tells a screen reader
 * the person is a publication.
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import styles from './ProseList.module.scss';

export interface ProseListProps extends HTMLAttributes<HTMLElement> {
  /** Ordered when the sequence carries meaning; unordered otherwise. */
  ordered?: boolean;
  /** Drop the visible marker, keeping the list semantics. */
  unmarked?: boolean;
  children?: ReactNode;
}

export const ProseList = forwardRef<HTMLElement, ProseListProps>(function ProseList(
  { ordered = false, unmarked = false, className, children, ...props },
  ref,
) {
  const List = ordered ? 'ol' : 'ul';
  return (
    <List
      {...props}
      ref={ref as never}
      className={cx(styles['list'], unmarked ? styles['unmarked'] : undefined, className)}
    >
      {children}
    </List>
  );
});

export interface CiteProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

/** The title of a work. A person's name is plain text beside it, not inside it. */
export const Cite = forwardRef<HTMLElement, CiteProps>(function Cite(
  { className, children, ...props },
  ref,
) {
  return <cite {...props} ref={ref} className={className}>{children}</cite>;
});
