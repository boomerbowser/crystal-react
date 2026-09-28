'use client';

/* ProductCard — one product, and exactly two tab stops.
 *
 * "**The whole card is not a link**; the name is, and the action is a button.
 * One tab stop each."
 *
 * That sentence is the whole component, and it is a correction of the thing
 * almost every storefront does. A card wrapped in an anchor gives a screen
 * reader one enormous link whose name is every word on the card — "Harbour
 * print A2 39.99 reduced from 49.99 four point five out of five 128 reviews in
 * stock add to basket" — and nests the Add control inside it, which is invalid
 * and behaves differently in every browser. It also takes away the two things a
 * reader actually wants: going to the product, and buying it, as two separate
 * decisions.
 *
 * So the name is the link and the action is a button, and everything else on the
 * card is text. A pointer still gets a large target, because the name's own hit
 * area is stretched over the card by the stylesheet — which is a pointer
 * affordance rather than a second control, and leaves the tab order at two.
 *
 * **An unavailable product keeps its card.** The action goes, because there is
 * nothing to press; the name stays a link, because the product page is still
 * where a reader goes to find out when it will be back.
 */
import { forwardRef, useMemo, type HTMLAttributes, type ReactNode } from 'react';
import { Price } from '../Price/Price.js';
import { DiscountBadge } from '../DiscountBadge/DiscountBadge.js';
import { StockIndicator } from '../StockIndicator/StockIndicator.js';
import { cx } from '../../styles/cx.js';
import { mergeRefs } from '../../utils/mergeRefs.js';
import { useListItemMotion } from '../../motion/ListPresence.js';
import type { Money } from '../../commerce/money.js';
import type { Availability } from '../../commerce/availability.js';
import styles from './ProductCard.module.scss';

export interface ProductCardProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** What it is called. The card's one link. */
  name: string;
  /** Where the product is. */
  href: string;
  price: Money;
  /** What it used to cost. With it, a `DiscountBadge` appears and is computed. */
  was?: Money;
  /** The picture. Decorative — the name is the name. */
  media?: ReactNode;
  availability?: Availability;
  availabilityLabel?: ReactNode;
  /** The rating, as a `Rating` in read-only mode. */
  rating?: ReactNode;
  /** The primary action. A button — never nested inside the link. */
  action?: ReactNode;
  /** A wishlist toggle or similar. Sits over the media. */
  aside?: ReactNode;
}

export const ProductCard = forwardRef<HTMLElement, ProductCardProps>(function ProductCard({
  name, href, price, was, media, availability, availabilityLabel, rating,
  action, aside, className, ...props
}, ref): ReactNode {
  /* In a product's `ListPresence`, this arrives with `list-in` when it is
     added and leaves with `list-out` when it is removed; anywhere else,
     nothing. */
  const scope = useListItemMotion();
  const merged = useMemo(() => mergeRefs(ref, scope as never), [ref, scope]);
  return (
    <article {...props} ref={merged as never} className={cx(styles['card'], className)}>
      {media ? (
        <div aria-hidden="true" className={styles['media']}>{media}</div>
      ) : null}

      {/* Outside the link, always. A control inside an anchor is invalid markup
          and behaves differently in every browser. */}
      {aside ? <div className={styles['aside']}>{aside}</div> : null}

      <div className={styles['body']}>
        <h3 className={styles['heading']}>
          {/* The one link. Its hit area is stretched over the card by the
              stylesheet, which is a pointer affordance and not a second tab
              stop — the card is still two. */}
          <a href={href} className={styles['name']}>{name}</a>
        </h3>

        <p className={styles['prices']}>
          <Price value={price} as="span" />
          {was === undefined ? null : (
            <>
              {/* The old price, struck through *and* said: a line through text
                  is a drawing, and `<s>` is what carries it to a reader. */}
              <s className={styles['was']}>
                <Price value={was} as="span" tabular={false} />
              </s>
              <DiscountBadge from={was} to={price} />
            </>
          )}
        </p>

        {rating ? <div className={styles['rating']}>{rating}</div> : null}

        {availability ? (
          <StockIndicator availability={availability}>{availabilityLabel}</StockIndicator>
        ) : null}
      </div>

      {/* An unavailable product keeps its card and loses its action: there is
          nothing to press, and the product page is still where a reader goes to
          find out when it will be back. */}
      {action && availability !== 'out-of-stock' ? (
        <div className={styles['action']}>{action}</div>
      ) : null}
    </article>
  );
});
