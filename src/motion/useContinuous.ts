'use client';

/* useContinuous: a continuous recipe bound to a pending state.
 *
 * Crystal 2.2.0 publishes three recipes that repeat (`activity-turn`,
 * `activity-travel`, `skeleton-sweep`). Unlike ambient motion, they run while
 * work is genuinely pending and stop when it resolves (D-19), and this hook
 * implements that rule. `pending` true plays the recipe. `pending` false, or
 * unmounting, stops it. There is no third state and no way to start one at rest.
 *
 * Direction follows the theme. `activity-travel` and `skeleton-sweep` are authored
 * left to right, and a right-to-left page reads a travelling segment the other
 * way, so the recipe is mirrored instead of a second one being authored.
 *
 * Reduced motion comes from the provider, which includes the operating system's
 * setting. `useMotion` then marks the element `data-cr-motion-state="instant"`
 * and plays nothing, and the component's stylesheet keys its static fallback on
 * that: the whole track or fill, never a segment frozen part of the way along.
 */
import { useEffect } from 'react';
import { useMotion } from './useMotion.js';
import { useCrystalTheme } from '../theme/CrystalProvider.js';

export type ContinuousRecipe = 'activity-turn' | 'activity-travel' | 'skeleton-sweep';

export function useContinuous(name: ContinuousRecipe, pending: boolean): ReturnType<typeof useMotion>[0] {
  const { direction } = useCrystalTheme();
  const [scope, play, stop] = useMotion({ reorient: { mirrorInline: direction === 'rtl' } });

  useEffect(() => {
    if (!pending) { stop(); return undefined; }
    void play(name);
    return () => { stop(); };
  }, [pending, name, play, stop]);

  return scope;
}
