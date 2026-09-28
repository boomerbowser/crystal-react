/* DiscountBadge — a reduction, stated completely.
 *
 * "**States what is reduced from what**; a percentage alone is not a claim."
 *
 * That sentence is the whole API. This component will not take `percent={20}`,
 * because a percentage handed in from outside is a number nobody can check: it
 * says twenty per cent off *something*, and the something is the part that makes
 * it either a saving or a marketing noise. So it takes the two amounts and
 * computes the reduction itself, which means the badge cannot disagree with the
 * price beside it.
 *
 * **The pill shows the reduction and the name states the whole thing.** A pill
 * is a few characters wide and "£40, reduced from £50 (20% off)" does not fit in
 * one; but the shorter text is the *same fact more briefly*, not a different
 * fact, so the full statement goes in the accessible name where there is room
 * for it. That is the distinction worth holding on to: `NumberFormatter` refuses
 * a separate spoken form because "1.2M" and `1204893` are two different values,
 * and this adds to a form rather than replacing it — the same pattern as the
 * notification's "Unread." and the gallery's position.
 *
 * **A status accent, and the status is success.** A reduction is a favourable
 * fact about a price, so it takes the success ink over the Haze fill; painting
 * it in the attention colour would tell a reader that something needs their
 * care. There is no perimeter stroke, for the reason `StatusBadge` gives: a
 * coloured ring around a pill is the shape Crystal uses for focus.
 */
import { forwardRef, type HTMLAttributes } from 'react';
import { useNumberFormatter } from 'react-aria';
import { moneyFormat, percentOff, type Money } from '../../commerce/money.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import { cx } from '../../styles/cx.js';
import styles from './DiscountBadge.module.scss';

export interface DiscountBadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** What the price was. */
  from: Money;
  /** What the price is. */
  to: Money;
  /**
   * Which reduction the pill shows. The name states both either way, so this is
   * a question of which one a shopper scans for, not of what is disclosed.
   */
  show?: 'percentage' | 'amount';
  /**
   * The full statement, given the three formatted figures. Default English; the
   * order of "reduced from" is different in other languages and this component
   * has no business assuming one.
   */
  statement?: (parts: { to: string; from: string; percentage: string }) => string;
}

export const DiscountBadge = forwardRef<HTMLSpanElement, DiscountBadgeProps>(
  function DiscountBadge({ from, to, show = 'percentage', statement, className, ...props }, ref) {
    const money = useNumberFormatter(moneyFormat(from));
    const percentage = percentOff(from, to);

    /* Two currencies are not a reduction, and neither is an increase. Rendering
       either as a discount would be the component asserting something it has
       just worked out is false. */
    if (percentage === null || to.amount >= from.amount) return <></>;

    const formatted = {
      to: money.format(to.amount),
      from: money.format(from.amount),
      percentage: `${percentage}%`,
    };
    const brief = show === 'amount'
      ? `${money.format(from.amount - to.amount)} off`
      : `${percentage}% off`;
    const whole = (statement ?? (({ to: now, from: was, percentage: cut }) => (
      `${now}, reduced from ${was}, ${cut} off`
    )))(formatted);

    return (
      <span {...props} ref={ref} className={cx(styles['discount'], 'cr-haze', className)}>
        <span aria-hidden="true">{brief}</span>
        <VisuallyHidden>{whole}</VisuallyHidden>
      </span>
    );
  },
);
