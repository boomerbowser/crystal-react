'use client';

/* useMarkArrival: Crystal's `mark-in`, played on a chart's marks once, when the
 * chart first appears.
 *
 * R-21, ruled on 28 September 2026. A bar, a series or a segment grows from its
 * baseline when the chart arrives, and not when its data later changes: a value
 * that moved is a change the reader should see as the new value, not as the
 * chart being drawn again. `mark-in` is critically damped (a mark that
 * overshoots its value has, for part of a second, shown a number that is not
 * true) and staggers by index up to its ceiling, past which every mark arrives
 * together.
 *
 * Attach the returned scope to the group that holds the marks, and give each
 * mark `data-mark-in` with its baseline as `transform-origin`. The marks are
 * found when they first exist, which for a chart is after its frame has been
 * measured, not on the first render; that render has no marks and nothing plays.
 *
 * A mark waiting for its turn is not drawn at its full value first and then
 * collapsed. That flash would be the false number again. Motion runs the
 * arrival as a native animation with `fill: both`, which holds a delayed mark
 * at the first frame until its turn. A second, hand-written park is
 * unnecessary and has been removed. The layout effect is so the first frame
 * is applied before the browser paints the marks at all.
 */
import { useLayoutEffect, useRef } from 'react';
import { useAnimate } from 'motion/react';
import { getRecipe, toMotionKeyframes, transitionFor } from '../motion/useMotion.js';
import { useCrystalTheme } from '../theme/CrystalProvider.js';

export function useMarkArrival(): ReturnType<typeof useAnimate>[0] {
  const [scope, animate] = useAnimate();
  const { resolveDuration, reduceMotion } = useCrystalTheme();
  const arrived = useRef(false);

  useLayoutEffect(() => {
    if (arrived.current) return;
    const root = scope.current as Element | null;
    if (!root) return;
    const marks = [...root.querySelectorAll<SVGElement | HTMLElement>('[data-mark-in]')];
    if (marks.length === 0) return;
    arrived.current = true;

    const recipe = getRecipe('mark-in');
    const duration = recipe ? resolveDuration(recipe.duration) : 0;
    if (!recipe || reduceMotion || duration === 0) return;

    const { values, times, frameCount } = toMotionKeyframes(recipe);
    const staggered = recipe.stagger !== undefined && marks.length <= recipe.stagger.maxMarks;
    marks.forEach((mark, index) => {
      const delay = staggered && recipe.stagger ? resolveDuration(index * recipe.stagger.step) : 0;
      void animate(mark, values, transitionFor(recipe, duration, delay, frameCount, times));
    });
  });

  return scope;
}
