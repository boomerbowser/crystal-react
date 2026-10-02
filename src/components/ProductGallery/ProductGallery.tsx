'use client';

/* ProductGallery: product media, which is a `Gallery`.
 *
 * The catalogue entry is `gallery`'s, word for word: "Arrow keys move between
 * items with position announced; zoom is keyboard reachable", "Haze thumbnails;
 * Mirage scrim when enlarged", "thumbnails keep the content radius; the viewer
 * is full-bleed within the scrim". Nothing in it differs between a product's
 * media and a photographer's set.
 *
 * So this is `Gallery` with the vocabulary a shop uses (an `alt` per image
 * rather than a `label` per item) and no second implementation of a listbox, a
 * roving tabindex, a dialog, a zoom, a pan or a position announcement. Those six
 * are hard to get right and are implemented once, in `Gallery`.
 *
 * This is a rename with a narrower API, not a separate component. A second
 * viewer with "product" in its name would need every fix made twice, and a
 * focus fix made only in one of them would leave the other broken.
 */
import { Gallery, type GalleryProps } from '../Gallery/Gallery.js';

export interface ProductMedia {
  id: string;
  /** What the picture shows. The thumbnail's name and the viewer's. */
  alt: string;
  /** The thumbnail. */
  thumbnail: React.ReactNode;
  /** The full-size image. Defaults to the thumbnail, which is rarely right. */
  full?: React.ReactNode;
  caption?: React.ReactNode;
}

export interface ProductGalleryProps extends Omit<GalleryProps, 'items' | 'label'> {
  media: readonly ProductMedia[];
  /** What the set is of. Usually the product's name. */
  label: string;
}

export function ProductGallery({ media, label, ...props }: ProductGalleryProps): React.JSX.Element {
  return (
    <Gallery
      {...props}
      label={label}
      items={media.map((one) => ({
        id: one.id,
        label: one.alt,
        thumbnail: one.thumbnail,
        ...(one.full === undefined ? {} : { full: one.full }),
        ...(one.caption === undefined ? {} : { caption: one.caption }),
      }))}
    />
  );
}
