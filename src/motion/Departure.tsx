'use client';

/* Plays one recipe as an overlay leaves, and holds it on screen until it has.
 *
 * React Aria unmounts an overlay when it closes, which is why the exits the
 * catalogue assigns — `menu-out`, `popover-out`, `tooltip-out`, `drawer-out` —
 * were recorded as needing a structure this library did not have. It has one:
 * React Aria's own exit handling. When an overlay closes, React Aria marks it
 * exiting and, in a layout effect, asks the element for its running animations
 * (`getAnimations()`), keeping it mounted until they finish.
 *
 * Motion starts its animation on the next frame, not synchronously, so by the
 * time React Aria looks it would find nothing and unmount at once — measured:
 * the select's list was gone in the same frame. So this registers the hold
 * itself: an animation with no keyframes, lasting exactly the recipe's resolved
 * duration, started in a layout effect that runs before React Aria's (a child's
 * layout effect runs before its parent's). React Aria waits on it; Motion plays
 * the movement alongside it.
 *
 * `isExiting` is React Aria's render prop, and `scope` must be the element React
 * Aria is waiting on — the overlay itself. Under reduced motion nothing is held
 * and nothing plays, so the overlay goes at once: the state change without the
 * movement.
 */
import { useLayoutEffect, type RefObject } from 'react';
import { useCrystalTheme } from '../theme/CrystalProvider.js';
import { getRecipe } from './useMotion.js';

export function Departure({ isExiting, play, recipe, scope }: {
  isExiting: boolean;
  play: (name: string) => Promise<void>;
  recipe: string;
  scope: RefObject<unknown>;
}): null {
  const { resolveDuration, reduceMotion } = useCrystalTheme();
  useLayoutEffect(() => {
    if (!isExiting) return;
    const element = scope.current as HTMLElement | null;
    const authored = getRecipe(recipe);
    const duration = reduceMotion || !authored ? 0 : resolveDuration(authored.duration);
    /* Where there is no Web Animations API — jsdom — React Aria does not wait
       either, so there is nothing to hold. */
    if (element && duration > 0 && typeof element.animate === 'function') element.animate([], { duration });
    void play(recipe);
  }, [isExiting, play, recipe, scope, reduceMotion, resolveDuration]);
  return null;
}
