'use client';

/* Kbd — a key cap.
 *
 * A real `kbd` element, because the semantics are the point: assistive technology
 * and search indexes both treat `kbd` as "this is a key to press", and a styled
 * `span` is a picture of one.
 *
 * "Key names are spelled, not drawn as symbols alone." A cap reading "⌘" tells a
 * screen-reader user nothing and tells a Windows user the wrong thing, so a
 * component that renders a symbol carries the spelled name alongside it. That is
 * what `name` is for: the glyph is shown, the word is announced.
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import styles from './Kbd.module.scss';

export interface KbdProps extends HTMLAttributes<HTMLElement> {
  /** What is printed on the cap. */
  children: ReactNode;
  /** The spelled name, when the cap shows a symbol. Announced instead of it. */
  name?: string;
}

export const Kbd = forwardRef<HTMLElement, KbdProps>(function Kbd(
  { children, name, className, ...props },
  ref,
) {
  return (
    <kbd {...props} ref={ref} className={cx(styles['kbd'], className)}>
      {name === undefined ? children : (
        <>
          <span aria-hidden="true">{children}</span>
          <VisuallyHidden>{name}</VisuallyHidden>
        </>
      )}
    </kbd>
  );
});
