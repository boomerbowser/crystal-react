'use client';

/* SplitView — two resizable regions.
 *
 * States: `at-rest`, `resizing`, `collapsed`, `focus-visible`.
 *
 * Three of those four already exist. `Resizable` is Crystal's separator: React
 * Aria's `useMove` behind a `role="separator"` that carries `aria-valuenow`,
 * `aria-valuemin` and `aria-valuemax`, so it is resizable by keyboard rather
 * than only by pointer, and its 44px target sits around a 4px grip because a
 * few pixels is a picture of a control, not a place to press. None of that is
 * rebuilt here.
 *
 * What this adds is `collapsed`, and the reason it is a component rather than a
 * prop on `Resizable` is what collapsing has to do to the divider. A collapsed
 * split view has one pane; a separator between one region and nothing is a
 * control that announces a value it cannot change, and a keyboard user who
 * lands on it can press arrow keys at it forever. So collapsing removes the
 * divider rather than disabling it — there is nothing to separate — and the
 * remaining pane simply fills the space.
 *
 * Which pane survives is the product's: `collapse="secondary"` keeps the first,
 * which is the common case of a detail pane folding away on a narrow display.
 */
import { type HTMLAttributes, type ReactNode } from 'react';
import { Resizable } from '../Resizable/Resizable.js';
import { cx } from '../../styles/cx.js';
import styles from './SplitView.module.scss';

export interface SplitViewProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** The region that resizes. */
  children: ReactNode;
  /** The region that takes the remaining space. */
  secondary?: ReactNode;
  /**
   * Fold one pane away. The divider goes with it: a separator between one
   * region and nothing announces a value it cannot change.
   */
  collapse?: 'none' | 'primary' | 'secondary';
  size?: number;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  orientation?: 'horizontal' | 'vertical';
  isDisabled?: boolean;
  onSizeChange?: (size: number) => void;
  /** Names the divider — what it resizes. */
  'aria-label'?: string;
}

export function SplitView({
  children, secondary, collapse = 'none', className, ...props
}: SplitViewProps): React.JSX.Element {
  if (collapse !== 'none') {
    /* One pane, no divider. `data-cr-state` so the collapse is legible to a
       gate and to a product's own styling without reading the class hash. */
    return (
      <div
        {...props}
        data-cr-state="collapsed"
        className={cx(styles['collapsed'], className)}
      >
        {collapse === 'secondary' ? children : secondary}
      </div>
    );
  }

  return (
    <Resizable
      {...props}
      data-cr-state="at-rest"
      className={className}
      {...(secondary === undefined ? {} : { secondary })}
    >
      {children}
    </Resizable>
  );
}
