'use client';

/* Skeleton — placeholder shapes matching the layout of content that is loading.
 *
 * It **wraps** what it is standing in for rather than being rendered instead of
 * it, and that is not a convenience. "Crystal: fill, sweep, reduced-motion
 * fallback, **resolve transition**" — a skeleton that is swapped out by its
 * caller has already unmounted when the data arrives, so there is nothing left
 * to play `skeleton-resolve` on. Owning the swap is the only way the resolve
 * exists at all.
 *
 * "`aria-hidden` with a live region announcing loading; **must not be read as
 * content**." Both halves are here: the shapes carry `aria-hidden`, so a screen
 * reader never meets a paragraph of nothing, and one polite live region says
 * what is loading. One, not one per shape — twelve skeleton lines announcing
 * themselves twelve times is the failure this is guarding against.
 *
 * "Matches the real content's radius and rhythm exactly" is the caller's job and
 * cannot be otherwise: only they know what is coming. What this provides is the
 * material and the shapes to say it with.
 */
import {
  forwardRef, useEffect, useRef, useState, type HTMLAttributes, type ReactNode,
} from 'react';
import { useMotion } from '../../motion/useMotion.js';
import { mergeRefs } from '../../utils/mergeRefs.js';
import { cx } from '../../styles/cx.js';
import styles from './Skeleton.module.scss';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Still waiting. When this goes false the real content replaces the shapes
   *  and `skeleton-resolve` plays on the swap. */
  loading: boolean;
  /** The placeholder shapes. */
  placeholder: ReactNode;
  /** What is loading. Announced once, politely. */
  label?: string;
  /** The real thing. */
  children?: ReactNode;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton({
  loading, placeholder, label = 'Loading', children, className, ...props
}, ref): ReactNode {
  const [scope, play] = useMotion();
  const waited = useRef(loading);
  /* The region is rendered empty and filled in an effect. A live region created
     with its text already inside it is one screen readers may never announce —
     the same hazard the toast stack is built around, one component along. */
  const [said, setSaid] = useState('');
  useEffect(() => { setSaid(loading ? label : ''); }, [loading, label]);

  useEffect(() => {
    /* Only on the transition out of loading, and only if there was one. A
       skeleton that was never shown has nothing to resolve from. */
    if (waited.current && !loading) void play('skeleton-resolve');
    waited.current = loading;
  }, [loading, play]);

  return (
    <div {...props} ref={mergeRefs(ref, scope)} className={cx(styles['skeleton'], className)}>
      {loading ? (
        <>
          {/* One region for the whole placeholder. Twelve lines announcing
              themselves twelve times is not more information. */}
          <span role="status" className={styles['announcement']}>{said}</span>
          <div aria-hidden="true" className={styles['shapes']}>{placeholder}</div>
        </>
      ) : children}
    </div>
  );
});

export type SkeletonShape = 'text' | 'title' | 'block' | 'circle';

export interface SkeletonBoxProps extends HTMLAttributes<HTMLSpanElement> {
  shape?: SkeletonShape;
  /** Proportion of the line the shape fills. A paragraph's last line is short. */
  width?: string;
  /** For a block or a circle, which has no line height to take. */
  height?: string;
}

/** One placeholder shape. Never rendered outside a `Skeleton`'s `placeholder`,
 *  where the `aria-hidden` that keeps it out of the accessibility tree lives. */
export function SkeletonBox({
  shape = 'text', width, height, className, style, ...props
}: SkeletonBoxProps): ReactNode {
  return (
    <span
      {...props}
      data-shape={shape}
      className={cx(styles['box'], className)}
      style={{ ...style, ...(width ? { inlineSize: width } : {}), ...(height ? { blockSize: height } : {}) }}
    />
  );
}
