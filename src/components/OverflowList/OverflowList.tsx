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
 * The trigger is a pill that reaches the minimum target, like every other action.
 */
import {
  Children, useCallback, useEffect, useRef, useState,
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

export function OverflowList({
  children, gap, renderOverflow, className, style, ...props
}: OverflowListProps): React.JSX.Element {
  const items = Children.toArray(children);
  const row = useRef<HTMLDivElement | null>(null);
  const [visibleCount, setVisibleCount] = useState<number | null>(null);

  const measure = useCallback(() => {
    const element = row.current;
    if (!element) return;

    const available = element.clientWidth;
    const children_ = Array.from(element.children) as HTMLElement[];
    /* The last child is the overflow trigger; it is measured but never dropped. */
    const trigger = children_[children_.length - 1];
    const gapSize = Number.parseFloat(getComputedStyle(element).columnGap) || 0;

    let used = 0;
    let fits = 0;
    for (let i = 0; i < children_.length - 1; i += 1) {
      const next = used + (i > 0 ? gapSize : 0) + (children_[i]?.offsetWidth ?? 0);
      /* Room for the trigger has to be reserved whenever anything is going to be
         hidden — otherwise the last item that "fits" pushes the trigger out. */
      const needsTrigger = i < children_.length - 2;
      const budget = available - (needsTrigger ? gapSize + (trigger?.offsetWidth ?? 0) : 0);
      if (next > budget) break;
      used = next;
      fits += 1;
    }
    setVisibleCount(fits);
  }, []);

  useEffect(() => {
    const element = row.current;
    if (!element) return undefined;
    measure();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    observer?.observe(element);
    return () => observer?.disconnect();
  }, [measure, items.length]);

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
