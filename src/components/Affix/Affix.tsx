'use client';

/* Affix: pins its content to the viewport past a scroll threshold.
 *
 * A passive scroll listener, not `IntersectionObserver`. The decisive reason
 * is D-5. The in-app preview browser delivers no observer callbacks at all, so
 * a component built on one appears to work everywhere except the place
 * Meridian reviews it. A scroll listener works in both, and coalescing it to
 * one read per frame keeps it cheap. A scroll event can fire many times
 * between paints and every handler here reads layout.
 *
 * The placeholder is the whole component. Pinning means leaving the flow,
 * and an element that leaves the flow takes its height with it, so the page
 * jumps by exactly that height at the moment it pins, and jumps back when it
 * unpins. That produces a loop at the threshold: unpinning restores the height,
 * which scrolls the threshold back under the element, which pins it again. The
 * placeholder holds the measured height open so the flow never changes, which
 * removes the jump and the loop together.
 *
 * Resin once pinned, nothing before. The catalogue's material line, and the
 * reason is legibility rather than decoration: pinned, the element floats over
 * content that scrolls beneath it, and it needs to separate itself from what it
 * is covering. Inline, it is part of the page and giving it a floating material
 * would say it is not.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import styles from './Affix.module.scss';

export interface AffixProps {
  children: ReactNode;
  /**
   * How far from the top of the viewport it settles, in pixels. Also the
   * threshold: it pins once its natural position would be above this line.
   */
  offset?: number;
  /** Told when it pins and unpins, for a caller that wants to shade a header. */
  onChange?: (isPinned: boolean) => void;
  className?: string;
}

export function Affix({ children, offset = 0, onChange, className }: AffixProps): React.JSX.Element {
  const holder = useRef<HTMLDivElement | null>(null);
  const [isPinned, setPinned] = useState(false);
  /* Measured, not declared: the placeholder has to be exactly the height the
     content leaves behind, and that is whatever the content turns out to be. */
  const [height, setHeight] = useState<number | null>(null);
  const announce = useRef(onChange);
  announce.current = onChange;

  const measureContent = useCallback((node: HTMLDivElement | null) => {
    if (node) setHeight(node.getBoundingClientRect().height);
  }, []);

  useEffect(() => {
    const node = holder.current;
    if (!node) return undefined;
    let frame = 0;

    const measure = (): void => {
      frame = 0;
      /* The holder never leaves the flow, so its position is the content's
         natural position, and that position stays answerable after the content
         has been taken out of the flow. */
      const next = node.getBoundingClientRect().top <= offset;
      setPinned((was) => {
        if (was !== next) announce.current?.(next);
        return next;
      });
    };

    const schedule = (): void => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [offset]);

  return (
    <div
      ref={holder}
      className={cx(styles['holder'], className)}
      /* Held open whether or not it is pinned. Reserving the space only while
         pinned is what produces the jump, and then the loop. */
      style={height === null ? undefined : { blockSize: `${height}px` }}
    >
      <div
        ref={measureContent}
        data-pinned={isPinned || undefined}
        className={cx(styles['content'])}
        style={isPinned ? { insetBlockStart: `${offset}px` } : undefined}
      >
        {children}
      </div>
    </div>
  );
}
