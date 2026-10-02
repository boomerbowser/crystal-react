'use client';

/* ImageList. A grid of images with optional captions.
 *
 * "A list; each image needs an accessible name or is marked decorative." The
 * component enforces both halves. It is a real `ul`, so a reader is told how
 * many images there are before walking them. A grid of divs announces nothing
 * and gives no way out. `alt` is required on every item, exactly as it is on
 * `Image`: empty means decorative, absent means announced by filename, and the
 * author has to say which.
 *
 * The caption is separate from the alt text. It sits in the item and describes
 * what the picture means. The alt says what it is, for somebody who cannot see
 * it. `Caption` makes the same distinction and refuses an `alt` prop for the
 * same reason.
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { Image } from '../Image/Image.js';
import { cx } from '../../styles/cx.js';
import styles from './ImageList.module.scss';

export interface ImageListItem {
  /** Stable across renders. */
  id: string;
  src: string;
  /** What the image is. Empty for a decorative one. Empty, not absent. */
  alt: string;
  /** What it means. Shown over the image, and not a substitute for `alt`. */
  caption?: ReactNode;
  /** Makes the whole tile a link. */
  href?: string;
}

export interface ImageListProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  items: readonly ImageListItem[];
  /** Names the list. Two galleries on a page are otherwise the same list. */
  label: string;
  /** Width over height for every tile, so the grid stays a grid. */
  ratio?: number;
  /** Smallest tile width before the grid drops a column. */
  minTileWidth?: string;
}

export const ImageList = forwardRef<HTMLElement, ImageListProps>(function ImageList(
  { items, label, ratio = 1, minTileWidth, className, ...props },
  ref,
) {
  return (
    <ul
      {...props}
      ref={ref as never}
      aria-label={label}
      className={cx(styles['list'], className)}
      style={minTileWidth === undefined ? undefined : { ['--tile-min']: minTileWidth } as never}
    >
      {items.map((item) => {
        const tile = (
          <>
            <Image src={item.src} alt={item.alt} ratio={ratio} className={styles['media']} />
            {item.caption === undefined ? null : (
              <span className={styles['caption']}>{item.caption}</span>
            )}
          </>
        );
        return (
          <li key={item.id} className={styles['item']}>
            {item.href === undefined ? tile : (
              <a href={item.href} className={styles['link']}>{tile}</a>
            )}
          </li>
        );
      })}
    </ul>
  );
});
