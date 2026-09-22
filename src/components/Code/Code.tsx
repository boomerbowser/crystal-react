'use client';

/* Code — inline or block monospace content.
 *
 * "Never feathered, as code must stay exact." That single clause is why Code is
 * the one surface in this slice that is not a Crystal material: Haze feathers its
 * own paint layer, and even with crisp text above it the softened edge around a
 * fragment of syntax reads as imprecision in the thing being quoted. So Code
 * takes a canvas fill and an edge rim, which is the flattest thing Crystal has.
 *
 * Where this stops, and `CodeBlock` starts: a block here is the typographic
 * primitive — a scrollable, keyboard-reachable `pre` and nothing else. `CodeBlock`
 * is the documented sample, with a filename, a named region and a copy control in
 * a header. `copyable` covers the catalogue's `with-copy` state for a bare block
 * without growing that chrome; if the sample deserves a title, it deserves
 * `CodeBlock`.
 */
import { forwardRef, type HTMLAttributes, type ReactNode, type Ref } from 'react';
import { cx } from '../../styles/cx.js';
import { CopyButton } from '../CopyButton/CopyButton.js';
import styles from './Code.module.scss';

export interface CodeProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** The code. A string when it is to be copied, so there is one thing to copy. */
  children: ReactNode;
  /** Render as a block rather than inside a line of prose. */
  block?: boolean;
  /** Offer a copy control. Blocks only — an inline fragment has nowhere to put it. */
  copyable?: boolean;
  /** What the copy control says, naming what it copies. */
  copyLabel?: string;
}

export const Code = forwardRef<HTMLElement, CodeProps>(function Code(
  { children, block = false, copyable = false, copyLabel = 'Copy the code', className, ...props },
  ref,
) {
  if (!block) {
    return (
      <code {...props} ref={ref} className={cx(styles['code'], styles['inline'], className)}>
        {children}
      </code>
    );
  }

  /* A tab stop, because a block wider than its column scrolls and a scroll
     container with nothing focusable in it cannot be reached without a pointer.
     The scrollbar is Resin: a compact horizontal scroller is a control plane. */
  const pre = (
    <pre
      {...props}
      ref={ref as Ref<HTMLPreElement>}
      tabIndex={0}
      className={cx(styles['code'], styles['block'], 'cr-scroll-resin', copyable ? undefined : className)}
    >
      <code>{children}</code>
    </pre>
  );

  if (!copyable) return pre;

  return (
    <div className={cx(styles['withCopy'], className)}>
      {pre}
      <span className={styles['copy']}>
        <CopyButton value={typeof children === 'string' ? children : ''} label={copyLabel} />
      </span>
    </div>
  );
});
