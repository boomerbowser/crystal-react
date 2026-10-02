'use client';

/* Loader. A compact indeterminate activity mark.
 *
 * "**Accompanied by text saying what is loading.**" So the text is a required
 * prop. A bare spinner tells a sighted reader that something is happening and
 * tells everyone else nothing at all. Even for the sighted reader, "something
 * is happening" is rarely the question. The question is "is this stuck, and on
 * what".
 *
 * `role="status"` rather than `role="progressbar"`: there is no range and no
 * position, and a progressbar without either has to be explained. A polite live
 * region says what is loading when it appears and does not interrupt.
 *
 * The mark is `ActivityArc`, which is also the indeterminate `RingProgress`.
 * Using one object means a loader and a ring progress cannot end up two sizes
 * of the same idea. "Sizes on the 4px rhythm": the three named sizes are
 * multiples of Crystal's smallest spacing step.
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { ActivityArc } from '../../feedback/ActivityArc.js';
import { crystalTokens } from '../../theme/tokens.generated.js';
import { cx } from '../../styles/cx.js';
import styles from './Loader.module.scss';

export type LoaderSize = 'small' | 'medium' | 'large';

/* Four, six and ten steps of Crystal's 4px rhythm. The rhythm is the token; the
   multiples are this component choosing three sizes on it. */
const STEP = Number.parseFloat(crystalTokens['spacing.2xs']);
const SIZE: Record<LoaderSize, number> = {
  small: STEP * 4,
  medium: STEP * 6,
  large: STEP * 10,
};

export interface LoaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** What is loading. Required. A mark with no words says nothing to anyone
   *  who cannot see it, and little to anyone who can. */
  label: ReactNode;
  size?: LoaderSize;
  /** Keep the words for assistive technology only. They are still announced. */
  hideLabel?: boolean;
}

export const Loader = forwardRef<HTMLDivElement, LoaderProps>(function Loader({
  label, size = 'medium', hideLabel = false, className, ...props
}, ref): ReactNode {
  return (
    <div
      {...props}
      ref={ref}
      role="status"
      className={cx(styles['loader'], className)}
      data-size={size}
    >
      <ActivityArc size={SIZE[size]} />
      <span className={cx(styles['label'], hideLabel && styles['hidden'])}>{label}</span>
    </div>
  );
});
