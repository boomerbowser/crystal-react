'use client';

/* Whether the view has been scrolled away from its top.
 *
 * Two components need this and they need the same answer: `AppBar` shows
 * elevation once something has scrolled under it, and `PageHeader` condenses on
 * the same signal. Asking the window is wrong in both of them whenever there is
 * a surrounding `AppShell` — the bar and the header never move, the content
 * region scrolls beneath them, so the window's scroll position stays zero
 * forever and the state never arrives.
 *
 * It lives here, beside the context it reads, for the reason the scroll tab stop
 * does: two copies of one rule drift the first time one of them is touched, and
 * a drift in this one is a header that condenses in a shell and not on a page,
 * or the reverse, with nothing to say which is correct.
 */
import { useEffect, useState } from 'react';
import { useShellScroll } from './scrollContext.js';

export function useScrolledPast(): boolean {
  const [scrolled, setScrolled] = useState(false);
  const shellScroll = useShellScroll();

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const region = shellScroll?.current ?? null;
    const target: HTMLElement | Window = region ?? window;

    const read = () => {
      setScrolled((region ? region.scrollTop : window.scrollY) > 0);
    };
    read();

    target.addEventListener('scroll', read, { passive: true });
    return () => target.removeEventListener('scroll', read);
  }, [shellScroll]);

  return scrolled;
}
