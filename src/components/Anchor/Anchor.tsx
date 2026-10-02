'use client';

/* Anchor: a link in running text.
 *
 * `href` is required, and that is the component's one opinion. The catalogue
 * states it as a rule: "Native anchor with an href. A link that acts is a button,
 * not a link." React Aria's `Link` will happily render a `<span role="link">`
 * when given none, and the result is a control that announces as a link, does not
 * appear in the browser's link list, cannot be opened in a new tab, and has no
 * destination to show in the status bar. A control that acts is a `Button`. The
 * type here refuses the other shape rather than documenting against it.
 *
 * The underline is not decoration. It is the second, non-chromatic signal
 * that distinguishes a link from the text around it (WCAG 1.4.1), so it is
 * present at rest and not only on hover. Crystal offsets it so descenders are not
 * struck through.
 *
 * Routing goes through `RouterProvider` when the application has one, so a link
 * inside running prose does not reload a single-page application.
 */
import type { ReactNode } from 'react';
import { Link, type LinkProps } from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import styles from './Anchor.module.scss';

const ExternalIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M14 4h6v6" />
    <path d="M20 4l-8 8" />
    <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </svg>
);

export interface AnchorProps extends Omit<LinkProps, 'className' | 'style' | 'children' | 'href'> {
  /** Where it goes. Required: a control with no destination is a `Button`. */
  href: string;
  children: ReactNode;
  /**
   * Opens in a new tab, and says so.
   *
   * The disclosure is not optional when this is set. Opening a new tab is a
   * change of context the reader did not ask for (WCAG 3.2.5), and a reader
   * using a screen reader or a magnifier is the one most likely to be lost by
   * it. The icon is decorative; the announcement is text.
   */
  isExternal?: boolean;
  className?: string;
}

export function Anchor({
  href, children, isExternal = false, className, ...props
}: AnchorProps): React.JSX.Element {
  return (
    <Link
      {...props}
      href={href}
      /* `noopener` stops the opened page reaching back through `window.opener`;
         `noreferrer` is the belt to that braces in older engines, which ignore
         `noopener` on a target of `_blank`. */
      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={cx(styles['anchor'], className)}
    >
      {children}
      {isExternal ? (
        <>
          <span className={cx(styles['external'])} aria-hidden="true">{ExternalIcon}</span>
          <VisuallyHidden as="span">(opens in a new tab)</VisuallyHidden>
        </>
      ) : null}
    </Link>
  );
}
