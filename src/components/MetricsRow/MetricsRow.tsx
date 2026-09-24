'use client';

/* MetricsRow — a row of KPI tiles that reflows by container width.
 *
 * "**A labelled list of figures.**" States: `at-rest`, `loading`, `empty`.
 *
 * The semantics sentence is the part worth being exact about. A row of figures
 * is a list, and a screen reader saying "list, four items" before the first one
 * tells the reader how much is coming — which is most of what they need from a
 * dashboard's summary band. Four sibling divs say nothing at all. So this is a
 * `ul` with a name, and the tiles are its items.
 *
 * The live region sits **outside** the list, not as its first child. A `ul` may
 * contain only `li`, `script` or `template`, and a `span` in there is a real
 * violation rather than a pedantic one: it is what makes a screen reader
 * disagree with the browser about how many items the list has. Caught by axe in
 * a browser, on the loading story, after the same assertion had passed in jsdom
 * against the at-rest render — the state with no live region in it.
 *
 * **Loading is one skeleton, not one per tile.** `KpiTile` takes `loading` and
 * keeps its own size so the row does not reflow when the figures arrive, which
 * is the right behaviour for a tile — but a row of six tiles each announcing
 * that it is loading is a screen reader saying the same sentence six times. So
 * the row announces once and the tiles stay quiet, which is the same shape as
 * `LoadingScreen`'s one skeleton over many shapes.
 *
 * **Empty is a state, not an absent row.** A dashboard whose metrics have not
 * been chosen yet renders nothing at all if this is a bare `map`, and the reader
 * is left looking at a gap where a band should be.
 *
 * The reflow is by container, not viewport, for the reason the dashboard grid
 * is: a band inside a pane is narrower than the window.
 */
import { type HTMLAttributes, type ReactNode } from 'react';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import { cx } from '../../styles/cx.js';
import styles from './MetricsRow.module.scss';

export interface MetricsRowProps extends Omit<HTMLAttributes<HTMLUListElement>, 'children'> {
  /**
   * Names the list. Required: "list, four items" with no name is four figures
   * about nothing, and a dashboard usually has more than one band of them.
   */
  label: string;
  /** The tiles, one per item. */
  children?: ReactNode[] | ReactNode;
  /** The figures have not arrived. Announced once, here, rather than per tile. */
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
