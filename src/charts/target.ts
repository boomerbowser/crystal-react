/* The hit area every drawn mark carries, whatever size it is drawn at.
 *
 * Crystal's action minimum is a promise about what a person has to hit, and a
 * mark on the smallest step of the point scale is six pixels across. The two
 * numbers are unrelated on purpose: the drawn size says how much the datum is,
 * and the target says how hard it is to press. Deriving the target from the
 * drawn size — the obvious thing, and what this did first — makes the smallest
 * data points the hardest to reach, which is backwards.
 */
import { crystalTokens } from '../theme/tokens.generated.js';

/** Crystal's `action.minTarget`, as a number of pixels. */
export const MARK_TARGET = Number.parseFloat(crystalTokens['action.minTarget']);
