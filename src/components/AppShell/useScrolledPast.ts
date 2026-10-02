'use client';

/* Whether the view has been scrolled away from its top.
 *
 * Two components need the same answer: `AppBar` shows elevation once something
 * has scrolled under it, and `PageHeader` condenses on the same signal. Inside an
 * `AppShell` the window is the wrong thing to ask. The bar and the header never
 * move and the content region scrolls beneath them, so the window's scroll
 * position stays zero.
 *
 * It lives here, beside the context it reads, as one shared rule, for the same
 * reason as the scroll tab stop. Two copies would drift apart, and a header
 * would condense in a shell and not on a page, or the reverse.
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
