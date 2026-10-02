'use client';

/* OverflowList.
 *
 * A single row that measures itself and moves what does not fit into a menu.
 * It is the pattern behind a toolbar that narrows, a breadcrumb trail that
 * collapses, and a tag row that says "+3 more".
 *
 * Three rules:
 *
 *   - Hidden items stay reachable. The catalogue requires it, and it is the
 *     accessibility contract: items that fall out of the row stay on the page,
 *     in a menu that announces how many it holds. A row that only clips
 *     silently removes functionality at narrow widths.
 *   - Measuring must not flash. The row has to be laid out before its widths
 *     can be read, so the first pass renders everything laid out but invisible,
 *     with `visibility: hidden`, and never shows an overflowing row for a frame.
 *   - Priority order is the product's. Which item is dropped first is a
 *     product decision, so children are considered in order and the caller
 *     arranges them by importance. Crystal does not assume that the last one
 *     matters least.
 *
 * Widths are recorded during the measuring pass and later fits are computed
 * from that record, never from the DOM. Reading the DOM works while the row
 * shrinks and fails when it widens: the hidden items are not rendered, so a
 * second pass can only conclude that the items still visible are the ones that
 * fit, and the row never grows back.
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
   * many there are, so a product can use a menu, a popover or a dialog. Crystal
   * requires that the affordance exists and names its count, and leaves what it
   * opens to the product.
   */
  renderOverflow: (hidden: readonly ReactNode[], count: number) => ReactNode;
}

/* The items, with a top-level fragment opened out.
 *
 * `Children.toArray` counts a fragment as one child. A caller who wraps their
 * row in `<>…</>`, which JSX invites and every other component here treats as
 * transparent, would hand this one item. The row would measure one item, find
 * that it does not fit, and move everything into the overflow menu, so a bar of
 * seven commands renders as the words "1 more" and nothing else. That
 * typechecks, throws nothing and keeps the commands reachable, so the only
 * symptom is a toolbar that looks empty.
 *
 * The fragment is opened out here, in one place, because a caller cannot see
 * the problem: nothing about `children: ReactNode` says a fragment means
 * something different from the elements inside it.
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
  /* Each item's width, taken once while every item was laid out. This record
     lets the row grow back. */
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
      /* Room for the trigger is reserved whenever anything is going to be
         hidden. Otherwise the last item that "fits" pushes the trigger out. */
      const needsTrigger = i < widths.current.length - 1;
      const budget = available - (needsTrigger ? gapSize + triggerWidth.current : 0);
      if (next > budget) break;
      used = next;
      fits += 1;
    }
    setVisibleCount(fits);
  }, []);

  /* A change in the item list invalidates the record, so the row measures again
     and does not decide from widths that belonged to other items. */
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

  /* Null means "not measured yet". Everything is rendered so the widths exist to
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
