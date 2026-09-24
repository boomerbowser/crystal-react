'use client';

/* ProductGallery — product media, which is a `Gallery`.
 *
 * The catalogue entry is `gallery`'s, word for word: "Arrow keys move between
 * items with position announced; zoom is keyboard reachable", "Haze thumbnails;
 * Mirage scrim when enlarged", "thumbnails keep the content radius; the viewer
 * is full-bleed within the scrim". There is nothing in it that a product's media
 * needs and a photographer's set does not.
 *
 * So this is `Gallery` with the vocabulary a shop uses — an `alt` per image
 * rather than a `label` per item — and no second implementation of a listbox, a
 * roving tabindex, a dialog, a zoom, a pan or a position announcement. Six
 * things that are hard to get right and were got right once.
 *
 * It is worth being explicit that this is a *rename with a narrower API* rather
 * than a component, because the temptation in a commerce slice is to build a
 * second viewer with "product" in its name and then discover a year later that
 * only one of the two had the focus fix.
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
