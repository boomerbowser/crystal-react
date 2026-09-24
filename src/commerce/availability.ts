/* Availability, and which of Crystal's four statuses each state is.
 *
 * The catalogue gives the stock indicator four states — `in-stock`, `low`,
 * `out-of-stock`, `backorder` — and says "words carry the state; status colour
 * reinforces it". Two components need the mapping (the indicator itself and the
 * variant selector's unavailable options), so it is written once.
 *
 * **Backorder is `info`, not `attention`.** It is not a warning: the item can be
 * bought, it simply arrives later, and painting it in the attention colour would
 * tell a reader something is wrong with an ordinary outcome. `low` *is* a
 * warning, because it is the state where waiting has a cost.
 *
 * The words are defaults, not Crystal's. The catalogue puts "thresholds and
 * wording" on the product, and rightly — "Only 2 left" is a merchandising
 * decision, not a design-system one. They are here so that a component has
 * something to say rather than nothing, in the same way `STATUS_LABEL` is.
 */
import type { FeedbackStatus } from '../feedback/status.js';

export type Availability = 'in-stock' | 'low' | 'out-of-stock' | 'backorder';

export const AVAILABILITY_STATUS: Record<Availability, FeedbackStatus> = {
  'in-stock': 'success',
  low: 'attention',
  'out-of-stock': 'danger',
  backorder: 'info',
};

/** A fallback wording, never a substitute for one the product wrote. */
export const AVAILABILITY_LABEL: Record<Availability, string> = {
  'in-stock': 'In stock',
  low: 'Low stock',
  'out-of-stock': 'Out of stock',
  backorder: 'On backorder',
};
