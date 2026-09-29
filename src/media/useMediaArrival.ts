'use client';

/* Crystal's `media-in`: "after an image decodes or media becomes ready".
 *
 * Bound to the media element's own `loadeddata` — the first frame is available —
 * rather than to mounting, because a player mounts long before it has anything
 * to show, and the recipe is for the picture arriving, not for the box that will
 * hold it. Once per source: a new `src` is a new arrival, buffering again is
 * not. The recipe plays on whatever the returned scope is put on — the video
 * itself, or an audio player's surface, since audio has nothing to see.
 */
import { useEffect, useRef, type RefObject } from 'react';
import { useMotion } from '../motion/useMotion.js';

export function useMediaArrival(media: RefObject<HTMLMediaElement | null>): ReturnType<typeof useMotion>[0] {
  const [scope, play] = useMotion();
  const arrived = useRef<string | null>(null);
  useEffect(() => {
    const element = media.current;
    if (!element) return undefined;
    const ready = (): void => {
      const source = element.currentSrc || element.src;
      if (arrived.current === source) return;
      arrived.current = source;
      void play('media-in');
    };
    /* Already showing its first frame when this attached — cached, or loaded
       with the page — is media that was there, not media arriving. */
    if (element.readyState >= 2) arrived.current = element.currentSrc || element.src;
    element.addEventListener('loadeddata', ready);
    return () => { element.removeEventListener('loadeddata', ready); };
  }, [media, play]);
  return scope;
}
