'use client';

/* AppBar.
 *
 * A Frost band over the Plastic foundation, full-bleed, with actions as pills.
 *
 * The `scrolled` state is read from a passive scroll listener on whichever
 * element actually scrolls: the content region when there is a surrounding
 * `AppShell`, the window when the bar stands alone. Inside a shell the bar never
 * moves — the content scrolls beneath it — so it cannot tell on its own, and the
 * shell publishes its scrolling region for exactly this.
 *
 * An IntersectionObserver on a sentinel is the more elegant answer and was the
 * first implementation. It is not used because the result could not be verified:
 * in the preview browser this is developed against, IntersectionObserver
 * delivered no callbacks at all — not even the initial one — so the bar sat flat
 * forever and no test could tell that from working. A passive listener reading
 * one boolean is cheap enough that the elegance is not worth an unverifiable
 * mechanism in the one place the whole state depends on it.
 *
 * Whether it is the banner is conditional, because a page has one. A bar at the
 * top of the document is the banner; a bar inside a panel, a dialog or a split
 * view is not, and claiming the role there gives a screen reader two to choose
 * between. Declining it means rendering a `div` rather than setting a role: a
 * `header` outside sectioning content *is* a banner implicitly, so `role` alone
 * would not have taken it away — which the test caught.
 *
 * The title is the page heading or labels one. Given `as="h1"` it *is* the
 * heading; otherwise it is text, and the product's own heading lives below.
 */
import {
  forwardRef, useEffect, useState,
  type ElementType, type HTMLAttributes, type ReactNode,
} from 'react';
import { cx } from '../../styles/cx.js';
import { useShellScroll } from '../AppShell/scrollContext.js';
import styles from './AppBar.module.scss';

/* `title` on an HTML element is the tooltip attribute, and it is a string. The
   bar's title is content, so the DOM one is dropped rather than shadowed — a
   component that accepts both under one name is a component whose title
   sometimes becomes a tooltip. */
export interface AppBarProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  /** Element for the title. `h1` makes it the page heading rather than a label. */
  titleAs?: ElementType;
  /** Rendered at the end of the bar. Actions are pills, like every other action. */
  actions?: ReactNode;
  /** A shorter bar. For a secondary bar, or a primary one once scrolled. */
  isCondensed?: boolean;
  /**
   * Whether this is the page's banner. One per view — a bar inside a panel or a
   * dialog must pass false, or a screen reader has two banners to choose between.
   */
  isBanner?: boolean;
  children?: ReactNode;
}

export const AppBar = forwardRef<HTMLElement, AppBarProps>(function AppBar(
  { title, titleAs: Title = 'p', actions, isCondensed = false, isBanner = true, className, children, ...props },
  ref,
) {
  const [scrolled, setScrolled] = useState(false);
  const shellScroll = useShellScroll();
  /* A `header` outside sectioning content is a banner implicitly, so declining
     the role means declining the element. */
  const Band = (isBanner ? 'header' : 'div') as ElementType;

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const region = shellScroll?.current ?? null;
    const target: HTMLElement | Window = region ?? window;

    const read = () => {
      const top = region ? region.scrollTop : window.scrollY;
      setScrolled(top > 0);
    };
    read();

    target.addEventListener('scroll', read, { passive: true });
    return () => target.removeEventListener('scroll', read);
  }, [shellScroll]);

  return (
    <>
      <Band
        {...props}
        ref={ref}
        data-cr-state={scrolled ? 'scrolled' : 'at-rest'}
        className={cx(
          styles['appBar'],
          scrolled ? styles['scrolled'] : undefined,
          isCondensed ? styles['condensed'] : undefined,
          className,
        )}
      >
        {title !== undefined ? <Title className={cx(styles['title'])}>{title}</Title> : null}
        {children}
        {actions ? <div className={cx(styles['actions'])}>{actions}</div> : null}
      </Band>
    </>
  );
});
