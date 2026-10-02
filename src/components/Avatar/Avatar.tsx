'use client';

/* Avatar: an image, initials or an icon, always circular.
 *
 * The main requirement is the fallback chain. Identity images fail routinely (a
 * deleted file, a blocked third-party host, a slow network), and a broken image
 * icon where a person's face should be is worse than never having tried. So the
 * image is rendered, watched, and replaced in place: `loading` until it resolves,
 * the initials on `error`, and an icon when there is no name to reduce.
 *
 * `name` does two things, and they are deliberately the same prop. It is what the
 * initials are derived from, and it is the accessible name. An avatar that shows
 * somebody's initials is identifying them, so it must say who. An avatar with no
 * name is decoration beside a label that already names the person, and is hidden
 * from assistive technology.
 *
 * Initials are the first letters of the first and last space-separated parts,
 * not of every part: "María del Carmen Rodríguez" is MR, not MDCR. No heuristic
 * over names is right everywhere, so `initials` replaces it outright.
 */
import { forwardRef, useEffect, useState, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import styles from './Avatar.module.scss';

/** Sizes on Crystal's 4px rhythm. */
export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** The image. Falls back to initials, then to the icon, if it fails. */
  src?: string;
  /** Who this is. The accessible name, and where the initials come from. */
  name?: string;
  /** Initials, when the name does not reduce to them the way you want. */
  initials?: string;
  /** Shown when there is no image and no name. */
  icon?: ReactNode;
  size?: AvatarSize;
}

/** First letters of the first and last parts of a name. */
export function nameInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const first = parts[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1] ?? '' : '';
  return [...first].slice(0, 1).concat([...last].slice(0, 1)).join('').toUpperCase();
}

type ImageState = 'loading' | 'loaded' | 'error';

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { src, name, initials, icon, size = 'md', className, ...props },
  ref,
) {
  const [state, setState] = useState<ImageState>(src === undefined ? 'error' : 'loading');

  /* A new `src` starts again. Otherwise an avatar that has already failed stays
     failed when the row is reused for a different person, and a virtualised list
     shows one person's initials over another's photograph. */
  useEffect(() => { setState(src === undefined ? 'error' : 'loading'); }, [src]);

  const shown = initials ?? (name === undefined ? '' : nameInitials(name));

  /* Named, or hidden. An avatar with no name beside a label that already carries
     it is decoration, and announcing "image" adds nothing. */
  const semantics = name === undefined
    ? { 'aria-hidden': true as const }
    : { role: 'img' as const, 'aria-label': name };

  return (
    <span
      {...props}
      {...semantics}
      ref={ref}
      data-state={state}
      className={cx(styles['avatar'], styles[size], className)}
    >
      {src === undefined ? null : (
        /* Presentational: the wrapper already carries the name, and an `alt` here
           would announce the person twice. */
        <img
          src={src}
          alt=""
          className={styles['image']}
          onLoad={() => { setState('loaded'); }}
          onError={() => { setState('error'); }}
        />
      )}
      {state === 'loaded' ? null : (
        <span aria-hidden="true" className={styles['fallback']}>
          {shown === '' ? icon : shown}
        </span>
      )}
    </span>
  );
});
