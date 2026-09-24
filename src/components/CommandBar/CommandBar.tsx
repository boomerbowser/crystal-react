'use client';

/* CommandBar — a context-sensitive row of actions for the current view.
 *
 * "`role="toolbar"` with **one tab stop**." "Pill; overflow to a menu."
 * States: `at-rest`, `focus-visible`, `overflowing`.
 *
 * Both halves already exist in this library, and the value of this component is
 * that it is the pair rather than either one.
 *
 * `Toolbar` is React Aria's: the roving tab index, the arrow keys, and the one
 * tab stop the catalogue asks for. A row of eight commands that each took a tab
 * stop would put eight presses between the reader and the next field.
 *
 * `OverflowList` is the measuring row: it lays everything out invisibly, records
 * the widths, and moves what does not fit into an affordance that says how many
 * it holds. The record is why it can grow back — reading the DOM on a second
 * pass can only ever conclude that the items still visible are the ones that
 * fit, so a row measured that way narrows once and never widens.
 *
 * **The two together have one failure mode worth naming.** Items that overflow
 * leave the toolbar and enter a menu, so they leave the roving tab index with
 * it. That is correct — they are in a menu now, reached through its trigger,
 * which is itself in the toolbar — but it means the overflow trigger has to be
 * a real toolbar item rather than something floating beside the row. It is
 * rendered inside the same list for exactly that reason.
 *
 * Resin is the material, because a command bar is a control plane floating above
 * the view rather than a band of it. `variant="inherit"` is for a bar inside a
 * surface that already carries a material: Resin never contains Resin.
 */
import { type ReactNode } from 'react';
import { Toolbar } from '../Toolbar/Toolbar.js';
import { OverflowList } from '../OverflowList/OverflowList.js';
import { cx } from '../../styles/cx.js';
import type { CrystalSpacing } from '../../styles/spacing.js';
import styles from './CommandBar.module.scss';

export interface CommandBarProps {
  /** The commands, **most important first** — the last to fit is the first to go. */
  children: ReactNode;
  /**
   * Renders the overflow affordance, given the commands that did not fit and
   * how many there are. Crystal owns that the affordance exists and names its
   * count; what it opens is the product's.
   */
  renderOverflow: (hidden: readonly ReactNode[], count: number) => ReactNode;
  /** Names the toolbar. Required where a view has more than one. */
  'aria-label'?: string;
  /** `inherit` for a bar inside a surface that already carries a material. */
  variant?: 'resin' | 'inherit';
  orientation?: 'horizontal' | 'vertical';
  gap?: CrystalSpacing;
  className?: string;
}

export function CommandBar({
  children, renderOverflow, variant = 'resin', className, gap, ...props
}: CommandBarProps): React.JSX.Element {
  return (
    <Toolbar {...props} variant={variant} className={cx(styles['bar'], className)}>
      <OverflowList
        renderOverflow={renderOverflow}
        className={cx(styles['row'])}
        {...(gap === undefined ? {} : { gap })}
      >
        {children}
      </OverflowList>
    </Toolbar>
  );
}
