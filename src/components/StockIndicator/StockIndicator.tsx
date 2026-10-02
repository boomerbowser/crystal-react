/* StockIndicator. Availability, in words.
 *
 * "Words carry the state; status colour reinforces it." That is
 * `StatusBadge`'s contract, so this is a `StatusBadge` with the availability
 * vocabulary in front of it rather than a second badge that draws the same well
 * slightly differently.
 *
 * The mapping from availability to status is in `commerce/availability.ts`,
 * shared with the variant selector's unavailable options. Backorder is `info`
 * rather than `attention`, because the item can be bought and arrives later.
 * The attention colour would report a problem where there is an ordinary
 * outcome.
 *
 * The wording is overridable and the default is a fallback. The catalogue puts
 * "thresholds and wording" on the product, because "Only 2 left" is a
 * merchandising decision. The library ensures that whatever words arrive are
 * what a reader is told, rather than a colour they have to interpret.
 */
import { forwardRef, type ReactNode } from 'react';
import { StatusBadge, type StatusBadgeProps } from '../StatusBadge/StatusBadge.js';
import { AVAILABILITY_LABEL, AVAILABILITY_STATUS, type Availability } from '../../commerce/availability.js';

export interface StockIndicatorProps extends Omit<StatusBadgeProps, 'status' | 'children'> {
  availability: Availability;
  /** The words. Defaults to Crystal React's fallback wording for the state. */
  children?: ReactNode;
}

export const StockIndicator = forwardRef<HTMLSpanElement, StockIndicatorProps>(
  function StockIndicator({ availability, children, ...props }, ref) {
    return (
      <StatusBadge {...props} ref={ref} status={AVAILABILITY_STATUS[availability]}>
        {children ?? AVAILABILITY_LABEL[availability]}
      </StatusBadge>
    );
  },
);
