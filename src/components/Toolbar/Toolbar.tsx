'use client';

/* Toolbar.
 *
 * One tab stop for a group of controls, with arrows moving between them. That is
 * the entire point and it is an accessibility decision rather than a layout one:
 * a formatting bar of fifteen buttons is fifteen tab stops between a person and
 * the next field, and `role="toolbar"` collapses them to one.
 *
 * React Aria's `Toolbar` owns the roving tab index, the arrow keys, and the
 * orientation handling — including the part that is easy to get wrong, which is
 * that a vertical toolbar uses up and down and a horizontal one uses left and
 * right, mirrored in right-to-left. Crystal owns the material and the geometry.
 *
 * A toolbar that floats above content is a Resin plane; one inside a surface that
 * already has a material inherits it, because Resin never contains Resin.
 */
import { forwardRef, type ReactNode } from 'react';
import { Toolbar as AriaToolbar, type ToolbarProps as AriaToolbarProps } from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import styles from './Toolbar.module.scss';

export interface ToolbarProps extends Omit<AriaToolbarProps, 'className' | 'children' | 'style'> {
  /**
   * `resin` floats the toolbar as its own control plane. `inherit` is for a
   * toolbar inside a surface that already carries a material — Resin never
   * contains Resin.
   */
  variant?: 'resin' | 'inherit';
  /** Accessible name. A toolbar with several on a page needs one to be told apart. */
  'aria-label'?: string;
  className?: string;
  children?: ReactNode;
}

export const Toolbar = forwardRef<HTMLDivElement, ToolbarProps>(function Toolbar(
  { variant = 'inherit', orientation = 'horizontal', className, children, ...props },
  ref,
) {
  return (
    <AriaToolbar
      {...props}
      ref={ref}
      orientation={orientation}
      className={cx(
        styles['toolbar'],
        orientation === 'vertical' ? styles['vertical'] : undefined,
        variant === 'resin' ? styles['resin'] : undefined,
        className,
      )}
    >
      {children}
    </AriaToolbar>
  );
});
