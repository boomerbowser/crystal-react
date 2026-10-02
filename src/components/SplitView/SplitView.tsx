'use client';

/* SplitView.
 *
 * Two resizable regions.
 *
 * States: `at-rest`, `resizing`, `collapsed`, `focus-visible`.
 *
 * Three of those four already exist. `Resizable` is Crystal's separator: React
 * Aria's `useMove` behind a `role="separator"` that carries `aria-valuenow`,
 * `aria-valuemin` and `aria-valuemax`, so it is resizable by keyboard as well as
 * by pointer. Its 44px target sits around a 4px grip, because a few pixels is
 * too small to press. None of that is rebuilt here.
 *
 * This component adds `collapsed`. It is a component and not a prop on
 * `Resizable` because of what collapsing has to do to the divider. A collapsed
 * split view has one pane. A separator between one region and nothing announces
 * a value it cannot change, and a keyboard user who lands on it can press arrow
 * keys at it forever. So collapsing removes the divider instead of disabling it,
 * and the remaining pane fills the space.
 *
 * Which pane survives is the product's choice. `collapse="secondary"` keeps the
 * first, which is the common case of a detail pane folding away on a narrow
 * display.
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
   * Fold one pane away. The divider goes with it, because a separator between
   * one region and nothing announces a value it cannot change.
   */
  collapse?: 'none' | 'primary' | 'secondary';
  size?: number;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  orientation?: 'horizontal' | 'vertical';
  isDisabled?: boolean;
  onSizeChange?: (size: number) => void;
  /** Names the divider by what it resizes. */
  'aria-label'?: string;
}

export function SplitView({
  children, secondary, collapse = 'none', className,
  /* Named so they can be withheld from the collapsed branch. They are
     `Resizable`'s vocabulary, and React puts an unrecognised prop straight onto
     the DOM node. A collapsed split view spreading them renders
     `<div minsize="200" orientation="horizontal">`, which is invalid markup, a
     console warning in development, and silent in production. */
  size, defaultSize, minSize, maxSize, orientation, isDisabled, onSizeChange,
  ...props
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
      {...(size === undefined ? {} : { size })}
      {...(defaultSize === undefined ? {} : { defaultSize })}
      {...(minSize === undefined ? {} : { minSize })}
      {...(maxSize === undefined ? {} : { maxSize })}
      {...(orientation === undefined ? {} : { orientation })}
      {...(isDisabled === undefined ? {} : { isDisabled })}
      {...(onSizeChange === undefined ? {} : { onSizeChange })}
    >
      {children}
    </Resizable>
  );
}
