'use client';

/* Plays an exit recipe inside Motion's `AnimatePresence`, and lets the element go
 * only once it has played.
 *
 * `Departure` is the same idea for React Aria's own overlay lifecycle; this is
 * for the surfaces this library already mounts inside `AnimatePresence` — a
 * drawer, whose scrim fades out there — where Motion rather than React Aria
 * decides when the element is removed. Motion waits for every descendant that
 * registered with `usePresence`, so the panel's exit and the scrim's wash end
 * together. Outside `AnimatePresence` it does nothing.
 */
import { useEffect } from 'react';
import { usePresence } from 'motion/react';

export function PresenceExit({ play, recipe }: {
  play: (name: string) => Promise<void>;
  recipe: string;
}): null {
  const [isPresent, safeToRemove] = usePresence();
  useEffect(() => {
    if (isPresent || !safeToRemove) return;
    void play(recipe).finally(safeToRemove);
  }, [isPresent, safeToRemove, play, recipe]);
  return null;
}
