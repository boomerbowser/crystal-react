'use client';

/* OverflowList.
 *
 * A single row that measures itself and moves what does not fit into a menu. It
 * is the pattern behind a toolbar that narrows gracefully, a breadcrumb trail
 * that collapses, and a tag row that says "+3 more".
 *
 * Three things that decide whether it works:
 *
 *   - **Hidden items stay reachable.** The catalogue says so and it is the whole
 *     accessibility contract: items that fall out of the row are not removed from
 *     the page, they move into a menu that announces how many it holds. A row
 *     that simply clips is a row that silently deletes functionality at narrow
 *     widths.
 *   - **Measuring must not flash.** The row has to be laid out before its widths
 *     can be read, so the first pass renders everything with `visibility: hidden`
 *     — laid out, invisible — rather than showing an overflowing row for a frame.
 *   - **Priority order is the product's.** Which item is dropped first is a
 *     product decision, so children are considered in order and the caller
 *     arranges them by importance. Crystal does not guess that the last one
 *     matters least.
 *
 * Widths are recorded during the measuring pass and measured from that record
 * afterwards, never from the DOM. Reading the DOM works while the row is
 * shrinking and fails the moment it widens: the hidden items are not rendered, so
 * a second pass can only ever conclude that the items still visible are the ones
 * that fit, and the row never grows back.
 *
 * The trigger is a pill that reaches the minimum target, like every other action.
 */
import {
  Children, Fragment, isValidElement, useCallback, useEffect, useRef, useState,
  type CSSProperties, type HTMLAttributes, type ReactNode,
} from 'react';
import { cx } from '../../styles/cx.js';
import { spacingValue, type CrystalSpacing } from '../../styles/spacing.js';
import styles from './OverflowList.module.scss';

export interface OverflowListProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Items, most important first. Ones that do not fit move into the menu. */
  children: ReactNode;
  /** Gap between items. Defaults to the action gap, so a row of pills looks like one. */
  gap?: CrystalSpacing;
  /**
   * Renders the overflow affordance. Receives the items that did not fit and how
   * many there are, so a product can use a menu, a popover or a dialog — Crystal
   * owns that the affordance exists and names its count, not what it opens.
   */
  renderOverflow: (hidden: readonly ReactNode[], count: number) => ReactNode;
}

/* The items, with a top-level fragment opened out.
 *
 * `Children.toArray` counts a fragment as one child, so a caller who wrapped
 * their row in `<>…</>` — which JSX invites, and which every other component
 * here treats as transparent — hands this one item. The row then measures one
 * item, finds that it does not fit, and moves *everything* into the overflow
 * menu: a bar of seven commands renders as the words "1 more" and nothing else.
 * It typechecks, it throws nothing, and the commands are still reachable, so
 * the only symptom is a toolbar that looks empty.
 *
 * Opened out here rather than in each caller, because the caller cannot see the
 * problem: there is nothing about `children: ReactNode` that says a fragment
 * means something different from the elements inside it.
 */
function itemsOf(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((child) => (
    isValidElement(child) && child.type === Fragment
      ? Children.toArray((child.props as { children?: ReactNode }).children)
      : [child]
  ));
}

export function OverflowList({
  children, gap, renderOverflow, className, style, ...props
}: OverflowListProps): React.JSX.Element {
  const items = itemsOf(children);
  const row = useRef<HTMLDivElement | null>(null);
  /* Each item's width, taken once while every item was laid out. This is what
     makes the row able to grow back. */
  const widths = useRef<number[]>([]);
  const triggerWidth = useRef(0);
  const [visibleCount, setVisibleCount] = useState<number | null>(null);

  const measure = useCallback(() => {
    const element = row.current;
    if (!element || widths.current.length === 0) return;

    const available = element.clientWidth;
    const gapSize = Number.parseFloat(getComputedStyle(element).columnGap) || 0;

    let used = 0;
    let fits = 0;
    for (let i = 0; i < widths.current.length; i += 1) {
      const next = used + (i > 0 ? gapSize : 0) + (widths.current[i] ?? 0);
      /* Room for the trigger has to be reserved whenever anything is going to be
         hidden — otherwise the last item that "fits" pushes the trigger out. */
      const needsTrigger = i < widths.current.length - 1;
      const budget = available - (needsTrigger ? gapSize + triggerWidth.current : 0);
      if (next > budget) break;
      used = next;
      fits += 1;
    }
    setVisibleCount(fits);
  }, []);

  /* A change in the item list invalidates the record, so the row goes back to
     measuring rather than deciding from widths that belonged to other items. */
  useEffect(() => {
    widths.current = [];
    setVisibleCount(null);
  }, [items.length]);

  useEffect(() => {
    const element = row.current;
    if (!element) return undefined;

    if (widths.current.length === 0) {
      const laidOut = Array.from(element.children) as HTMLElement[];
      widths.current = laidOut.slice(0, -1).map((child) => child.offsetWidth);
      triggerWidth.current = laidOut[laidOut.length - 1]?.offsetWidth ?? 0;
    }
    measure();

    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    observer?.observe(element);
    return () => observer?.disconnect();
  }, [measure, visibleCount === null, items.length]);

  /* Null means "not measured yet": everything is rendered so the widths exist to
     be read, and the row is invisible so the overflow is never seen. */
  const measuring = visibleCount === null;
  const shown = measuring ? items : items.slice(0, visibleCount);
  const hidden = measuring ? [] : items.slice(visibleCount);

  const layout: CSSProperties = {
    ...(gap !== undefined ? { '--cr-overflow-gap': spacingValue(gap) } as CSSProperties : {}),
    ...style,
  };

  return (
    <div
      {...props}
      ref={row}
      className={cx(styles['overflowList'], measuring ? styles['measuring'] : undefined, className)}
      style={layout}
    >
      {shown.map((item, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={index} className={cx(styles['item'])}>{item}</div>
      ))}
      <div className={cx(styles['item'])}>
        {hidden.length > 0 || measuring ? renderOverflow(hidden, hidden.length) : null}
      </div>
    </div>
  );
}
