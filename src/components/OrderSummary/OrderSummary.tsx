'use client';

/* OrderSummary: an order that has already been placed.
 *
 * "Status is a word; the status colour reinforces it."
 *
 * That is `StatusBadge`'s contract, so the status is a `StatusBadge`, the same
 * badge every other part of this library uses, and no fifth drawing of a
 * coloured well. The four order states map onto Crystal's four semantic
 * statuses, and the mapping is the one judgement this component makes:
 *
 *   - `pending` is info. Waiting is the ordinary outcome of placing an order,
 *     not a warning about it.
 *   - `shipped` is success. It is the thing the reader wanted.
 *   - `delivered` is success as well, because both are good outcomes and a
 *     fifth colour for "even better" would be a distinction with no meaning.
 *   - `cancelled` is danger, which needs a second look, because an order the
 *     reader cancelled themselves is not a problem. The status colour only
 *     reinforces, and the word is what is read, so "Cancelled" in the danger
 *     ink says what happened. A neutral cancelled order in a list of live ones
 *     would mislead more.
 *
 * The wording is the product's, as everywhere else in this slice: an order model
 * with six states or another language's words passes its own.
 *
 * The totals are `CartSummary`, because "with items and totals" is the same
 * description list under a different heading. A second description list would
 * be a second copy of the total's markup to keep correct.
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { StatusBadge } from '../StatusBadge/StatusBadge.js';
import { cx } from '../../styles/cx.js';
import type { FeedbackStatus } from '../../feedback/status.js';
import styles from './OrderSummary.module.scss';

export type OrderState = 'pending' | 'shipped' | 'delivered' | 'cancelled';

export const ORDER_STATUS: Record<OrderState, FeedbackStatus> = {
  pending: 'info',
  shipped: 'success',
  delivered: 'success',
  cancelled: 'danger',
};

/** A fallback wording, never a substitute for one the product wrote. */
export const ORDER_LABEL: Record<OrderState, string> = {
  pending: 'Pending',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export interface OrderSummaryProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** How the order is referred to. "Order 4821". */
  reference: ReactNode;
  /** Said, where a `ReactNode` cannot be. */
  referenceText: string;
  state: OrderState;
  /** The status in words. Defaults to Crystal React's fallback wording. */
  stateLabel?: ReactNode;
  /** When it was placed, already formatted. */
  placed?: ReactNode;
  /** The lines and the totals, usually a `CartSummary`. */
  children?: ReactNode;
  /** Actions on the order: track it, return it, buy it again. */
  actions?: ReactNode;
}

export const OrderSummary = forwardRef<HTMLElement, OrderSummaryProps>(
  function OrderSummary({
    reference, referenceText, state, stateLabel, placed, children, actions,
    className, ...props
  }, ref) {
    return (
      <article
        {...props}
        ref={ref}
        aria-label={referenceText}
        data-state={state}
        className={cx(styles['order'], className)}
      >
        <header className={styles['header']}>
          <div className={styles['who']}>
            <p className={styles['reference']}>{reference}</p>
            {placed ? <p className={styles['placed']}>{placed}</p> : null}
          </div>
          <StatusBadge status={ORDER_STATUS[state]}>
            {stateLabel ?? ORDER_LABEL[state]}
          </StatusBadge>
        </header>

        {children}

        {actions ? <div className={styles['actions']}>{actions}</div> : null}
      </article>
    );
  },
);
