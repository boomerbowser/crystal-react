'use client';

/* Skeleton.
 *
 * Placeholder shapes matching the layout of content that is loading.
 *
 * It wraps what it is standing in for instead of being rendered in its place.
 * The catalogue asks for "Crystal: fill, sweep, reduced-motion fallback,
 * **resolve transition**", and a skeleton that is swapped out by its caller has
 * already unmounted when the data arrives, so there is nothing left to play
 * `skeleton-resolve` on. The resolve exists only because the skeleton owns the
 * swap.
 *
 * "`aria-hidden` with a live region announcing loading; **must not be read as
 * content**." The shapes carry `aria-hidden`, so a screen reader never meets a
 * paragraph of nothing, and one polite live region says what is loading. There
 * is one region for the whole skeleton, not one per shape, so twelve skeleton
 * lines are not announced twelve times.
 *
 * "Matches the real content's radius and rhythm exactly" is the caller's job,
 * because only the caller knows what is coming. This component provides the
 * material and the shapes.
 */
import {
  forwardRef, useEffect, useRef, useState, type HTMLAttributes, type ReactNode,
} from 'react';
import { useMotion } from '../../motion/useMotion.js';
import { useContinuous } from '../../motion/useContinuous.js';
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
  /* The region is rendered empty and filled in an effect. Screen readers may
     never announce a live region created with its text already inside it. The
     toast stack is built around the same hazard. */
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
          {/* One region for the whole placeholder, so twelve lines are not
              announced twelve times. */}
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
  /* A box exists only while its skeleton is loading, so being mounted is being
     pending: Crystal's `skeleton-sweep` runs from mount to unmount. */
  const sweep = useContinuous('skeleton-sweep', true);
  return (
    <span
      {...props}
      ref={sweep as never}
      data-shape={shape}
      className={cx(styles['box'], className)}
      style={{ ...style, ...(width ? { inlineSize: width } : {}), ...(height ? { blockSize: height } : {}) }}
    />
  );
}
