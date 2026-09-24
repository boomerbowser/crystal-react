'use client';

/* Screen — a full view with its own header, content region and chrome.
 *
 * "**One `main` per view**; the heading is the view name."
 *
 * That first clause is the whole difficulty. `AppShell` already renders a
 * `<main>`, so a `Screen` that always rendered one would give a product two
 * mains the moment it used both — a landmark list with two identical entries,
 * and no way for a reader to tell which is the content. A prop asking the
 * consumer to remember would put the failure exactly where nobody looks.
 *
 * So the screen asks. `AppShell` publishes its scrolling region through
 * `ShellScrollContext`, and the element it publishes *is* its `<main>` — not a
 * proxy for it, the same node. A screen with a shell above it therefore knows
 * there is already a main, and becomes a labelled `<section>` instead. Nested,
 * the landmarks stay correct; standalone, the screen is the main. Neither case
 * asks the product to know.
 *
 * **The heading is not rendered here.** "The heading is the view name" says what
 * the heading must say, not who draws it: `PageHeader` owns the `h1`, and a
 * screen that also emitted one would compete with it. What the screen does is
 * take `label` and point the landmark at it, so the region is named even when
 * the product has not used a page header at all.
 *
 * The foundation is the page's rather than this component's. A screen inside a
 * shell painting Plastic would be a second foundation over the first, and
 * Plastic is the foundation precisely because there is one of it.
 */
import { useId, type HTMLAttributes, type ReactNode } from 'react';
import { useShellScroll } from '../AppShell/scrollContext.js';
import { cx } from '../../styles/cx.js';
import styles from './Screen.module.scss';

export interface ScreenProps extends HTMLAttributes<HTMLElement> {
  /**
   * The view's name, for the landmark. Required: a landmark without a name is a
   * line in a screen reader's landmark list saying "main" and nothing else.
   * Where a `PageHeader` renders the same words as the heading, pass them here
   * too — the heading names the content, the landmark names the region.
   */
  label: string;
  /** The view's own header — typically a `PageHeader`. */
  header?: ReactNode;
  /** Persistent chrome at the foot of the view — typically a `StatusBar`. */
  chrome?: ReactNode;
  children?: ReactNode;
}

export function Screen({
  label, header, chrome, children, className, ...props
}: ScreenProps): React.JSX.Element {
  /* Not "is there a shell" but "is there already a main", which is the question
     the landmark rule actually asks. The shell publishes the node itself. */
  const shellOwnsTheMain = useShellScroll() !== null;
  const Region = shellOwnsTheMain ? 'section' : 'main';
  const id = useId();

  return (
    <Region
      {...props}
      aria-label={label}
      className={cx(styles['screen'], className)}
      id={props.id ?? id}
    >
      {header}
      <div className={cx(styles['content'])}>{children}</div>
      {chrome}
    </Region>
  );
}
