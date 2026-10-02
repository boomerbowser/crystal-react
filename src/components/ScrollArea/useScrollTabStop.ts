'use client';

/* When a scroll container needs to be a tab stop of its own.
 *
 * Crystal's scroll contract asks every scroll container for native gesture
 * handling, and a keyboard is a gesture. A region that scrolls but holds nothing
 * focusable is unreachable without one: a mouse can wheel it, a touch can drag
 * it, and somebody navigating by keyboard cannot move it at all. axe reports it
 * as `scrollable-region-focusable`, and it is a failure of WCAG 2.1.1.
 *
 * Both conditions must hold. A scroll region full of links is already reachable
 * because the links are the tab stops, and another stop in front of them would
 * be announced as nothing.
 *
 * This lives apart from `ScrollArea` because `AppShell` puts `cr-scroll-frost`
 * straight onto its `<main>`, a landmark, which a `div` cannot be, so it does not
 * go through `ScrollArea`. Both use this one hook so the rule cannot drift.
 */
import { useCallback, useEffect, useState, type RefObject } from 'react';

export const FOCUSABLE =
  'a[href],button,input,select,textarea,summary,iframe,audio[controls],video[controls],'
  + '[contenteditable]:not([contenteditable="false"]),[tabindex]:not([tabindex="-1"])';

export function useScrollTabStop(ref: RefObject<HTMLElement | null>): boolean {
  const [needsTabStop, setNeedsTabStop] = useState(false);

  const measure = useCallback(() => {
    const element = ref.current;
    if (!element) return;
    /* Asked of the element rather than of a declared axis: vertical overflow
       still traps content in a container someone called horizontal. */
    const scrolls = element.scrollHeight > element.clientHeight + 1
      || element.scrollWidth > element.clientWidth + 1;
    setNeedsTabStop(scrolls && element.querySelector(FOCUSABLE) === null);
  }, [ref]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    measure();

    /* Content often arrives later (a list that loads, a panel that expands),
       and neither a scroll listener nor a first render sees it. */
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    if (observer) {
      observer.observe(element);
      for (const child of Array.from(element.children)) observer.observe(child);
    }
    const mutations = typeof MutationObserver === 'function' ? new MutationObserver(measure) : null;
    mutations?.observe(element, { childList: true, subtree: true });

    return () => {
      observer?.disconnect();
      mutations?.disconnect();
    };
  }, [measure, ref]);

  return needsTabStop;
}
