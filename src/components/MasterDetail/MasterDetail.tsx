'use client';

/* MasterDetail: a list beside the detail of its selection.
 *
 * States: `at-rest`, `empty-selection`, `narrow`.
 * "Selection moves focus to the detail only when the layout has collapsed."
 *
 * Wide, the list and the detail are both on screen. Moving focus to the detail
 * when a row is chosen would take the reader out of the list they are still
 * reading: they arrow to the next row and focus is somewhere else. The detail
 * changes where they can see it, and focus stays put.
 *
 * Collapsed, the detail replaces the list. A reader left with focus on a list
 * that is no longer displayed is focused on nothing, and their next key press
 * goes to a control that is not there. The same action therefore behaves
 * differently depending on a media query, and `verify:behaviour` drives it at
 * two viewports, because jsdom does not evaluate media queries.
 *
 * `empty-selection` is the third state, and products often leave it out: wide,
 * with nothing chosen, the detail pane is a large empty rectangle beside a list.
 * It takes `emptySelection` and says what to do, which is what `EmptyState` is
 * for.
 *
 * The breakpoint is Crystal's `md`, read through `useMediaQuery` instead of a
 * `ResizeObserver`, because "the layout breakpoint" is a property of the display
 * and not of this element. Two master-detail views on one page collapse
 * together, and a product's own CSS at the same breakpoint stays in step.
 */
import { useEffect, useMemo, useRef, type HTMLAttributes, type ReactNode } from 'react';
import { useMediaQuery } from '../../theme/useMediaQuery.js';
import { crystalTokens } from '../../theme/tokens.generated.js';
import { cx } from '../../styles/cx.js';
import { mergeRefs } from '../../utils/mergeRefs.js';
import { useChangeMotion } from '../../motion/useChangeMotion.js';
import styles from './MasterDetail.module.scss';

/* Crystal's `md`, taken from the generated token export instead of retyped.
   The layout and the focus rule are driven by this one value, and the
   stylesheet has no media query of its own, so the component has one
   breakpoint and it is the published one. A literal would go stale when the
   token changes. */
const COLLAPSE_AT = crystalTokens['breakpoint.md'];

export interface MasterDetailProps extends HTMLAttributes<HTMLDivElement> {
  /** The list pane. */
  list: ReactNode;
  /** The detail of whatever is chosen. */
  children?: ReactNode;
  /** Shown in place of the detail when nothing is chosen and both panes fit. */
  emptySelection?: ReactNode;
  /**
   * What is chosen. Focus follows a change in this, and only once the layout
   * has collapsed (see the note above).
   */
  selectedKey?: string | number | null;
  /** Names the list pane for its landmark. */
  listLabel?: string;
  /** Names the detail pane for its landmark. */
  detailLabel?: string;
}

export function MasterDetail({
  list, children, emptySelection, selectedKey = null,
  listLabel = 'List', detailLabel = 'Detail', className, ...props
}: MasterDetailProps): React.JSX.Element {
  const stacked = !useMediaQuery(`(min-width: ${COLLAPSE_AT})`, true);
  const detail = useRef<HTMLElement>(null);
  const previous = useRef(selectedKey);

  useEffect(() => {
    const changed = previous.current !== selectedKey;
    previous.current = selectedKey;
    /* Only when collapsed, and only on a change: moving focus on every render
       would take it back from wherever the reader had moved it to. */
    if (!changed || !stacked || selectedKey === null) return;
    detail.current?.focus();
  }, [selectedKey, stacked]);

  const nothingChosen = selectedKey === null;
  /* `page-in` plays on the detail when a different item is chosen, because the
     detail is a new view. It never plays on the render that opens with one
     chosen. The detail it replaces is gone in the same render, so there is no
     departing view to play `page-out` on. */
  const arrival = useChangeMotion(selectedKey, (_, is) => (is === null ? null : 'page-in'));
  const detailRef = useMemo(() => mergeRefs(detail, arrival as never), [arrival]);

  return (
    <div
      {...props}
      data-cr-state={stacked ? 'narrow' : nothingChosen ? 'empty-selection' : 'at-rest'}
      className={cx(styles['wrap'], stacked ? styles['stacked'] : undefined, className)}
    >
      {/* Stacked, one pane is displayed at a time: a stack showing both would be
          the list and the detail in sequence, which is a page. */}
      {stacked && !nothingChosen ? null : (
        <section aria-label={listLabel} className={cx(styles['list'])}>{list}</section>
      )}
      {stacked && nothingChosen ? null : (
        <section
          ref={detailRef}
          aria-label={detailLabel}
          /* Focusable only as a target for the move above. It is never a tab
             stop, because a keyboard stop on this region would announce
             nothing. */
          tabIndex={-1}
          className={cx(styles['detail'])}
        >
          {nothingChosen ? emptySelection : children}
        </section>
      )}
    </div>
  );
}
