'use client';

/* Workspace — a persistent multi-pane working area.
 *
 * States: `at-rest`, `focus-mode`.
 * "Each pane is a **labelled region**; focus order follows the **visual order**."
 *
 * Both clauses are checkable and neither is checkable here. A pane is a labelled
 * region because `label` is required on every pane — a landmark list reading
 * "region, region, region" is worse than no landmarks, since the reader now has
 * three entries and no way to choose between them. That much the types enforce.
 *
 * Focus order following visual order is the one that cannot be enforced by a
 * type or seen in jsdom, because both orders are geometry: the tab order comes
 * from the document and the visual order from the boxes, and a `grid-column`,
 * an `order`, or a `direction` can move one without the other. A workspace where
 * they disagree tabs from the left pane to the right to the middle, and nothing
 * in the source looks wrong. `verify:behaviour` walks the tab order and compares
 * it against the rendered positions, which is the only place that question has
 * an answer.
 *
 * **Focus mode removes the other panes rather than shrinking them.** A pane
 * squeezed to a sliver is still in the tab order, still readable by a screen
 * reader, and still catches a click — so "hidden" chrome that is only small is
 * chrome the reader can still fall into. The catalogue's `focus-mode` says one
 * task is left visible, and the honest reading of that is that the rest are not
 * rendered.
 */
import { type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import styles from './Workspace.module.scss';

export interface WorkspacePane {
  /** Identifies the pane. Stable across renders. */
  id: string;
  /**
   * Names the pane's region. Required: a landmark list reading "region, region,
   * region" gives the reader three entries and no way to choose between them.
   */
  label: string;
  children: ReactNode;
}

export interface WorkspaceProps extends HTMLAttributes<HTMLDivElement> {
  /** The panes, in the order they are read and the order they are shown. */
  panes: readonly WorkspacePane[];
  /**
   * Leave one task visible. The other panes are not rendered — see the note
   * above: a pane shrunk to nothing is still a tab stop.
   */
  focused?: string | null;
}

export function Workspace({
  panes, focused = null, className, ...props
}: WorkspaceProps): React.JSX.Element {
  const shown = focused === null ? panes : panes.filter((one) => one.id === focused);

  return (
    <div
      {...props}
      data-cr-state={focused === null ? 'at-rest' : 'focus-mode'}
      className={cx(styles['workspace'], focused === null ? undefined : styles['focused'], className)}
    >
      {shown.map((pane) => (
        <section key={pane.id} aria-label={pane.label} className={cx(styles['pane'])}>
          {pane.children}
        </section>
      ))}
    </div>
  );
}
