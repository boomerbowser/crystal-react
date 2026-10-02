'use client';

/* DropIndicator.
 *
 * Shows where a dragged item will land, and also announces it. The catalogue
 * requires that it is "announced as the drag moves, so a keyboard drag is
 * followable without sight". So the indicator is a real drop target in the
 * accessibility tree, with a name, and not decoration drawn beside a collection.
 * Inside a collection, React Aria's own `DropIndicator` makes it one.
 *
 * Crystal owns the material and the motion. The material is the palette's
 * primary, not a surface fill, because the line belongs to the gesture and not
 * to the page. It appears without moving anything: the rule is drawn on a
 * pseudo-element with no height in the flow, so the list does not part to make
 * room and shift the gap the reader is aiming at.
 *
 * Inside a React Aria collection, use `DropIndicator` from
 * `react-aria-components` with `className={dropIndicatorClassName}`. This
 * component is the standalone form, for a list a product lays out itself. It is
 * an `option`, as React Aria's is, so that list must be a `listbox`. An option
 * anywhere else is a choice with nothing to choose among, which axe reports as
 * `aria-required-parent`.
 */
import { forwardRef, type HTMLAttributes } from 'react';
import { cx } from '../../styles/cx.js';
import styles from './DropIndicator.module.scss';

/** The Crystal indicator's class, for React Aria's own `DropIndicator`. */
export const dropIndicatorClassName = styles['dropIndicator'] as string;

export interface DropIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  /** Whether the drag is currently over this gap. */
  isActive?: boolean;
  /** The gap is a target the drag cannot use. Says so rather than showing nothing. */
  isInvalid?: boolean;
  /** What dropping here would do. It is announced as well as drawn. */
  label: string;
}

export const DropIndicator = forwardRef<HTMLDivElement, DropIndicatorProps>(function DropIndicator(
  { isActive = false, isInvalid = false, label, className, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      role="option"
      aria-selected={isActive}
      aria-label={isInvalid ? `${label} — not allowed here` : label}
      aria-disabled={isInvalid || undefined}
      {...(isActive ? { 'data-drop-target': 'true' } : {})}
      data-cr-state={isInvalid ? 'invalid-target' : isActive ? 'shown' : 'hidden'}
      className={cx(styles['dropIndicator'], isInvalid ? styles['invalid'] : undefined, className)}
    />
  );
});
