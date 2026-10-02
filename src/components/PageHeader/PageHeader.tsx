'use client';

/* PageHeader: title, description, breadcrumbs and page actions.
 *
 * "Contains the h1; breadcrumbs are a navigation landmark." States:
 * `at-rest`, `condensed`.
 *
 * Three components bear on the h1. `Screen` says "the heading is the view
 * name", `Result` takes a `headingLevel`, and this says it contains the h1.
 * Read together, the rule is: the page header owns it when there is one, the
 * screen never draws a heading, and the state screens take level 1 only
 * because they have replaced the view and there is no header left. `titleAs`
 * steps down to `h2` for the one arrangement where a product nests a header
 * inside a view that already has one. The default is the h1 the catalogue asks
 * for.
 *
 * Breadcrumbs are a landmark, and `Breadcrumbs` already renders the `<nav>` with
 * its label. Wrapping them in another would put two navigation landmarks around
 * one list, so the slot takes the component and adds nothing.
 *
 * Condensing makes the header take less room and removes nothing the reader
 * needs. On scroll the band tightens and the description goes. The title, the
 * breadcrumbs and the actions stay. A header that dropped its actions once the
 * reader scrolled would remove the controls at the moment they went looking for
 * them. The description is the one part that orients and does not navigate,
 * and a reader who has scrolled is already oriented.
 *
 * The scroll signal is `useScrolledPast`, shared with `AppBar`. Inside an
 * `AppShell` the window never scrolls, and a second copy of that rule could
 * drift into a header that condenses in a shell and not on a page.
 */
import { type HTMLAttributes, type ReactNode } from 'react';
import { useScrolledPast } from '../AppShell/useScrolledPast.js';
import { cx } from '../../styles/cx.js';
import styles from './PageHeader.module.scss';

export interface PageHeaderProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** The view's name. This is the page's heading. */
  title: ReactNode;
  /**
   * Which heading level. `h1` by default, because the catalogue says this
   * contains it. Step down only where the view already has one above.
   */
  titleAs?: 'h1' | 'h2' | 'h3';
  /** What the view is for. Hidden when condensed, as the note above explains. */
  description?: ReactNode;
  /** A `Breadcrumbs`, which brings its own navigation landmark. */
  breadcrumbs?: ReactNode;
  /** The page's actions. They are pills because they are Crystal actions. */
  actions?: ReactNode;
  /**
   * Condense regardless of scrolling. Left alone, the header condenses once the
   * view has been scrolled away from its top.
   */
  isCondensed?: boolean;
  /** Drop the Frost band and inherit the surrounding material. */
  isPlain?: boolean;
  children?: ReactNode;
}

export function PageHeader({
  title, titleAs: Title = 'h1', description, breadcrumbs, actions,
  isCondensed, isPlain = false, children, className, ...props
}: PageHeaderProps): React.JSX.Element {
  const scrolled = useScrolledPast();
  const condensed = isCondensed ?? scrolled;

  return (
    <header
      {...props}
      data-cr-state={condensed ? 'condensed' : 'at-rest'}
      className={cx(
        styles['header'],
        isPlain ? undefined : styles['banded'],
        condensed ? styles['condensed'] : undefined,
        className,
      )}
    >
      {breadcrumbs}
      <div className={cx(styles['top'])}>
        <div>
          <Title className={cx(styles['title'])}>{title}</Title>
          {description === undefined ? null : (
            <p className={cx(styles['description'])}>{description}</p>
          )}
        </div>
        {actions ? <div className={cx(styles['actions'])}>{actions}</div> : null}
      </div>
      {children}
    </header>
  );
}
