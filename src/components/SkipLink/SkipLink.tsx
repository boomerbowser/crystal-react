'use client';

/* SkipLink.
 *
 * The first focusable element in the document, and the one piece of accessibility
 * furniture a keyboard user meets before anything else. Crystal's catalogue gives
 * it no parity entry in any benchmarked library, which is itself the argument for
 * shipping it: every product rebuilds this badly.
 *
 * Two requirements that are easy to satisfy halfway:
 *
 *   - **The target must be focusable.** Jumping to `#main` moves the browser's
 *     scroll but not always its focus, so the next Tab continues from where it
 *     was — the link appears to do nothing. This sets `tabindex="-1"` on the
 *     target when it needs it, then focuses it, which is the fix.
 *   - **It must be first.** Render it as the first child of the page. Nothing in
 *     code can enforce that, so it is said here and in the story.
 */
import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import styles from './SkipLink.module.scss';

export interface SkipLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  /** The id of the region to jump to, without the hash. */
  targetId: string;
  children?: ReactNode;
}

export const SkipLink = forwardRef<HTMLAnchorElement, SkipLinkProps>(function SkipLink(
  { targetId, className, children = 'Skip to content', onClick, ...props },
  ref,
) {
  return (
    <a
      {...props}
      ref={ref}
      href={`#${targetId}`}
      className={cx(styles['skipLink'], className)}
      onClick={(event) => {
        const target = document.getElementById(targetId);
        if (target) {
          /* A heading or a `main` is not focusable by default, so the hash moves
             the viewport and leaves focus behind. Making it programmatically
             focusable — and no more than that; -1 keeps it out of the tab order —
             is what makes the next Tab continue from the content. */
          if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: false });
        }
        onClick?.(event);
      }}
    >
      {children}
    </a>
  );
});
