'use client';

/* Screen: a full view with its own header, content region and chrome.
 *
 * "One `main` per view; the heading is the view name."
 *
 * `AppShell` already renders a `<main>`, so a `Screen` that always rendered one
 * would give a product two mains whenever it used both: a landmark list with two
 * identical entries, and no way for a reader to tell which is the content. A
 * prop asking the consumer to remember would be easy to miss.
 *
 * The screen checks instead. `AppShell` publishes its scrolling region through
 * `ShellScrollContext`, and the element it publishes is its `<main>`, the same
 * node. A screen with a shell above it knows there is already a main and
 * becomes a labelled `<section>`. Standalone, the screen is the main. Neither
 * case asks the product to know.
 *
 * The heading is not rendered here. "The heading is the view name" says what the
 * heading must say, not who draws it. `PageHeader` owns the `h1`, and a screen
 * that also emitted one would compete with it. The screen takes `label` and
 * points the landmark at it, so the region is named even when the product has
 * not used a page header.
 *
 * The foundation belongs to the page. A screen inside a shell painting Plastic
 * would be a second foundation over the first, and there is only one
 * foundation.
 */
import { type HTMLAttributes, type ReactNode } from 'react';
import { useShellScroll } from '../AppShell/scrollContext.js';
import { cx } from '../../styles/cx.js';
import styles from './Screen.module.scss';

export interface ScreenProps extends HTMLAttributes<HTMLElement> {
  /**
   * The view's name, for the landmark. Required: a landmark without a name is a
   * line in a screen reader's landmark list saying "main" and nothing else.
   * Where a `PageHeader` renders the same words as the heading, pass them here
   * too. The heading names the content and the landmark names the region.
   */
  label: string;
  /** The view's own header, typically a `PageHeader`. */
  header?: ReactNode;
  /** Persistent chrome at the foot of the view, typically a `StatusBar`. */
  chrome?: ReactNode;
  children?: ReactNode;
}

export function Screen({
  label, header, chrome, children, className, ...props
}: ScreenProps): React.JSX.Element {
  /* The landmark rule asks whether there is already a main. The shell publishes
     that node itself. */
  const shellOwnsTheMain = useShellScroll() !== null;
  const Region = shellOwnsTheMain ? 'section' : 'main';

  return (
    <Region
      {...props}
      aria-label={label}
      className={cx(styles['screen'], className)}
    >
      {header}
      <div className={cx(styles['content'])}>{children}</div>
      {chrome}
    </Region>
  );
}
