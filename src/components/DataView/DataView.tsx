'use client';

/* DataView: a collection rendered as a list or a grid.
 *
 * "A list; the layout switch is a control with a pressed state, not a hidden
 * toggle."
 *
 * It is a real `ul` in both layouts, because a grid of items is still a list of
 * items. The arrangement is a visual choice and the count is information. A
 * reader is told "12 items" either way, and switching layout does not change
 * what they were told.
 *
 * The switch is `SegmentedControl`, which is a radio group, although the
 * catalogue says "a control with a pressed state". Picking one of two
 * arrangements is a choice, and both Crystal and React Aria treat it that way:
 * Crystal's own segmented control is a radio group, and React Aria's
 * `ToggleButtonGroup` renders `role="radiogroup"` with `aria-checked` when its
 * selection is single. The catalogue's clause rules out two unlabelled icons
 * whose state is a colour, and a named radio group rules that out at least as
 * firmly as `aria-pressed` would.
 *
 * Below Crystal's small breakpoint the grid becomes a list and the switch goes
 * away, which is the catalogue's "layout switches at a declared breakpoint". It
 * is a container query, so it follows the collection's own box: the same
 * collection is a grid in a full-width page and a list in a 320px sidebar of
 * the same window. The breakpoint is Crystal's `$cr-breakpoint-sm` and not a
 * prop, because a container query's condition cannot read a custom property.
 * The switch is removed, not made inert, because a control that cannot change
 * anything is worse than no control.
 */
import {
  forwardRef, useState,
  type CSSProperties, type HTMLAttributes, type ReactNode,
} from 'react';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl.js';
import { cx } from '../../styles/cx.js';
import { ListPresence, PresenceItem } from '../../motion/ListPresence.js';
import styles from './DataView.module.scss';

/** How the collection is arranged. */
export type DataViewLayout = 'list' | 'grid';

export interface DataViewItem {
  /** Stable across renders. */
  id: string;
  content: ReactNode;
}

export interface DataViewProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  items: readonly DataViewItem[];
  /** Names the collection. Two on a page are otherwise the same list. */
  label: string;
  layout?: DataViewLayout;
  defaultLayout?: DataViewLayout;
  onLayoutChange?: (layout: DataViewLayout) => void;
  /** Hide the layout switch, for a collection that only has one arrangement. */
  switchable?: boolean;
  /** What the two options say. Announced, and never left to an icon. */
  listLabel?: string;
  gridLabel?: string;
  /** Smallest grid cell before the grid drops a column. */
  minCellWidth?: string;
  /** Whatever belongs above the collection, such as sorting and paging. */
  toolbar?: ReactNode;
  /** Shown instead of the list when there is nothing in it. */
  empty?: ReactNode;
  /** No items yet. The frame keeps its size so the page does not reflow. */
  loading?: boolean;
}

export const DataView = forwardRef<HTMLElement, DataViewProps>(function DataView(
  { items, label, layout, defaultLayout = 'grid', onLayoutChange, switchable = true,
    listLabel = 'List', gridLabel = 'Grid', minCellWidth,
    toolbar, empty, loading = false, className, ...props },
  ref,
) {
  const [internal, setInternal] = useState<DataViewLayout>(defaultLayout);
  const current = layout ?? internal;

  const choose = (value: string) => {
    if (value !== 'list' && value !== 'grid') return;
    if (layout === undefined) setInternal(value);
    onLayoutChange?.(value);
  };

  const style = (minCellWidth === undefined ? {} : { ['--cell-min']: minCellWidth }) as CSSProperties;

  return (
    <section
      {...props}
      ref={ref as never}
      aria-label={label}
      data-layout={current}
      className={cx(styles['view'], className)}
      style={style}
    >
      {(toolbar !== undefined || switchable) && (
        <div className={styles['toolbar']}>
          <div className={styles['tools']}>{toolbar}</div>
          {switchable ? (
            /* Crystal's own control. Named by visible text, so the name a
               reader hears is the name on the screen. */
            <SegmentedControl
              label="Layout"
              value={current}
              onChange={choose}
              options={[
                { value: 'list', label: listLabel },
                { value: 'grid', label: gridLabel },
              ]}
              className={cx(styles['switch'])}
            />
          ) : null}
        </div>
      )}

      {items.length === 0 && !loading ? (
        <p className={styles['empty']}>{empty}</p>
      ) : (
        <ul className={styles['items']}>
          {loading ? (
            <li aria-hidden="true" className={cx(styles['item'], styles['placeholder'])} />
          ) : (
            /* An item added after the view first rendered arrives with `list-in`.
               One removed leaves with `list-out`. */
            <ListPresence>
              {items.map((item) => (
                <PresenceItem key={item.id} className={styles['item']}>{item.content}</PresenceItem>
              ))}
            </ListPresence>
          )}
        </ul>
      )}
    </section>
  );
});
