'use client';

/* RecentlyViewed — a strip that scrolls itself.
 *
 * "A labelled list; **the strip is keyboard scrollable**" and it "scrolls within
 * its own container; **never the page**".
 *
 * The second is the one that gets broken. A horizontal strip built as an
 * overflowing row inside a container with no `overflow` set does not scroll — it
 * makes the *page* wide, and a reader on a phone discovers a horizontal
 * scrollbar under the whole document and a layout that will not sit still. So
 * the scrolling belongs to a `ScrollArea`, which owns it along with the edge
 * fade, `overscroll-behavior: contain`, and Crystal's rule that a scrollbar is
 * tinted like the material it scrolls.
 *
 * **Resin, not Frost.** Crystal's scroll contract puts Frost on panels and
 * reading surfaces, and Resin on control planes and *compact or horizontal*
 * scrollers. This is horizontal, so it is Resin — which is a rule read off the
 * contract rather than a preference, and it is the kind of thing that silently
 * goes the other way if nobody writes down which sentence decided it.
 *
 * **A labelled list**, because a strip of cards with no list semantics is a
 * sequence of articles a reader cannot count, and the label is what distinguishes
 * "recently viewed" from the four other strips on a storefront.
 *
 * **Empty is nothing at all.** A "recently viewed" strip with nothing in it is a
 * heading over a void; a first-time reader is told about a feature they have not
 * used instead of being shown the shop.
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { ScrollArea } from '../ScrollArea/ScrollArea.js';
import { cx } from '../../styles/cx.js';
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

    /* Nothing at all rather than a heading over a void. */
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
            {(Array.isArray(children) ? children : [children]).map((one, index) => (
              // eslint-disable-next-line react/no-array-index-key -- the caller's own children, in their order
              <li key={index} className={styles['cell']}>{one}</li>
            ))}
          </ul>
        </ScrollArea>
      </section>
    );
  },
);
