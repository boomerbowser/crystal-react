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
 * The mark. The default `spinner` is the arc that grows and shrinks as it turns,
 * as Google's Material loaders do: a fixed sixth of a circle turning (the mark
 * this replaced) reads as short and mechanical, where an arc that lengthens
 * and draws back reads as working. The other shapes, `dots`, `bars`, `pulse`
 * and `infinity`, are for places a ring does not suit, such as inside a line of
 * text or a button. All are drawn in CSS, in the primary ink.
 *
 * Under reduced motion each shape holds still in a legible resting state,
 * dimmed so it reads as busy and not as a measurement, and the words are what
 * carry the meaning. Speed follows the reader's motion-speed setting.
 * "Sizes on the 4px rhythm": the three named sizes are multiples of Prismata's
 * smallest spacing step.
 */
import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { usePrismataTheme } from '../../theme/PrismataProvider.js';
import { prismataTokens } from '../../theme/tokens.generated.js';
import { cx } from '../../styles/cx.js';
import styles from './Loader.module.scss';

export type LoaderSize = 'small' | 'medium' | 'large';

/** The shape of the mark. */
export type LoaderVariant = 'spinner' | 'dots' | 'bars' | 'pulse' | 'infinity';

/* Four, six and ten steps of Prismata's 4px rhythm. The rhythm is the token; the
   multiples are this component choosing three sizes on it. */
const STEP = Number.parseFloat(prismataTokens['spacing.2xs']);
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
  /** The shape of the mark. Defaults to `spinner`. */
  variant?: LoaderVariant;
  /** Keep the words for assistive technology only. They are still announced. */
  hideLabel?: boolean;
}

function Mark({ variant, size, still }: { variant: LoaderVariant; size: number; still: boolean }): ReactNode {
  /* Said on the mark itself, as every continuous indicator says it: resolved
     instantly, not moving, under reduced motion. */
  const state = still ? { 'data-pr-motion-state': 'instant' } : {};
  switch (variant) {
    case 'dots':
      return (
        <span className={styles['dots']} aria-hidden="true" {...state}>
          <span /><span /><span />
        </span>
      );
    case 'bars':
      return (
        <span className={styles['bars']} aria-hidden="true" {...state}>
          <span /><span /><span /><span />
        </span>
      );
    case 'pulse':
      return <span className={styles['pulse']} aria-hidden="true" {...state}><span /></span>;
    case 'infinity':
      return (
        <svg {...state} className={styles['infinity']} viewBox="0 0 48 24" width={size * 2} height={size} aria-hidden="true" focusable="false">
          <path className={styles['infinityTrack']} d="M24 12c-4-5-7-8-11-8a8 8 0 0 0 0 16c4 0 7-3 11-8s7-8 11-8a8 8 0 0 1 0 16c-4 0-7-3-11-8z" pathLength={100} />
          <path className={styles['infinityRun']} d="M24 12c-4-5-7-8-11-8a8 8 0 0 0 0 16c4 0 7-3 11-8s7-8 11-8a8 8 0 0 1 0 16c-4 0-7-3-11-8z" pathLength={100} />
        </svg>
      );
    default:
      return (
        <svg {...state} className={styles['spinner']} viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" focusable="false">
          <circle className={styles['spinnerTrack']} cx="24" cy="24" r="20" />
          <circle className={styles['spinnerArc']} cx="24" cy="24" r="20" />
        </svg>
      );
  }
}

export const Loader = forwardRef<HTMLDivElement, LoaderProps>(function Loader({
  label, size = 'medium', variant = 'spinner', hideLabel = false, className, style, ...props
}, ref): ReactNode {
  const { reduceMotion } = usePrismataTheme();
  return (
    <div
      {...props}
      ref={ref}
      role="status"
      className={cx(styles['loader'], className)}
      data-size={size}
      data-variant={variant}
      data-still={reduceMotion ? '' : undefined}
      style={{ '--loader-size': `${SIZE[size]}px`, ...style } as CSSProperties}
    >
      <Mark variant={variant} size={SIZE[size]} still={reduceMotion} />
      <span className={cx(styles['label'], hideLabel && styles['hidden'])}>{label}</span>
    </div>
  );
});
