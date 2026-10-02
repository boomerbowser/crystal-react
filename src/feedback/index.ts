/* The feedback slice's shared vocabulary.
 *
 * Exported for the same reason as the commerce slice's: `FeedbackStatus` is a
 * public prop type (`Alert`, `Banner` and `StatusBadge` all take one), and a
 * product that cannot name the type of a prop it must pass has to retype the
 * union and keep the copy in step. It has been exported since slice N, when
 * `Availability` raised the same question.
 *
 * The glyph and wording maps are exported with it, because a product building
 * something status-bearing that Crystal has no component for should use
 * Crystal's own symbols instead of picking four of its own. That is
 * `extend-crystal-not-the-library` applied to a consumer.
 */
export { STATUS_LABEL, STATUS_RECIPE, STATUS_SYMBOL } from './status.js';
export type { FeedbackStatus } from './status.js';
