'use client';

/* Divider.
 *
 * The accessibility rule is the whole design here, and it splits two ways.
 *
 * A divider that only *looks* like a break between sections is decoration, and
 * decoration announced as a separator is noise — so an unlabelled one is
 * `aria-hidden`. A divider with a label is different: the label is content, and
 * it names the boundary, so that one is a real `separator` with an accessible
 * name. The catalogue states both halves and it is easy to ship only the first.
 *
 * A vertical divider is not just a rotated one: `role="separator"` carries
 * `aria-orientation`, and a screen reader that says "separator" without it leaves
 * the reader to assume horizontal.
 *
 * The label needs `aria-labelledby` rather than being left as text inside the
 * element. `separator` is not a name-from-content role, so a labelled divider
 * whose label is only a child text node is announced as an unnamed separator —
 * which is exactly the announcement the label existed to replace. Pointing at the
 * visible text rather than duplicating it into `aria-label` keeps the accessible
 * name and the visible one the same string.
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

  /* No label, so nothing to announce: a rule between two sections is a picture of
     a boundary the headings already describe. */
  return (
    <hr
      {...props}
      ref={ref as React.Ref<HTMLHRElement>}
      aria-hidden="true"
      className={cx(styles['divider'], styles[vertical ? 'vertical' : 'horizontal'], className)}
    />
  );
});
