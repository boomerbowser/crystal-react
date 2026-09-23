/* Which bucket a value falls in, on Crystal's intensity ramp.
 *
 * The ramp is five steps, each shipped with the ink that reads on it, and the
 * contrast floor is met at every one — `docs/colors.md` sets out the
 * construction. What is decided here is only which step a number lands on, and
 * that is a decision with a trap in it.
 *
 * Equal-width buckets over the range, not quantiles. Quantiles put the same
 * number of cells in each bucket, which makes a pretty picture of any data at
 * all: a week where one day had four times the traffic of the rest looks exactly
 * like a week where every day was the same. The point of a heatmap is the shape
 * of the distribution, and a scale that flattens it is a scale that answers the
 * question before the reader asks it.
 */
import { chartGeometry } from '../theme/chartTokens.js';

export const INTENSITY_STEPS = chartGeometry.intensitySteps;

/**
 * The step, 1 to `INTENSITY_STEPS`, for `value` in `[low, high]`.
 *
 * Zero is its own case rather than the bottom of the ramp: "nothing happened
 * here" and "the least of what happened here" are different facts, and a
 * calendar where an empty day looks like a quiet one is a calendar that cannot
 * be read. It returns 0, and the caller draws the ground.
 */
export function intensityStep(value: number, low: number, high: number): number {
  if (value <= 0) return 0;
  if (high <= low) return INTENSITY_STEPS;
  const t = (value - low) / (high - low);
  return Math.min(INTENSITY_STEPS, Math.max(1, Math.ceil(t * INTENSITY_STEPS)));
}

/** The custom property carrying that step's paint. Step 0 is the plot's ground. */
export function intensityFill(step: number): string {
  return step === 0 ? 'transparent' : `var(--cr-chart-heat-${step})`;
}

/** And the ink that reads on it. */
export function intensityInk(step: number): string {
  return step === 0 ? 'var(--cr-muted)' : `var(--cr-chart-on-heat-${step})`;
}
