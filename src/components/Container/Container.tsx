'use client';

/* Container.
 *
 * Two ceilings, because Crystal has two: the shell, which is how wide the page
 * becomes, and the reading column, which is how wide a line of prose is allowed
 * to get before it stops being comfortable to read. They are different numbers
 * for different reasons and a single `size="lg"` scale would blur that, so the
 * prop names the intent instead.
 *
 * Presentational, and the catalogue says so in as many words: "must not
 * introduce a landmark". A container that renders a `main` or a `section` adds a
 * landmark to the page for a decision about width — and a screen reader user then
 * navigates by landmarks into boxes that mean nothing. Pass `as` when the element
 * genuinely is one.
 */
import { forwardRef, type CSSProperties, type ElementType, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import styles from './Container.module.scss';

export interface ContainerProps extends HTMLAttributes<HTMLElement> {
  /**
   * `shell` is the full page width; `reading` is the prose column. Defaults to
   * `shell`, which is the one a page layout wants.
   */
  width?: 'shell' | 'reading';
  as?: ElementType;
  children?: ReactNode;
}

export const Container = forwardRef<HTMLElement, ContainerProps>(function Container(
  { width = 'shell', as: Element = 'div', className, style, children, ...props },
  ref,
) {
  const ceiling: CSSProperties = width === 'reading'
    ? { '--cr-container-max': 'var(--cr-layout-reading-max)' } as CSSProperties
    : {};

  return (
    <Element
      {...props}
      ref={ref}
      className={cx(styles['container'], className)}
      style={{ ...ceiling, ...style }}
    >
      {children}
    </Element>
  );
});
