'use client';

/* AspectRatio. */
import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import styles from './AspectRatio.module.scss';

export interface AspectRatioProps extends HTMLAttributes<HTMLDivElement> {
  /** Width over height. Accepts a number (1.777…) or a CSS ratio ('16 / 9'). Defaults to 16 / 9. */
  ratio?: number | string;
  /** Clip the content to the box, with Crystal's content radius. */
  clip?: boolean;
  children?: ReactNode;
}

export const AspectRatio = forwardRef<HTMLDivElement, AspectRatioProps>(function AspectRatio(
  { ratio, clip = false, className, style, children, ...props },
  ref,
) {
  const box: CSSProperties = ratio !== undefined
    ? { '--cr-aspect': String(ratio) } as CSSProperties
    : {};

  return (
    <div
      {...props}
      ref={ref}
      className={cx(styles['aspectRatio'], clip ? styles['clip'] : undefined, className)}
      style={{ ...box, ...style }}
    >
      {children}
    </div>
  );
});
