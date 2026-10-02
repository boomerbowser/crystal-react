'use client';

/* MetricsRow: a row of KPI tiles that reflows by container width.
 *
 * "A labelled list of figures." States: `at-rest`, `loading`, `empty`.
 *
 * A row of figures is a list. A screen reader saying "list, four items" before
 * the first one tells the reader how much is coming, which is most of what they
 * need from a dashboard's summary band. Four sibling divs say nothing. This is
 * therefore a `ul` with a name, and the tiles are its items.
 *
 * The live region sits outside the list, not as its first child. A `ul` may
 * contain only `li`, `script` or `template`. A `span` inside it makes a screen
 * reader disagree with the browser about how many items the list has. axe
 * reports it only on the loading render, because the at-rest render has no live
 * region.
 *
 * Loading is one skeleton, not one per tile. `KpiTile` takes `loading` and keeps
 * its own size so the row does not reflow when the figures arrive. Six tiles
 * each announcing that they are loading would make a screen reader say the same
 * sentence six times, so the row announces once and the tiles stay quiet, as
 * `LoadingScreen` renders one skeleton over many shapes.
 *
 * Empty is a state, not an absent row. A bare `map` renders nothing for a
 * dashboard whose metrics have not been chosen yet, and the reader sees a gap
 * where a band should be.
 *
 * The reflow is by container, not viewport, for the same reason as the
 * dashboard grid: a band inside a pane is narrower than the window.
 */
import { type HTMLAttributes, type ReactNode } from 'react';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import { cx } from '../../styles/cx.js';
import styles from './MetricsRow.module.scss';

export interface MetricsRowProps extends Omit<HTMLAttributes<HTMLUListElement>, 'children'> {
  /**
   * Names the list. Required: without a name, "list, four items" does not say
   * what the figures are about, and a dashboard usually has more than one band.
   */
  label: string;
  /** The tiles, one per item. */
  children?: ReactNode[] | ReactNode;
  /** The figures have not arrived. Announced once, here, instead of per tile. */
  loading?: boolean;
  /** Shown when there are no metrics to show at all. */
  empty?: ReactNode;
}

export function MetricsRow({
  label, children, loading = false, empty, className, ...props
}: MetricsRowProps): React.JSX.Element {
  const tiles = Array.isArray(children) ? children : children === undefined ? [] : [children];
  const nothing = tiles.length === 0;

  if (nothing && empty !== undefined) {
    return <div aria-label={label} role="group" className={cx(className)}>{empty}</div>;
  }

  return (
    <>
      {loading ? (
        <VisuallyHidden role="status">{`${label} loading`}</VisuallyHidden>
      ) : null}
      <ul {...props} aria-label={label} aria-busy={loading || undefined} className={cx(styles['row'], className)}>
        {tiles.map((tile, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <li key={index} className={cx(styles['cell'])}>{tile}</li>
        ))}
      </ul>
    </>
  );
}
