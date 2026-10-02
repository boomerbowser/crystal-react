'use client';

/* ThemeIcon: an icon in a filled container, used as a visual anchor.
 *
 * It is not a control. An icon in a filled circle looks exactly like an icon
 * button, so the difference has to be in its behaviour. It takes no press
 * handler, has no hit area, and is not focusable.
 *
 * "Decorative and aria-hidden unless it is the only carrier of meaning." The
 * caller chooses between two states. Without a `label` the container is hidden
 * from assistive technology, so an anchor beside a heading that already says the
 * same thing is not read twice. With a `label` it becomes `role="img"` and the
 * label is its accessible name.
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import styles from './ThemeIcon.module.scss';

/** Which fill the container takes. */
export type ThemeIconVariant = 'primary' | 'surface';

/** Content radius, or a circle. */
export type ThemeIconShape = 'content' | 'circle';

export interface ThemeIconProps extends HTMLAttributes<HTMLSpanElement> {
  /** The icon. Sized by the container, not by itself. */
  children: ReactNode;
  variant?: ThemeIconVariant;
  shape?: ThemeIconShape;
  /** What the icon means, when the icon is the only thing that says it. */
  label?: string;
}

export const ThemeIcon = forwardRef<HTMLSpanElement, ThemeIconProps>(function ThemeIcon(
  { children, variant = 'primary', shape = 'content', label, className, ...props },
  ref,
) {
  /* `role="img"` with a name, or hidden. An unnamed `role="img"` is announced as
     "image" and conveys nothing. */
  const semantics = label === undefined
    ? { 'aria-hidden': true as const }
    : { role: 'img' as const, 'aria-label': label };

  return (
    <span
      {...props}
      {...semantics}
      ref={ref}
      className={cx(
        styles['themeIcon'],
        styles[variant],
        shape === 'circle' ? styles['circle'] : undefined,
        className,
      )}
    >
      {children}
    </span>
  );
});
