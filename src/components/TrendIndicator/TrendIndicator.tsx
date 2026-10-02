'use client';

/* TrendIndicator shows the direction and magnitude of a change.
 *
 * "Direction is carried by a word and a symbol, never by colour alone." The
 * component enforces three consequences of that rule:
 *
 *   - `children` is the sentence, and it is required. A direction with no words
 *     is a coloured arrow, which the rule forbids.
 *   - The arrow is `aria-hidden`. A reader who hears "up arrow, 4.2% up on last
 *     month" hears the direction twice. The glyph is for the eye.
 *   - `flat` takes the muted ink instead of a third status colour. "No change"
 *     is not a status, and a status colour would make every unremarkable figure
 *     look like a report.
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import { ChangeHighlight } from '../../feedback/ChangeHighlight.js';
import styles from './TrendIndicator.module.scss';

/** Which way it went. `flat` means no change; it does not mean a missing value. */
export type TrendDirection = 'up' | 'down' | 'flat';

export interface TrendIndicatorProps extends HTMLAttributes<HTMLSpanElement> {
  direction: TrendDirection;
  /** The direction in words, such as "4.2% up on last month". */
  children: ReactNode;
}

const ARROW: Record<TrendDirection, string> = { up: '↑', down: '↓', flat: '→' };

export const TrendIndicator = forwardRef<HTMLSpanElement, TrendIndicatorProps>(
  function TrendIndicator({ direction, children, className, ...props }, ref) {
    return (
      <span
        {...props}
        ref={ref}
        data-direction={direction}
        className={cx(styles['trend'], className)}
      >
        <span aria-hidden="true" className={styles['arrow']}>{ARROW[direction]}</span>
        {children}
        <ChangeHighlight />
      </span>
    );
  },
);
