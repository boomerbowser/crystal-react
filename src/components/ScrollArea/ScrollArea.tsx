'use client';

/* Scroll area.
 *
 * Crystal's catalogue gives this component three obligations — the scrollbar's
 * appearance, the edge fade, and reduced-motion behaviour — and this file owns
 * none of their values. The scrollbar is `@crystal-ui/core`'s own `.cr-scroll-frost`
 * or `.cr-scroll-resin` class, and the fade is Crystal's CSS keyed on
 * `data-cr-scroll`. What React adds is the one thing CSS cannot do on its own:
 * know whether there is content beyond each edge.
 *
 * Which scrollbar follows the hierarchy rather than taste. Frost is the
 * intermediate surface, so its scrollbar belongs to the panel the way the panel's
 * own text does; Resin is the floating control plane, so a scrollbar there is a
 * control and is tinted like one. Panels and reading surfaces take Frost; menus,
 * popovers and compact scrollers take Resin.
 *
 * Two things that look like details and are not:
 *
 *   - **Focusability is conditional.** A scrollable region that contains nothing
 *     focusable is unreachable by keyboard, which is a WCAG failure and is what
 *     axe's `scrollable-region-focusable` rule is about. So this becomes a tab
 *     stop only when it scrolls *and* holds nothing focusable — adding a stop
 *     that is not needed is its own annoyance. A named area becomes a `region`;
 *     an unnamed one does not, because a landmark without a name is noise in a
 *     screen reader's landmark list.
 *   - **`data-cr-scroll` is absent, not empty, when nothing overflows.** Crystal's
 *     CSS fades only when the attribute is present, so a container that cannot
 *     scroll is unmasked rather than faded at both ends.
 *
 * The catalogue's three states are `at-start`, `scrolling` and `at-end`. The two
 * positional ones are `data-cr-scroll`; `scrolling` is not represented, because
 * Crystal specifies no appearance for it and an idle timer running on every
 * scroll frame to drive nothing would be a cost with no reader.
 *
 * Reduced motion needs nothing here: this component animates nothing, and the
 * smooth scrolling a product may ask for is `scroll-behavior`, which Crystal's
 * reset already switches to `auto` under `prefers-reduced-motion`.
 *
 * React Aria owns everything here that it has an answer for, and for a scroll
 * container that is less than it sounds: it ships no scroll-area primitive, and
 * its one scrolling API — `usePreventScroll` — is the modal scroll lock, which
 * `Dialog` already gets through React Aria's own `Modal`. What it does own here is
 * the composition: `useObjectRef` and `mergeProps` merge the forwarded ref and
 * chain a consumer's `onScroll` with this component's, so neither is hand-rolled.
 * Where React Aria owns scrolling outright — keyboard scroll-into-view inside a
 * collection, `Virtualizer`, the load-more sentinels — the components that use it
 * take it rather than repeating it here.
 */
import {
  forwardRef, useCallback, useEffect, useState,
  type HTMLAttributes, type ReactNode,
} from 'react';
import { mergeProps, useObjectRef } from 'react-aria';
import { cx } from '../../styles/cx.js';
import { useScrollTabStop } from './useScrollTabStop.js';
import styles from './ScrollArea.module.scss';

/** Which material's scrollbar this area carries. */
export type ScrollAreaVariant = 'frost' | 'resin';

/** Which way the area scrolls. `both` carries no edge fade — see `fade`. */
export type ScrollAreaAxis = 'y' | 'x' | 'both';

/** Where the viewport is within the content, as Crystal's CSS reads it. */
type ScrollEdges = 'start' | 'end' | 'both' | undefined;

export interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Which scrollbar. Defaults to `frost`: most scroll areas are panels or
   * reading surfaces, and a control-plane scrollbar on one reads as louder than
   * the thing it is scrolling.
   */
  variant?: ScrollAreaVariant;
  /** Scrolling axis. Defaults to `y`. */
  axis?: ScrollAreaAxis;
  /**
   * Fade the content where there is more beyond the edge. On by default, and
   * ignored when `axis` is `both` — a fade is a gradient along one axis, and two
   * crossed gradients darken the corners rather than describing them.
   */
  fade?: boolean;
  children?: ReactNode;
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(function ScrollArea(
  { variant = 'frost', axis = 'y', fade = true, className, children, ...props },
  ref,
) {
  const inner = useObjectRef(ref);
  const [edges, setEdges] = useState<ScrollEdges>(undefined);
  /* The rule lives in one place, because `AppShell` needs it too. */
  const needsTabStop = useScrollTabStop(inner);

  const measure = useCallback(() => {
    const element = inner.current;
    if (!element) return;

    const horizontal = axis === 'x';
    const size = horizontal ? element.clientWidth : element.clientHeight;
    const content = horizontal ? element.scrollWidth : element.scrollHeight;
    /* In a right-to-left container `scrollLeft` counts down from zero, so the
       distance travelled is its magnitude either way. */
    const position = horizontal ? Math.abs(element.scrollLeft) : element.scrollTop;

    /* A one-pixel tolerance: fractional layout means a container at its end can
       report a position a fraction short of the maximum, and without this the
       far edge stays faded at the bottom of every list. */
    const overflows = content > size + 1;
    const atStart = position <= 1;
    const atEnd = position >= content - size - 1;

    setEdges(!overflows || (atStart && atEnd) ? undefined
      : atStart ? 'start'
        : atEnd ? 'end'
          : 'both');

  }, [axis]);

  useEffect(() => {
    const element = inner.current;
    if (!element) return undefined;
    measure();

    /* Content arriving later is the normal case — a list that loads, a panel that
       expands — and a scroll listener alone never sees it. */
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
  }, [measure]);

  const named = Boolean(props['aria-label'] ?? props['aria-labelledby']);

  return (
    <div
      {...mergeProps(props, { onScroll: measure })}
      ref={inner}
      className={cx(
        styles['area'],
        styles[axis === 'x' ? 'axisX' : axis === 'both' ? 'axisBoth' : 'axisY'],
        variant === 'resin' ? 'cr-scroll-resin' : 'cr-scroll-frost',
        className,
      )}
      {...(fade && axis !== 'both'
        ? { 'data-cr-scroll': edges, 'data-cr-scroll-axis': axis }
        : {})}
      {...(needsTabStop ? { tabIndex: 0, ...(named ? { role: 'region' } : {}) } : {})}
    >
      {children}
    </div>
  );
});
