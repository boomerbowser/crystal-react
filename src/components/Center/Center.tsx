'use client';

/* Center. Presentational and kept small. */
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import styles from './Center.module.scss';

export interface CenterProps extends HTMLAttributes<HTMLDivElement> {
  /** Stay in the text flow rather than taking the full width. */
  inline?: boolean;
  children?: ReactNode;
}

export const Center = forwardRef<HTMLDivElement, CenterProps>(function Center(
  { inline = false, className, children, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      className={cx(styles['center'], inline ? styles['inline'] : undefined, className)}
    >
      {children}
    </div>
  );
});
