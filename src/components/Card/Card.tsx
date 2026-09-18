'use client';

/* Card.
 *
 * A surface, not a control. It has no press behaviour and no motion of its own —
 * Crystal's catalogue assigns Card no recipe, and inventing one here would be a
 * library adding motion the design system did not specify.
 *
 * It renders a `section` when given an accessible name and a `div` otherwise,
 * because a landmark without a name is noise in a screen reader's landmark list.
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import styles from './Card.module.scss';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
  /** Renders the card as a named region. Without a name it stays a plain div. */
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

export const Card = forwardRef<HTMLElement, CardProps>(function Card(
  { children, className, ...props },
  ref,
) {
  const named = Boolean(props['aria-label'] ?? props['aria-labelledby']);
  const Element = named ? 'section' : 'div';
  const classes = cx(styles['card'], className);

  return (
    <Element {...props} ref={ref as never} className={classes}>
      {children}
    </Element>
  );
});
