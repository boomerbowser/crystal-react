'use client';

/* Marquee — content that scrolls continuously along one axis.
 *
 * The honest part first: **this is the one component in Crystal whose default
 * state is movement at rest**, and Crystal's rule is that nothing moves at rest.
 * The catalogue lists it anyway, and the reconciliation is in the last clause of
 * its own semantics line — "removed entirely under reduced motion". So a marquee
 * is motion a reader can switch off system-wide and, until they do, can stop by
 * pointing at it or tabbing to it. That is the whole of what makes it shippable,
 * and it is why none of it is optional here.
 *
 * Crystal assigns no recipe and no duration, and could not: a continuous scroll's
 * duration depends on how long the content is, which is a fact about the caller's
 * children. `speed` is therefore in pixels per second — a rate rather than a
 * time — and the duration is measured from the rendered width. What is *not* this
 * component's to choose is whether it plays: `--cr-motion-enabled` gates it, the
 * same property every other moving thing in this library divides by.
 *
 * The viewport takes a tab stop so that "pausable on focus" means something to
 * somebody who is not using a pointer. It is also a scroll container, so the tab
 * stop is what makes its content reachable at all — the same reason `Code`'s
 * blocks are focusable.
 */
import { forwardRef, useEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { useCrystalTheme } from '../../theme/CrystalProvider.js';
import { cx } from '../../styles/cx.js';
import styles from './Marquee.module.scss';

export interface MarqueeProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children: ReactNode;
  /** Names the region. Required: a moving strip with no name is a mystery. */
  label: string;
  /** Pixels per second. A rate, because the duration depends on the content. */
  speed?: number;
  /** Scroll towards the start rather than the end. */
  reverse?: boolean;
}

export const Marquee = forwardRef<HTMLDivElement, MarqueeProps>(function Marquee(
  { children, label, speed = 60, reverse = false, className, ...props },
  ref,
) {
  const { reduceMotion } = useCrystalTheme();
  const track = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState<number | null>(null);

  useEffect(() => {
    if (reduceMotion) { setDuration(null); return undefined; }
    const element = track.current;
    if (!element) return undefined;
    const measure = () => {
      /* One copy's width, because the track holds two and the animation travels
         exactly one copy before repeating. */
      const width = element.scrollWidth / 2;
      setDuration(width > 0 ? width / Math.max(1, speed) : null);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => { observer.disconnect(); };
    /* `children` is deliberately not a dependency: it is a new object on every
       render, so depending on it would re-measure continuously. The
       `ResizeObserver` is what notices the content changing size, which is the
       thing that actually matters. */
  }, [speed, reduceMotion]);

  /* Reduced motion removes the movement, and with it the second copy: a
     duplicate of the content is only there to make the loop seamless, and
     leaving it behind would read the same thing twice. */
  const moving = !reduceMotion && duration !== null;

  return (
    <div
      {...props}
      ref={ref}
      role="region"
      aria-label={label}
      tabIndex={0}
      className={cx(styles['marquee'], className)}
    >
      <div
        ref={track}
        className={cx(styles['track'], moving ? styles['moving'] : undefined)}
        data-reverse={reverse ? '' : undefined}
        /* The measured duration arrives as a custom property rather than as
           `animationDuration`, so the stylesheet can still divide it by the
           reader's motion-speed preference and multiply it by
           `--cr-motion-enabled`. An inline `animation-duration` would outrank
           the rule and quietly un-gate the animation. */
        style={moving ? ({ '--marquee-duration': `${duration}s` } as CSSProperties) : undefined}
      >
        <div className={styles['copy']}>{children}</div>
        {moving ? <div className={styles['copy']} aria-hidden="true">{children}</div> : null}
      </div>
    </div>
  );
});
