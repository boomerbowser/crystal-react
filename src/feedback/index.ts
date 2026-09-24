/* The feedback slice's shared vocabulary.
 *
 * Exported for the same reason the commerce slice's is: `FeedbackStatus` is a
 * *public prop type* — `Alert`, `Banner` and `StatusBadge` all take one — and a
 * product that cannot name the type of a prop it must pass has to retype the
 * union and keep the copy in step. It was not exported until slice N, when the
 * same question came up about `Availability` and the asymmetry was the answer.
 *
 * The glyph and wording maps come with it deliberately. A product building
 * something status-bearing that Crystal has no component for should reach for
 * Crystal's own symbols rather than pick four of its own — which is
 * `extend-crystal-not-the-library` applied to a consumer rather than to us.
 */
export { STATUS_LABEL, STATUS_RECIPE, STATUS_SYMBOL } from './status.js';
export type { FeedbackStatus } from './status.js';
