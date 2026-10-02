'use client';

/* Plays an exit recipe inside Motion's `AnimatePresence`, and lets the element go
 * only once it has played.
 *
 * `Departure` does the same for React Aria's overlay lifecycle. This component
 * is for surfaces this library mounts inside `AnimatePresence`, such as a
 * drawer, whose scrim fades out there. For those, Motion decides when the
 * element is removed. Motion waits for every descendant that registered with
 * `usePresence`, so the panel's exit and the scrim's wash end together. Outside
 * `AnimatePresence` it does nothing.
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
