'use client';

/* DashboardShell — header, navigation rail, content grid and status bar.
 *
 * "Landmarks in place: banner, navigation, main, contentinfo. **One main.**"
 *
 * Which is `AppShell`'s contract exactly, so this does not restate it: the shell
 * owns `main` and the two navigations, `banner` comes with whatever is handed to
 * `header`, and `contentinfo` is the shell's footer slot. A block that drew its
 * own landmarks would be the second set on the page.
 *
 * **What a block adds over the shell is the opinion**, and here the opinion is
 * exactly one thing: the content is a grid that reflows. That is the difference
 * between a shell — a primitive with one job — and a dashboard, which is a shell
 * that has decided what goes in it. Everything else is passed through, because a
 * block that intercepted the shell's props would be a second API for the same
 * regions, drifting from the first.
 *
 * The grid reflows by **container** width, not viewport. A dashboard inside a
 * split view or a workspace pane is narrower than the window, and a media query
 * would give it a three-column layout in a 300px pane.
 */
import { type ReactNode } from 'react';
import { AppShell, type AppShellProps } from '../AppShell/AppShell.js';
import { cx } from '../../styles/cx.js';
import styles from './DashboardShell.module.scss';

export interface DashboardShellProps extends AppShellProps {
  /** The tiles, panels and tables of the dashboard. */
  children?: ReactNode;
  /** Names the content grid, so a reader knows what the list of regions is. */
  gridLabel?: string;
}

export function DashboardShell({
  children, gridLabel = 'Dashboard', className, ...props
}: DashboardShellProps): React.JSX.Element {
  return (
    <AppShell {...props} className={className}>
      <div aria-label={gridLabel} role="group" className={cx(styles['grid'])}>
        {children}
      </div>
    </AppShell>
  );
}
