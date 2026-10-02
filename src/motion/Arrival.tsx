'use client';

/* Plays one recipe on a mount that is an arrival.
 *
 * A transient overlay (a menu, a popover, a tooltip) mounts when it opens and
 * unmounts when it closes, so its mount is the moment the catalogue's `menu-in`
 * or `popover-in` describes. This is the one case where playing on mount is not
 * ambient motion, because nothing was on screen before.
 *
 * It is a component and not an effect in the parent because React Aria renders
 * the overlay's element inside a tree the parent does not own, and the guard
 * has to live with the element it guards. `Drawer` has the same structure
 * locally, as `Sweep`.
 */
import { useEffect, useRef } from 'react';

export function Arrival({ play, recipe }: {
  play: (name: string) => Promise<void>;
  recipe: string;
}): null {
  const played = useRef(false);
  useEffect(() => {
    if (played.current) return;
    played.current = true;
    void play(recipe);
  }, [play, recipe]);
  return null;
}
