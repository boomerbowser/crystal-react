'use client';

/* AppShell.
 *
 * The material assignment of a whole view: Plastic underneath, Frost for the
 * supporting panels, Resin for the floating destination group. That ordering is
 * Crystal's hierarchy applied at the largest scale. Getting it wrong is the most
 * visible way a product stops looking like Crystal: a Resin sidebar and a Frost
 * dock inverts the hierarchy.
 *
 * What it owns, from the catalogue: the material per region, the elevation
 * ordering, and the safe-area handling that a hand-written grid usually misses.
 * A sidebar pinned to the left of a phone in landscape sits under the notch
 * without it.
 *
 * What it does not own: routing, which regions exist, and whether the collapsed
 * state persists. Those belong to the product.
 *
 * It also owns the landmarks: `banner`, `navigation`, `main` and `contentinfo`,
 * with one main per view. That is why the regions are props and not children a
 * caller arranges. Given children, two products in three end up with two mains
 * or none.
 *
 * Two of those four are drawn by this component itself. `main` is this
 * component's, because there must be exactly one and only a shell can promise
 * that. `navigation` is this component's, twice, because the sidebar and the
 * destination group are its own regions. `banner` belongs to whatever is handed
 * to `header`. An `AppBar` carries it itself, and a shell that wrapped it would
 * produce two. `contentinfo` is the `footer` slot: a band beneath the content
 * for things that are about the view and not in it, which is where a `StatusBar`
 * goes.
 *
 * The content scrolls, not the page. A sticky header does not hold inside a grid
 * whose header row is exactly as tall as the header, because a sticky element
 * sticks within its containing block and that block leaves it no room. Both
 * scrolling regions take Crystal's Frost scrollbar and the scroll contract that
 * comes with it.
 */
import { forwardRef, useRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import { useScrollTabStop } from '../ScrollArea/useScrollTabStop.js';
import { ShellScrollContext } from './scrollContext.js';
import styles from './AppShell.module.scss';

export interface AppShellProps extends HTMLAttributes<HTMLDivElement> {
  /** The top band. Usually an `AppBar`, which carries the banner role itself. */
  header?: ReactNode;
  /** The supporting panel. Rendered as `navigation`, and hidden below the md breakpoint. */
  sidebar?: ReactNode;
  /** Accessible name for the sidebar. Two navigations on a page need telling apart. */
  sidebarLabel?: string;
  /** Whether the sidebar is collapsed. The product owns whether that persists. */
  isCollapsed?: boolean;
  /** Width of the sidebar. A CSS length. */
  sidebarWidth?: string;
  /**
   * The band beneath the content, rendered as the `contentinfo` landmark.
   * Usually a `StatusBar`. It is a landmark and not a plain row because it holds
   * what is true of the view, which a reader jumping by landmark looks for.
   */
  footer?: ReactNode;
  /** The floating Resin destination group, above the content instead of beside it. */
  destinations?: ReactNode;
  /** Accessible name for the destination group. */
  destinationsLabel?: string;
  /** The view. Rendered as the one `main`. */
  children?: ReactNode;
}

export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(function AppShell(
  {
    header, sidebar, sidebarLabel = 'Sections', isCollapsed = false, sidebarWidth, footer,
    destinations, destinationsLabel = 'Destinations', className, style, children, ...props
  },
  ref,
) {
  const layout: CSSProperties = {
    ...(sidebarWidth ? { '--cr-shell-sidebar': sidebarWidth } as CSSProperties : {}),
    ...style,
  };
  /* Published so an `AppBar` in the header slot can tell when the content has
     scrolled past it. The bar never moves here, so it cannot tell on its own. */
  const main = useRef<HTMLElement | null>(null);
  const mainNeedsTabStop = useScrollTabStop(main);

  return (
    <ShellScrollContext.Provider value={main}>
    <div
      {...props}
      ref={ref}
      data-cr-state={isCollapsed ? 'collapsed' : 'expanded'}
      className={cx(styles['appShell'], 'cr-plastic', isCollapsed ? styles['collapsed'] : undefined, className)}
      style={layout}
    >
      {header ? <div className={cx(styles['header'])}>{header}</div> : null}
      {sidebar ? (
        <nav aria-label={sidebarLabel} className={cx(styles['sidebar'], 'cr-scroll-frost')} hidden={isCollapsed}>
          {sidebar}
        </nav>
      ) : null}
      {/* `tabIndex` when the content scrolls and holds nothing focusable, so a
          keyboard can scroll it. A `<main>` is a landmark, so it cannot be a
          `ScrollArea`, which renders a div. It uses the same hook as
          `ScrollArea` to apply the same reachability rule. */}
      <main
        ref={main}
        className={cx(styles['main'], 'cr-scroll-frost')}
        {...(mainNeedsTabStop ? { tabIndex: 0 } : {})}
      >
        {children}
      </main>
      {footer ? <footer className={cx(styles['footer'])}>{footer}</footer> : null}
      {destinations ? (
        /* Resin, and floating: the one surface in the shell that is above the
           content instead of beside it. */
        <nav aria-label={destinationsLabel} className={cx(styles['destinations'], 'cr-dock')}>
          {destinations}
        </nav>
      ) : null}
    </div>
    </ShellScrollContext.Provider>
  );
});
