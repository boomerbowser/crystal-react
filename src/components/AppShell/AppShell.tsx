'use client';

/* AppShell.
 *
 * The material assignment of a whole view: Plastic underneath, Frost for the
 * supporting panels, Resin for the floating destination group. That ordering is
 * Crystal's hierarchy applied at the largest scale, and getting it wrong is the
 * most visible way a product stops looking like Crystal — a Resin sidebar and a
 * Frost dock is the same system rendered upside down.
 *
 * What it owns, from the catalogue: the material per region, the elevation
 * ordering, and the safe-area handling that a grid written by hand almost always
 * forgets — a sidebar pinned to the left of a phone in landscape sits under the
 * notch without it.
 *
 * What it does not own: routing, which regions exist, and whether the collapsed
 * state persists. Those are the product's, and a shell that decides them decides
 * too much.
 *
 * The landmarks are the other half. `banner`, `navigation`, `main` and
 * `contentinfo`, with **one main per view** — which is why the regions are props
 * rather than children a caller arranges: given children, two products in three
 * end up with two mains or none.
 *
 * The content scrolls, not the page. A sticky header does not hold inside a grid
 * whose header row is exactly as tall as the header — a sticky element sticks
 * within its containing block, and there is no room in one that fits it exactly.
 * Making the content the scroller is the fix and is the usual shape of an
 * application anyway; both scrolling regions take Crystal's Frost scrollbar and
 * the scroll contract that comes with it.
 */
import { forwardRef, useRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
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
  /** The floating Resin destination group, above the content rather than beside it. */
  destinations?: ReactNode;
  /** Accessible name for the destination group. */
  destinationsLabel?: string;
  /** The view. Rendered as the one `main`. */
  children?: ReactNode;
}

export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(function AppShell(
  {
    header, sidebar, sidebarLabel = 'Sections', isCollapsed = false, sidebarWidth,
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

  return (
    <ShellScrollContext.Provider value={main}>
    <div
      {...props}
      ref={ref}
      data-cr-state={isCollapsed ? 'collapsed' : 'expanded'}
      className={cx(styles['appShell'], isCollapsed ? styles['collapsed'] : undefined, className)}
      style={layout}
    >
      {header ? <div className={cx(styles['header'])}>{header}</div> : null}
      {sidebar ? (
        <nav aria-label={sidebarLabel} className={cx(styles['sidebar'], 'cr-scroll-frost')} hidden={isCollapsed}>
          {sidebar}
        </nav>
      ) : null}
      <main ref={main} className={cx(styles['main'], 'cr-scroll-frost')}>{children}</main>
      {destinations ? (
        /* Resin, and floating: the one surface in the shell that is above the
           content rather than beside it. */
        <nav aria-label={destinationsLabel} className={cx(styles['destinations'])}>
          {destinations}
        </nav>
      ) : null}
    </div>
    </ShellScrollContext.Provider>
  );
});
