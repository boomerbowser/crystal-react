'use client';

/* Plays one recipe as an overlay leaves, and holds it on screen until it has.
 *
 * React Aria unmounts an overlay when it closes. The catalogue's exits
 * (`menu-out`, `popover-out`, `tooltip-out`, `drawer-out`) use React Aria's own
 * exit handling: when an overlay closes, React Aria marks it exiting and, in a
 * layout effect, asks the element for its running animations
 * (`getAnimations()`), keeping it mounted until they finish.
 *
 * Motion starts its animation on the next frame, not synchronously, so React
 * Aria would find nothing running and unmount at once (measured: the select's
 * list was gone in the same frame). This component registers the hold itself:
 * an animation with no keyframes, lasting exactly the recipe's resolved
 * duration, started in a layout effect that runs before React Aria's (a child's
 * layout effect runs before its parent's). React Aria waits on it, and Motion
 * plays the movement alongside it.
 *
 * `isExiting` is React Aria's render prop, and `scope` must be the element React
 * Aria is waiting on, which is the overlay itself. Under reduced motion nothing
 * is held and nothing plays, so the overlay closes at once with no movement.
 */
import { useLayoutEffect, useRef, type RefObject } from 'react';
import { useCrystalTheme } from '../theme/CrystalProvider.js';
import { getRecipe } from './useMotion.js';

export function Departure({ isExiting, play, recipe, scope, hold }: {
  isExiting: boolean;
  play: (name: string) => Promise<void>;
  recipe: string;
  scope: RefObject<unknown>;
  /**
   * The element React Aria is waiting on, when it is not the one that moves.
   * For example, a disclosure's panel, whose content plays the exit. Defaults to
   * `scope`.
   */
  hold?: () => HTMLElement | null;
}): null {
  const { resolveDuration, reduceMotion } = useCrystalTheme();
  /* Only a change into exiting is a departure. A disclosure that renders closed
     is not leaving. `null` until the first pass has been seen. */
  const was = useRef<boolean | null>(null);
  useLayoutEffect(() => {
    const before = was.current;
    was.current = isExiting;
    if (!isExiting || before !== false) return;
    const element = hold ? hold() : scope.current as HTMLElement | null;
    const authored = getRecipe(recipe);
    const duration = reduceMotion || !authored ? 0 : resolveDuration(authored.duration);
    /* Where there is no Web Animations API (jsdom), React Aria does not wait
       either, so there is nothing to hold. */
    if (element && duration > 0 && typeof element.animate === 'function') element.animate([], { duration });
    void play(recipe);
  }, [isExiting, play, recipe, scope, hold, reduceMotion, resolveDuration]);
  return null;
}
