'use client';

/* One media query, as React state.
 *
 * This uses `useSyncExternalStore`, because the value has a server snapshot and
 * a subscription, which is the shape that hook exists for. `useEffect` plus
 * state renders the wrong answer first and corrects it, which on a theme query
 * is a flash of the wrong theme on every load and on a layout query is the pane
 * arrangement jumping once per navigation.
 *
 * It lives in its own module because three things read media queries: the
 * preferred scheme, reduced transparency, and `MasterDetail`'s layout
 * breakpoint. Sharing one subscription keeps its cleanup in one place.
 */
import { useCallback, useSyncExternalStore } from 'react';

export function useMediaQuery(query: string, serverValue: boolean): boolean {
  const subscribe = useCallback((notify: () => void) => {
    if (typeof window === 'undefined' || !window.matchMedia) return () => undefined;
    const list = window.matchMedia(query);
    list.addEventListener('change', notify);
    return () => list.removeEventListener('change', notify);
  }, [query]);

  return useSyncExternalStore(
    subscribe,
    () => (typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia(query).matches
      : serverValue),
    /* The server cannot know, so it renders Crystal's default and the first
       client render agrees with it. Guessing differently is a hydration
       mismatch. */
    () => serverValue,
  );
}
