'use client';

/* Image — media with a reserved ratio, a placeholder and a failure fallback.
 *
 * The ratio is reserved before anything loads, and that is the whole reason this
 * component exists rather than an `img` tag. An image that arrives and pushes the
 * paragraph below it down the page is the most common layout shift on the web,
 * and it is one a component can simply not do: the box is sized from `ratio`, the
 * picture fills it, and nothing moves when the bytes arrive.
 *
 * `alt` is required and may be empty, which is deliberately not the same as
 * absent. "Meaningful images carry alt text; decorative images carry empty alt" —
 * and an image with no `alt` attribute at all is announced by its filename, which
 * is neither. Making the prop required forces the author to say which one this
 * is.
 *
 * `media-in` plays on arrival, because the picture appearing is the thing that
 * happened. It does not play on the placeholder, which is at rest.
 */
import { forwardRef, useEffect, useState, type ImgHTMLAttributes, type ReactNode } from 'react';
import { useMotion } from '../../motion/useMotion.js';
import { mergeRefs } from '../../utils/mergeRefs.js';
import { cx } from '../../styles/cx.js';
import styles from './Image.module.scss';

export interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'alt' | 'children'> {
  src: string;
  /** What the image says. Empty for a decorative one — empty, not absent. */
  alt: string;
  /** Width over height, reserved before the picture arrives. */
  ratio?: number;
  /** Shown instead of the picture when it will not load. */
  fallback?: ReactNode;
  /** Clip the media to the content radius. */
  rounded?: boolean;
}

type MediaState = 'loading' | 'loaded' | 'error';

export const Image = forwardRef<HTMLImageElement, ImageProps>(function Image(
  { src, alt, ratio, fallback, rounded = true, className, ...props },
  ref,
) {
  const [state, setState] = useState<MediaState>('loading');
  const [scope, play] = useMotion({ once: true });

  /* A new source starts again, or a reused row shows the previous picture's
     state over the next picture. */
  useEffect(() => { setState('loading'); }, [src]);

  return (
    <span
      ref={mergeRefs<HTMLSpanElement>(scope as never)}
      data-state={state}
      className={cx(styles['image'], rounded ? styles['rounded'] : undefined, className)}
      style={ratio === undefined ? undefined : { aspectRatio: String(ratio) }}
    >
      {state === 'error' ? (
        <span className={styles['fallback']}>{fallback}</span>
      ) : (
        <img
          {...props}
          ref={ref}
          src={src}
          alt={alt}
          className={styles['media']}
          onLoad={() => { setState('loaded'); void play('media-in'); }}
          onError={() => { setState('error'); }}
        />
      )}
    </span>
  );
});
