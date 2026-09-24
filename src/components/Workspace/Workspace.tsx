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
 *
 * Which creates the problem `FocusMode` exists to solve, in a second place: if
 * the reader's focus is in a pane when that pane stops being rendered, focus
 * falls to the document body and a keyboard reader starts again from the top of
 * the page, with nothing said about it. So focus moves to the surviving pane
 * first — and only when it was in a pane that went, because a reader already
 * working in the pane being focused should keep their place.
 *
 * Knowing where focus was has to be done in advance. By the time an effect can
 * see that `focused` changed, the pane has already unmounted and
 * `document.activeElement` is the body; there is no lifecycle point between
 * "still focused" and "gone". So focus is followed as it moves.
 */
import { useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react';
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
  const survivor = useRef<HTMLElement | null>(null);
  const focusedPane = useRef<string | null>(null);
  const was = useRef(focused);

  /* `focusin` rather than `focus`: focus does not bubble, and this has to hear
     about a control several levels down inside a pane. */
  const trackFocus = (event: React.FocusEvent<HTMLDivElement>): void => {
    const pane = (event.target as HTMLElement).closest('section[aria-label]');
    focusedPane.current = pane?.getAttribute('aria-label') ?? null;
  };

  useEffect(() => {
    const before = was.current;
    was.current = focused;
    if (before === focused || focused === null) return;

    /* Only when the pane focus was in is one that has just gone. */
    const stillShown = shown.some((one) => one.label === focusedPane.current);
    if (focusedPane.current !== null && !stillShown) survivor.current?.focus();
  }, [focused, shown]);

  return (
    <div
      {...props}
      data-cr-state={focused === null ? 'at-rest' : 'focus-mode'}
      onFocus={trackFocus}
      className={cx(styles['workspace'], focused === null ? undefined : styles['focused'], className)}
    >
      {shown.map((pane, index) => (
        <section
          key={pane.id}
          ref={index === 0 ? survivor : undefined}
          aria-label={pane.label}
          /* Focusable only as the target of the move above, never a tab stop. */
          tabIndex={-1}
          className={cx(styles['pane'])}
        >
          {pane.children}
        </section>
      ))}
    </div>
  );
}
