/* DiscountBadge: a reduction, stated completely.
 *
 * "**States what is reduced from what**; a percentage alone is not a claim."
 *
 * The API follows from that. The component does not take `percent={20}`,
 * because nobody can check a percentage handed in from outside. It says twenty
 * per cent off something, and that something decides whether it is a saving or
 * marketing noise. So the component takes the two amounts and computes the
 * reduction itself, and the badge cannot disagree with the price beside it.
 *
 * The pill shows the reduction and the accessible name states the whole thing. A
 * pill is a few characters wide, and "£40, reduced from £50 (20% off)" does not
 * fit in one. The shorter text is the same fact stated briefly, so the full
 * statement goes in the accessible name, where there is room. `NumberFormatter`
 * refuses a separate spoken form because "1.2M" and `1204893` are two different
 * values. This component adds to the visible form and does not replace it, the
 * same pattern as the notification's "Unread." and the gallery's position.
 *
 * The status accent is success. A reduction is a favourable fact about a price,
 * so it takes the success ink over the Haze fill. The attention colour would
 * tell a reader that something needs their care. There is no perimeter stroke,
 * for the reason `StatusBadge` gives: a coloured ring around a pill is the shape
 * Crystal uses for focus.
 */
import { forwardRef, useMemo, type HTMLAttributes } from 'react';
import { useNumberFormatter } from 'react-aria';
import { moneyFormat, percentOff, type Money } from '../../commerce/money.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import { cx } from '../../styles/cx.js';
import { mergeRefs } from '../../utils/mergeRefs.js';
import { useChangeMotion } from '../../motion/useChangeMotion.js';
import styles from './DiscountBadge.module.scss';

export interface DiscountBadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** What the price was. */
  from: Money;
  /** What the price is. */
  to: Money;
  /**
   * Which reduction the pill shows. The name states both either way, so this
   * only changes which figure a shopper scans for.
   */
  show?: 'percentage' | 'amount';
  /**
   * The full statement, given the three formatted figures. Default English.
   * The order of "reduced from" differs in other languages, so the component
   * does not assume one.
   */
  statement?: (parts: { to: string; from: string; percentage: string }) => string;
}

export const DiscountBadge = forwardRef<HTMLSpanElement, DiscountBadgeProps>(
  function DiscountBadge({ from, to, show = 'percentage', statement, className, ...props }, ref) {
    const money = useNumberFormatter(moneyFormat(from));
    const percentage = percentOff(from, to);
    /* `attention` when the reduction changes while it is shown, such as a price
       cut again. Never on the render that first shows it. */
    const cue = useChangeMotion(percentage, (was, is) => (was !== null && is !== null ? 'attention' : null));
    const merged = useMemo(() => mergeRefs(ref, cue as never), [ref, cue]);

    /* Two currencies are not a reduction, and neither is an increase. The
       component has just worked out that neither is a discount, so it renders
       nothing. */
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
      <span {...props} ref={merged as never} className={cx(styles['discount'], 'cr-haze', className)}>
        <span aria-hidden="true">{brief}</span>
        <VisuallyHidden>{whole}</VisuallyHidden>
      </span>
    );
  },
);
