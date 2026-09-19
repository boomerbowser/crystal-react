'use client';

/* When a scroll container needs to be a tab stop of its own.
 *
 * Crystal's scroll contract asks every scroll container for native gesture
 * handling, and a keyboard is a gesture. A region that scrolls but holds nothing
 * focusable is unreachable without one: a mouse can wheel it, a touch can drag
 * it, and somebody navigating by keyboard cannot move it at all. axe reports it
 * as `scrollable-region-focusable`, and it is a failure of WCAG 2.1.1.
 *
 * The condition is both halves. A scroll region full of links is already
 * reachable — the links are the tab stops, and adding another would put an
 * announced-as-nothing stop in front of them for no gain.
 *
 * This lives apart from `ScrollArea` because `AppShell` puts `cr-scroll-frost`
 * straight onto its `<main>` — a landmark, which a `div` cannot be — and so
 * never went through `ScrollArea` at all. It shipped with a `<main>` a keyboard
 * could not scroll, and no check saw it until the stories began running as tests
 * in a real browser. Two copies of this rule would have drifted the first time
 * one was touched.
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

    /* Content arriving later is the normal case — a list that loads, a panel
       that expands — and neither a scroll listener nor a first render sees it. */
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
