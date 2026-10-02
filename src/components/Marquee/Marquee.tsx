'use client';

/* Marquee: content that scrolls continuously along one axis.
 *
 * This is the one component in Crystal whose default state is movement at
 * rest, and Crystal's rule is that nothing moves at rest. The catalogue lists it
 * anyway, on the condition in the last clause of its own semantics line:
 * "removed entirely under reduced motion". A reader can switch it off
 * system-wide and, until they do, stop it by pointing at it or tabbing to it.
 * None of that is optional here.
 *
 * Crystal assigns no recipe and no duration, because a continuous scroll's
 * duration depends on the length of the caller's children. `speed` is therefore
 * a rate in pixels per second, and the duration is measured from the rendered
 * width. Whether it plays is not this component's choice: `--cr-motion-enabled`
 * gates it, the same property every other animation in this library uses.
 *
 * The viewport takes a tab stop so that "pausable on focus" works without a
 * pointer. It is also a scroll container, so the tab stop is what makes its
 * content reachable, the same reason `Code`'s blocks are focusable.
 */
import { forwardRef, useEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { useCrystalTheme } from '../../theme/CrystalProvider.js';
import { cx } from '../../styles/cx.js';
import styles from './Marquee.module.scss';

export interface MarqueeProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children: ReactNode;
  /** Names the region. Required, so a reader knows what the moving strip is. */
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
    /* `children` is not a dependency. It is a new object on every render, so
       depending on it would re-measure continuously. The
       `ResizeObserver` notices when the content changes size. */
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
           the rule and remove the gate. */
        style={moving ? ({ '--marquee-duration': `${duration}s` } as CSSProperties) : undefined}
      >
        <div className={styles['copy']}>{children}</div>
        {moving ? <div className={styles['copy']} aria-hidden="true">{children}</div> : null}
      </div>
    </div>
  );
});
