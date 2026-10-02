'use client';

/* Crystal's `media-in`: "after an image decodes or media becomes ready".
 *
 * Bound to the media element's `loadeddata` event (the first frame is
 * available), because a player mounts long before it has anything to show and
 * the recipe is for the picture arriving. It plays once per source: a new `src`
 * is a new arrival, and buffering again is not. The recipe plays on whatever
 * element the returned scope is attached to. That is the video itself, or an
 * audio player's surface, since audio has nothing to see.
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
    /* Media already showing its first frame when this attaches (cached, or
       loaded with the page) was already there and does not animate in. */
    if (element.readyState >= 2) arrived.current = element.currentSrc || element.src;
    element.addEventListener('loadeddata', ready);
    return () => { element.removeEventListener('loadeddata', ready); };
  }, [media, play]);
  return scope;
}
