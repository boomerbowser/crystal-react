'use client';

/* One tab stop per chart, arrows between the marks inside it.
 *
 * Every chart in the catalogue lists `focus-visible` and most say each item is
 * reachable. Reachable cannot mean one tab stop each: a scatter chart with two
 * hundred points would be two hundred stops between the control before it and the
 * control after it, and a keyboard user would learn to avoid the page. So the
 * plot is one stop and the marks are a roving tabindex inside it — the same
 * arrangement a toolbar, a radio group and a grid all use, and the one a reader
 * already knows.
 *
 * The marks are SVG `<g>` elements carrying `tabindex`, which is SVG 2 and works
 * in every engine this library gates against — but "works" is a claim, so
 * `verify:behaviour` drives it in a real browser rather than trusting the spec.
 *
 * Home and End go to the ends. There is no wrap: arriving back at the first point
 * after the last, silently, is how a reader loses their place in a chart whose
 * shape they cannot see.
 */
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';

/** What a mark takes from the roving cursor: its place in the tab order, the
 *  node the cursor moves focus to, and the report that it arrived. */
export interface MarkProps {
  tabIndex: number;
  ref: (node: SVGGElement | null) => void;
  onFocus: () => void;
}

export interface MarkNavigation {
  /** Which mark holds the roving tab stop. */
  active: number;
  setActive: (index: number) => void;
  /** Props for the element that owns the marks. */
  containerProps: { onKeyDown: (event: KeyboardEvent) => void };
  /** Props for mark `index`. */
  markProps: (index: number) => {
    tabIndex: number;
    ref: (node: SVGGElement | null) => void;
    onFocus: () => void;
  };
}

export function useMarkNavigation(count: number): MarkNavigation {
  const [active, setActive] = useState(0);
  const marks = useRef(new Map<number, SVGGElement>());
  const wanted = useRef<number | null>(null);

  /* Focus after render, not during the key handler: the element that should take
     focus may not be the one that had it, and in a chart that re-sorts on
     interaction it may not exist yet. */
  useEffect(() => {
    if (wanted.current === null) return;
    marks.current.get(wanted.current)?.focus();
    wanted.current = null;
  });

  const move = useCallback((to: number) => {
    const next = Math.min(count - 1, Math.max(0, to));
    setActive(next);
    wanted.current = next;
  }, [count]);

  const onKeyDown = useCallback((event: KeyboardEvent) => {
    const keys: Record<string, number> = {
      ArrowRight: active + 1, ArrowDown: active + 1,
      ArrowLeft: active - 1, ArrowUp: active - 1,
      Home: 0, End: count - 1,
    };
    const to = keys[event.key];
    if (to === undefined || count === 0) return;
    event.preventDefault();
    move(to);
  }, [active, count, move]);

  /* The tab stop, which is not simply `active`. A chart whose data shrinks — six
     categories replaced with three — leaves `active` past the end, and then no
     mark carries `tabIndex: 0` and Tab skips the whole plot. The state is not
     corrected, because the reader may be about to get their marks back; the stop
     is clamped, because a chart nobody can tab into is a chart with no keyboard
     at all. */
  const stop = Math.min(active, Math.max(0, count - 1));

  return {
    active,
    setActive: move,
    containerProps: { onKeyDown },
    markProps: (index: number) => ({
      tabIndex: index === stop ? 0 : -1,
      ref: (node: SVGGElement | null) => {
        if (node) marks.current.set(index, node);
        else marks.current.delete(index);
      },
      onFocus: () => setActive(index),
    }),
  };
}
