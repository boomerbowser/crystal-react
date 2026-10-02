'use client';

/* Divider.
 *
 * The accessibility rule splits two ways, and the catalogue states both.
 *
 * A divider that only looks like a break between sections is decoration, and
 * announcing decoration as a separator adds noise, so an unlabelled divider is
 * `aria-hidden`. A divider with a label names the boundary, and the label is
 * content, so that divider is a real `separator` with an accessible name.
 *
 * `role="separator"` carries `aria-orientation`. A screen reader that says
 * "separator" without it leaves the reader to assume horizontal.
 *
 * The label is referenced with `aria-labelledby`. `separator` is not a
 * name-from-content role, so a divider whose label is only a child text node is
 * announced as an unnamed separator. Pointing at the visible text, instead of
 * copying it into `aria-label`, keeps the accessible name and the visible one
 * the same string.
 */
import { forwardRef, useId, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import styles from './Divider.module.scss';

export interface DividerProps extends HTMLAttributes<HTMLElement> {
  /** Optional label. A labelled divider is announced; an unlabelled one is decoration. */
  label?: ReactNode;
  /** Where the label sits along the rule. Ignored without a label. */
  labelPosition?: 'start' | 'center';
  orientation?: 'horizontal' | 'vertical';
}

export const Divider = forwardRef<HTMLElement, DividerProps>(function Divider(
  { label, labelPosition = 'start', orientation = 'horizontal', className, ...props },
  ref,
) {
  const labelId = useId();
  const vertical = orientation === 'vertical';

  if (label !== undefined && !vertical) {
    return (
      <div
        {...props}
        ref={ref as React.Ref<HTMLDivElement>}
        role="separator"
        aria-orientation="horizontal"
        aria-labelledby={labelId}
        className={cx(
          styles['divider'],
          styles['labelled'],
          labelPosition === 'center' ? styles['centred'] : undefined,
          className,
        )}
      >
        <span id={labelId}>{label}</span>
      </div>
    );
  }

  /* No label, so nothing to announce. A rule between two sections draws a
     boundary the headings already describe. */
  return (
    <hr
      {...props}
      ref={ref as React.Ref<HTMLHRElement>}
      aria-hidden="true"
      className={cx(styles['divider'], styles[vertical ? 'vertical' : 'horizontal'], className)}
    />
  );
});
