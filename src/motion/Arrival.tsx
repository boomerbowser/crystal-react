'use client';

/* Plays one recipe on the mount that is an arrival.
 *
 * A transient overlay — a menu, a popover, a tooltip — mounts when it opens and
 * unmounts when it closes, so its mount *is* the moment the catalogue's `menu-in`
 * or `popover-in` marks. That is the one case where playing on mount is not
 * ambient motion: nothing was at rest, because nothing was there.
 *
 * A component rather than an effect in the parent because the overlay's element
 * is rendered by React Aria inside a render tree the parent does not own, and
 * the guard has to live with the element it guards. `Drawer` carries the same
 * shape locally as `Sweep`.
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
