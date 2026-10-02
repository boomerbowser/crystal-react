'use client';

/* RecentlyViewed: a strip that scrolls itself.
 *
 * "A labelled list; the strip is keyboard scrollable" and it "scrolls within its
 * own container; never the page".
 *
 * A horizontal strip built as an overflowing row inside a container with no
 * `overflow` set does not scroll. It makes the page wide, and a reader on a
 * phone finds a horizontal scrollbar under the whole document. The scrolling
 * belongs to a `ScrollArea`, which also owns the edge fade,
 * `overscroll-behavior: contain`, and Crystal's rule that a scrollbar is tinted
 * like the material it scrolls.
 *
 * The scrollbar is Resin. Crystal's scroll contract puts Frost on panels and
 * reading surfaces, and Resin on control planes and compact or horizontal
 * scrollers. This strip is horizontal.
 *
 * It is a labelled list. List semantics let a reader count the cards, and the
 * label distinguishes "recently viewed" from the other strips on a storefront.
 *
 * Empty renders nothing. An empty strip would be a heading over nothing,
 * telling a first-time reader about a feature they have not used.
 */
import { Children, forwardRef, isValidElement, type HTMLAttributes, type ReactNode } from 'react';
import { ScrollArea } from '../ScrollArea/ScrollArea.js';
import { cx } from '../../styles/cx.js';
import { ListPresence, PresenceItem } from '../../motion/ListPresence.js';
import styles from './RecentlyViewed.module.scss';

export interface RecentlyViewedProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** What the strip is. Its accessible name, and usually its heading. */
  label: string;
  /** Shown above the strip. Leave out for a label that is only announced. */
  heading?: ReactNode;
  /** One per item, usually a `ProductCard`. */
  children: ReactNode;
  /** How many there are. Absent means "count the children yourself". */
  count?: number;
  /** Rendered instead of the strip when there is nothing. Nothing by default. */
  empty?: ReactNode;
}

export const RecentlyViewed = forwardRef<HTMLElement, RecentlyViewedProps>(
  function RecentlyViewed({ label, heading, children, count, empty, className, ...props }, ref) {
    const items = count ?? (Array.isArray(children) ? children.length : undefined);

    /* Nothing at all, rather than a heading over an empty strip. */
    if (items === 0) {
      return empty === undefined ? <></> : (
        <section {...props} ref={ref} aria-label={label} className={cx(styles['strip'], className)}>
          {heading ? <h2 className={styles['heading']}>{heading}</h2> : null}
          <p className={styles['empty']}>{empty}</p>
        </section>
      );
    }

    return (
      <section {...props} ref={ref} aria-label={label} className={cx(styles['strip'], className)}>
        {heading ? <h2 className={styles['heading']}>{heading}</h2> : null}
        {/* Resin, because Crystal's scroll contract gives Resin to compact and
            horizontal scrollers and Frost to panels and reading surfaces. */}
        <ScrollArea axis="x" variant="resin" className={cx(styles['scroller'])}>
          <ul className={styles['row']}>
            {/* Keyed by the caller's own keys, so an item viewed just now arrives
                with `list-in` at the front, and the other items do not each
                shift a slot and make the last one look new. */}
            <ListPresence>
              {Children.toArray(children).map((one) => (
                <PresenceItem key={isValidElement(one) ? one.key : String(one)} leaves={false} className={styles['cell']}>
                  {one}
                </PresenceItem>
              ))}
            </ListPresence>
          </ul>
        </ScrollArea>
      </section>
    );
  },
);
