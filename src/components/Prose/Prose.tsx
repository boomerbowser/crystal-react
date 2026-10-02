'use client';

/* Prose, Blockquote and Abbr.
 *
 * `Prose` is the reading rhythm applied to content the product did not lay out:
 * rendered Markdown, a CMS body, anything arriving as HTML. It is a wrapper whose
 * stylesheet reaches its descendants. This is the one place in this library where
 * that is allowed, because otherwise a content author would have to know Crystal.
 *
 * `Blockquote` and `Abbr` exist as components as well, for quotations and
 * abbreviations a product composes itself. Both are thin, and each is here for
 * one semantic detail that is easy to get wrong:
 *
 *   - A quotation's attribution is a `cite`, and `cite` names a work rather
 *     than a person. So the attribution reads "Name, Work" with only the work
 *     marked up, and the whole thing lives inside the `blockquote` so the two are
 *     associated.
 *   - An abbreviation must be focusable. `abbr[title]` shows its expansion on
 *     hover, which is no use without a pointer. A tab stop makes the expansion
 *     reachable, and the catalogue asks for it explicitly.
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import styles from './Prose.module.scss';

export interface ProseProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export const Prose = forwardRef<HTMLDivElement, ProseProps>(function Prose(
  { className, children, ...props },
  ref,
) {
  return (
    <div {...props} ref={ref} className={cx(styles['prose'], className)}>
      {children}
    </div>
  );
});

export interface BlockquoteProps extends HTMLAttributes<HTMLQuoteElement> {
  /** Who said it. Plain text, outside the `cite`. */
  attribution?: ReactNode;
  /** The work it came from. Marked up as `cite`, which names a work, not a person. */
  source?: ReactNode;
  /** A URL for the source, which `blockquote` carries as `cite`. */
  sourceUrl?: string;
  children?: ReactNode;
}

export const Blockquote = forwardRef<HTMLQuoteElement, BlockquoteProps>(function Blockquote(
  { attribution, source, sourceUrl, className, children, ...props },
  ref,
) {
  return (
    <blockquote
      {...props}
      ref={ref}
      {...(sourceUrl ? { cite: sourceUrl } : {})}
      /* Not `.prose`: that stylesheet's quotation rule is a descendant selector,
         and this component is the quotation rather than something inside one. */
      className={cx(styles['blockquote'], className)}
    >
      {children}
      {attribution || source ? (
        <cite>
          {attribution}
          {attribution && source ? ', ' : null}
          {source}
        </cite>
      ) : null}
    </blockquote>
  );
});

export interface AbbrProps extends HTMLAttributes<HTMLElement> {
  /** What it stands for. Shown on hover and on focus, and announced. */
  expansion: string;
  children?: ReactNode;
}

export const Abbr = forwardRef<HTMLElement, AbbrProps>(function Abbr(
  { expansion, className, children, ...props },
  ref,
) {
  return (
    /* A tab stop, because the expansion is otherwise only reachable with a
       pointer. The catalogue names this as the requirement. */
    <abbr {...props} ref={ref} title={expansion} tabIndex={0} className={className}>
      {children}
    </abbr>
  );
});
