'use client';

/* CodeBlock.
 *
 * Three requirements from the catalogue, and each is a thing a plain `<pre>` does
 * not do:
 *
 *   - **Focusable and scrollable by keyboard.** A code sample wider than its
 *     column scrolls, and a scroll container with nothing focusable inside it is
 *     unreachable without a pointer. This is the same rule `ScrollArea` follows,
 *     and it takes a Resin scrollbar because a compact horizontal scroller is a
 *     control plane.
 *   - **The language is announced.** Not as decoration in a corner: the block is
 *     a named region, so a screen reader says what it is before reading it.
 *     Arriving in an unlabelled wall of punctuation is disorienting.
 *   - **The copy button says what it copied.** "Copied" alone is a claim about
 *     something the reader cannot see; naming it is the difference between
 *     feedback and noise.
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
  /** A name for the sample — a filename, usually. */
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
          region so arriving in it says what it is. The Resin scrollbar because a
          compact horizontal scroller is a control plane. */}
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
