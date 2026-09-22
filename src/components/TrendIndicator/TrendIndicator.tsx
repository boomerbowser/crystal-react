'use client';

/* TrendIndicator — the direction and magnitude of a change.
 *
 * "Direction is carried by a word and a symbol, never by colour alone." Three
 * things follow from that one sentence, and all three are the component rather
 * than a guideline it hopes callers remember:
 *
 *   - `children` is the sentence, and it is required. A `TrendIndicator` with a
 *     direction and no words is a coloured arrow, which is exactly what the rule
 *     forbids.
 *   - The arrow is `aria-hidden`. A reader who hears "up arrow, 4.2% up on last
 *     month" has heard it twice; the glyph is reinforcement for the eye.
 *   - `flat` takes the muted ink rather than a third status colour. "No change"
 *     is not a status, and giving it one would make every unremarkable figure
 *     look like a report.
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import styles from './TrendIndicator.module.scss';

/** Which way it went. `flat` is a real answer, not a missing one. */
export type TrendDirection = 'up' | 'down' | 'flat';

export interface TrendIndicatorProps extends HTMLAttributes<HTMLSpanElement> {
  direction: TrendDirection;
  /** The words. "4.2% up on last month" — the direction, said. */
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
      </span>
    );
  },
);
