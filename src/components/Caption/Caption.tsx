'use client';

/* Caption — media with its description.
 *
 * "A caption never replaces alt text; the two say different things." Alt text
 * says what the image *is*, for someone who cannot see it. A caption says what it
 * *means*, to everyone. So this component renders a real `figure` and
 * `figcaption` around media the caller supplies with its own alt text, and does
 * not accept an `alt` prop — offering one would invite the two to be written as
 * a single sentence, which leaves a listener hearing it twice or not at all.
 *
 * `hidden` is not "no caption". The text stays in the document and stays
 * associated with the figure; it is removed from the visual composition only.
 * That is the state for a gallery where the captions are read elsewhere, and the
 * reason it is a state rather than the caller simply omitting the text.
 *
 * Motion plays on `overlaid` only, and only when the caption arrives after the
 * figure. An overlaid caption covers part of the media, so it is something that
 * appears over what the reader is already looking at; a caption printed below has
 * always been there.
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
       the page settles is ambient motion — withdrawn from 2.0 deliberately. */
    if (!mounted.current) { mounted.current = true; return; }
    if (overlaid && !captionHidden) play('caption-in');
  }, [overlaid, captionHidden, play]);

  return (
    <figure {...props} ref={ref} className={cx(styles['figure'], className)}>
      {children}
      {captionHidden ? (
        /* The clipping recipe belongs to React Aria, in one place — a second copy
           of it here is exactly the drift `VisuallyHidden` exists to prevent. */
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
