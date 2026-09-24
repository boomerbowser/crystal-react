'use client';

/* CartSummary — subtotal, discounts, shipping, tax and total.
 *
 * "**A description list, so each line is a labelled pair**; the total is marked
 * as such."
 *
 * The markup is the requirement. A basket summary built from rows of two spans
 * is, to anything that is not a pair of eyes, a stream of words and numbers in
 * which "Shipping" and "£3.99" are two unrelated pieces of text that happen to
 * be adjacent — and a reader moving through it hears seven labels and seven
 * amounts with nothing joining them. A `<dl>` says which amount belongs to which
 * line, for free, and it is the one structure in HTML that means exactly this.
 *
 * **The total is marked as such**, and not merely drawn larger. Size and weight
 * are what a sighted reader uses to find the number that matters; the rest need
 * the word, so the total's term is emphasised in the markup rather than only in
 * the stylesheet.
 *
 * **"Updating" is a state, not a spinner over the top.** A basket total that is
 * being recalculated is still a number, and replacing it with a spinner takes
 * away the only thing the reader had. So the figures stay, the region says it is
 * updating, and the announcement is polite: a total settling is not an
 * interruption.
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { Price } from '../Price/Price.js';
import { cx } from '../../styles/cx.js';
import type { Money } from '../../commerce/money.js';
import styles from './CartSummary.module.scss';

export interface SummaryLine {
  id: string;
  label: ReactNode;
  /** The amount. A discount is negative, and reads as one. */
  amount: Money;
  /** A note under the label — "Estimated", "Standard delivery". */
  note?: ReactNode;
}

export interface CartSummaryProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  lines: readonly SummaryLine[];
  /** The one that matters. Marked as the total, not merely drawn larger. */
  total: Money;
  totalLabel?: ReactNode;
  /** Being recalculated. The figures stay; the state is announced. */
  isUpdating?: boolean;
  updatingLabel?: string;
  /** Shown instead of the lines when there is nothing in the basket. */
  empty?: ReactNode;
  label?: string;
}

export const CartSummary = forwardRef<HTMLElement, CartSummaryProps>(
  function CartSummary({
    lines, total, totalLabel = 'Total', isUpdating = false,
    updatingLabel = 'Updating the total', empty, label = 'Order summary',
    className, ...props
  }, ref) {
    const isEmpty = lines.length === 0 && empty !== undefined;

    return (
      <section
        {...props}
        ref={ref}
        aria-label={label}
        {...(isUpdating ? { 'data-updating': '' } : {})}
        className={cx(styles['summary'], className)}
      >
        {isEmpty ? (
          <p className={styles['empty']}>{empty}</p>
        ) : (
          <dl className={styles['lines']}>
            {lines.map((line) => (
              /* Each pair in its own `div`, which is what lets a line be a row
                 without breaking the association a `dl` exists to carry. */
              <div key={line.id} className={styles['line']}>
                <dt className={styles['term']}>
                  {line.label}
                  {line.note ? <span className={styles['note']}>{line.note}</span> : null}
                </dt>
                <dd className={styles['amount']}>
                  <Price value={line.amount} as="span" />
                </dd>
              </div>
            ))}

            <div className={styles['line']} data-total="">
              <dt className={styles['term']}><strong>{totalLabel}</strong></dt>
              <dd className={styles['amount']}>
                <Price value={total} as="span" />
              </dd>
            </div>
          </dl>
        )}

        {/* Polite, and always rendered: a live region that arrives with its text
            already in it announces nothing. */}
        <span role="status" className={styles['announcement']}>
          {isUpdating ? updatingLabel : ''}
        </span>
      </section>
    );
  },
);
