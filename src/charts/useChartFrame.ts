'use client';

/* How a chart learns how wide it is.
 *
 * Drawn in CSS pixels rather than in a scaled viewBox, and that is the whole
 * reason this hook exists. A fixed viewBox stretched to the container is far
 * less code, and it scales the stroke scale, the point scale and every axis
 * label along with the plot — a 2px line becomes 3.4px on a wide screen and 1.1px
 * on a narrow one, which is a design value that changes with the window. So the
 * box is measured and the drawing is done at true size.
 *
 * Before the first measurement the frame is the declared fallback. Nothing is
 * wrong then and nothing should be hidden: a chart rendered on a server, or in a
 * test environment with no layout, draws a valid picture at the fallback width
 * and redraws at the real one. `measured` says which of the two you are looking
 * at, for the rare caller that needs to know.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChartFrame, ChartInsets } from './types.js';

/** Width used until the element has been measured. */
const FALLBACK_WIDTH = 640;

export function useChartFrame(
  height: number,
  insets: ChartInsets,
): [(node: HTMLElement | null) => void, ChartFrame] {
  const [width, setWidth] = useState<number | null>(null);
  const element = useRef<HTMLElement | null>(null);

  const measure = useCallback(() => {
    const node = element.current;
    if (!node) return;
    const next = Math.round(node.getBoundingClientRect().width);
    /* Zero is what a detached node and a display:none ancestor both report, and
       drawing a chart nought pixels wide produces paths full of NaN. */
    if (next > 0) setWidth(next);
  }, []);

  const ref = useCallback((node: HTMLElement | null) => {
    element.current = node;
    if (node) measure();
  }, [measure]);

  useEffect(() => {
    const node = element.current;
    if (!node) return undefined;
    measure();
    /* Guarded because jsdom has no ResizeObserver, the same way `OverflowList`
       guards it. Without one the fallback width stands, which is a chart that is
       drawn rather than a chart that throws. */
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    observer?.observe(node);
    return () => observer?.disconnect();
  }, [measure]);

  const drawn = width ?? FALLBACK_WIDTH;
  return [ref, {
    width: drawn,
    height,
    inner: {
      x: insets.left,
      y: insets.top,
      /* Never negative: a container narrower than its own gutters would
         otherwise produce a plot with a negative width, and every scale built on
         it would invert. */
      width: Math.max(0, drawn - insets.left - insets.right),
      height: Math.max(0, height - insets.top - insets.bottom),
    },
    measured: width !== null,
  }];
}
