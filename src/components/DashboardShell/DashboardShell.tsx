'use client';

/* DashboardShell: header, navigation rail, content grid and status bar.
 *
 * "Landmarks in place: banner, navigation, main, contentinfo. One main."
 *
 * That is `AppShell`'s contract, so this does not restate it. The shell owns
 * `main` and the two navigations, `banner` comes with whatever is handed to
 * `header`, and `contentinfo` is the shell's footer slot. A block that drew its
 * own landmarks would put a second set on the page.
 *
 * The block adds one thing to the shell: the content is a grid that reflows.
 * A shell is a primitive with one job, and a dashboard is a shell that has
 * decided what goes in it. Everything else is passed through, because a block
 * that intercepted the shell's props would be a second API for the same
 * regions, and the two would drift apart.
 *
 * The grid reflows by container width, not viewport width. A dashboard inside
 * a split view or a workspace pane is narrower than the window, and a media
 * query would give it a three-column layout in a 300px pane.
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
