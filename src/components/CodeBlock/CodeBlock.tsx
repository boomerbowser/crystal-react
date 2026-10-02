'use client';

/* CodeBlock.
 *
 * The catalogue sets three requirements, none of which a plain `<pre>` meets:
 *
 *   - Focusable and scrollable by keyboard. A code sample wider than its column
 *     scrolls, and a scroll container with nothing focusable inside it is
 *     unreachable without a pointer. This is the same rule `ScrollArea` follows,
 *     and it takes a Resin scrollbar because a compact horizontal scroller is a
 *     control plane.
 *   - The language is announced. The block is a named region, so a screen
 *     reader says what it is before reading it. Arriving in an unlabelled wall
 *     of punctuation is disorienting.
 *   - The copy button says what it copied. "Copied" alone refers to something
 *     the reader cannot see, so the control names it.
 */
import { forwardRef, useId, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import { CopyButton } from '../CopyButton/CopyButton.js';
import styles from './CodeBlock.module.scss';

export interface CodeBlockProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The code. A string, so it can be copied and announced as one thing. */
  children: string;
  /** What language it is. Announced, and shown. */
  language?: string;
  /** A name for the sample, usually a filename. */
  label?: ReactNode;
  /** Offer a copy control. On by default. */
  copyable?: boolean;
}

export const CodeBlock = forwardRef<HTMLDivElement, CodeBlockProps>(function CodeBlock(
  { children, language, label, copyable = true, className, ...props },
  ref,
) {
  const labelId = useId();
  const described = label ?? (language ? `${language} code` : 'Code sample');

  return (
    <div {...props} ref={ref} className={cx(styles['codeBlock'], className)}>
      <div className={cx(styles['head'])}>
        <span id={labelId}>{described}</span>
        {copyable ? <CopyButton value={children} label={`Copy the ${language ?? 'code'} sample`} /> : null}
      </div>
      {/* A tab stop so the sample can be scrolled from the keyboard, and a named
          region so arriving in it says what it is. The scrollbar is Resin because
          a compact horizontal scroller is a control plane. */}
      <pre
        tabIndex={0}
        role="region"
        aria-labelledby={labelId}
        className={cx(styles['pre'], 'cr-scroll-resin')}
      >
        <code>{children}</code>
      </pre>
    </div>
  );
});
