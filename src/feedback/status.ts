/* The four semantic statuses, and the vocabulary Crystal publishes for each.
 *
 * Five components in the feedback slice draw the same thing, a symbol in a
 * tinted well beside words that carry the meaning. Each would otherwise repeat
 * the same four-line map of glyphs. There is one copy, because the glyphs are
 * Crystal's and a second transcription can fall out of step.
 *
 * Status colours are independent of the brand palettes and are never redefined
 * by them, so the inks are read as `--cr-success-ink` and its siblings, never
 * as anything palette-scoped.
 *
 * The light and dark rows carry the same glyphs, because a symbol is not a
 * colour. One row is read, so the mode does not have to be threaded through
 * components that have no other use for it. `verify-theme` compares the
 * exported pairs, so a divergence would surface there.
 */
import { crystalTokens } from '../theme/tokens.generated.js';

export type FeedbackStatus = 'success' | 'attention' | 'danger' | 'info';

/** Crystal's own glyph per status. Always `aria-hidden`: the words say it. */
export const STATUS_SYMBOL: Record<FeedbackStatus, string> = {
  success: crystalTokens['feedback.light.success.symbol'],
  attention: crystalTokens['feedback.light.attention.symbol'],
  danger: crystalTokens['feedback.light.danger.symbol'],
  info: crystalTokens['feedback.light.info.symbol'],
};

/** Crystal's own wording per status, for a component with nothing better. It is
 *  a fallback and never a substitute for a message somebody wrote. */
export const STATUS_LABEL: Record<FeedbackStatus, string> = {
  success: crystalTokens['feedback.light.success.label'],
  attention: crystalTokens['feedback.light.attention.label'],
  danger: crystalTokens['feedback.light.danger.label'],
  info: crystalTokens['feedback.light.info.label'],
};

/** The motion Crystal assigns to a status arriving. Only two of the four have
 *  one, and a component that invented recipes for the other two would be
 *  authoring motion in a consumer. */
export const STATUS_RECIPE: Partial<Record<FeedbackStatus, string>> = {
  success: 'success',
  attention: 'attention',
};
