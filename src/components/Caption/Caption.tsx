'use client';

/* Caption: media with its description.
 *
 * "A caption never replaces alt text; the two say different things." Alt text
 * says what the image is, for someone who cannot see it. A caption says what it
 * means, to everyone. This component renders a real `figure` and `figcaption`
 * around media the caller supplies with its own alt text, and does not accept an
 * `alt` prop. An `alt` prop would invite the two to be written as a single
 * sentence, which a listener then hears twice or not at all.
 *
 * `hidden` is not "no caption". The text stays in the document and stays
 * associated with the figure, and is removed from the visual composition only.
 * That is the state for a gallery where the captions are read elsewhere, which
 * is why it is a state and the caller does not omit the text.
 *
 * Motion plays on `overlaid` only, and only when the caption arrives after the
 * figure. An overlaid caption covers part of the media, so it appears over what
 * the reader is already looking at. A caption printed below has always been
 * there.
 */
import { forwardRef, useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react';
import { useMotion } from '../../motion/useMotion.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import { mergeRefs } from '../../utils/mergeRefs.js';
import { cx } from '../../styles/cx.js';
import styles from './Caption.module.scss';

export interface CaptionProps extends HTMLAttributes<HTMLElement> {
  /** The media. Carries its own alt text; a caption is not a substitute for it. */
  children: ReactNode;
  /** What the media means. */
  caption: ReactNode;
  /** Place the caption over the media rather than below it. */
  overlaid?: boolean;
  /** Keep the caption in the document but out of the visual composition. */
  captionHidden?: boolean;
}

export const Caption = forwardRef<HTMLElement, CaptionProps>(function Caption(
  { children, caption, overlaid = false, captionHidden = false, className, ...props },
  ref,
) {
  const [scope, play] = useMotion({ once: true });
  const mounted = useRef(false);

  useEffect(() => {
    /* Not on the first pass. Nothing moves at rest, and a caption animating as
       the page settles is ambient motion, which was withdrawn from 2.0. */
    if (!mounted.current) { mounted.current = true; return; }
    if (overlaid && !captionHidden) play('caption-in');
  }, [overlaid, captionHidden, play]);

  return (
    <figure {...props} ref={ref} className={cx(styles['figure'], className)}>
      {children}
      {captionHidden ? (
        /* The clipping recipe belongs to React Aria, in one place. `VisuallyHidden`
           exists so no second copy of it drifts here. */
        <VisuallyHidden as="figcaption">{caption}</VisuallyHidden>
      ) : (
        <figcaption
          ref={mergeRefs(scope)}
          className={cx(styles['caption'], overlaid && styles['overlaid'], overlaid && 'cr-stone')}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  );
});
