'use client';

/* AppBar.
 *
 * A Frost band over the Plastic foundation, full-bleed, with actions as pills.
 *
 * The `scrolled` state is read from a passive scroll listener on whichever
 * element scrolls: the content region inside an `AppShell`, the window when the
 * bar stands alone. Inside a shell the bar never moves, because the content
 * scrolls beneath it, so the shell publishes its scrolling region for the bar
 * to listen to.
 *
 * An IntersectionObserver on a sentinel is not used. In the preview browser this
 * is developed against, IntersectionObserver delivers no callbacks, not even the
 * initial one, so a bar driven by it stays flat and no test can tell that from
 * working. A passive listener reading one boolean is cheap and verifiable.
 *
 * The banner role is conditional, because a page has one. A bar at the top of
 * the document is the banner. A bar inside a panel, a dialog or a split view is
 * not, and claiming the role there gives a screen reader two to choose between.
 * Declining it means rendering a `div`. A `header` outside sectioning content is
 * a banner implicitly, so setting `role` alone does not remove it.
 *
 * The title is the page heading or labels one. Given `as="h1"` it is the
 * heading. Otherwise it is text, and the product's own heading lives below.
 */
import {
  forwardRef,
  type ElementType, type HTMLAttributes, type ReactNode,
} from 'react';
import { cx } from '../../styles/cx.js';
import { useScrolledPast } from '../AppShell/useScrolledPast.js';
import styles from './AppBar.module.scss';

/* `title` on an HTML element is the tooltip attribute, and it is a string. The
   bar's title is content, so the DOM attribute is omitted from the props. If
   both were accepted under one name, the title would sometimes become a
   tooltip. */
export interface AppBarProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  /** Element for the title. `h1` makes it the page heading rather than a label. */
  titleAs?: ElementType;
  /** Rendered at the end of the bar. Actions are pills, like every other action. */
  actions?: ReactNode;
  /** A shorter bar. For a secondary bar, or a primary one once scrolled. */
  isCondensed?: boolean;
  /**
   * Whether this is the page's banner. One per view. A bar inside a panel or a
   * dialog must pass false, or a screen reader has two banners to choose between.
   */
  isBanner?: boolean;
  children?: ReactNode;
}

export const AppBar = forwardRef<HTMLElement, AppBarProps>(function AppBar(
  { title, titleAs: Title = 'p', actions, isCondensed = false, isBanner = true, className, children, ...props },
  ref,
) {
  const scrolled = useScrolledPast();
  /* A `header` outside sectioning content is a banner implicitly, so declining
     the role means declining the element. */
  const Band = (isBanner ? 'header' : 'div') as ElementType;

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
