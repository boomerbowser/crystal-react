'use client';

/* Carousel: a scrolling track of slides with controls and position indicators.
 *
 * There is no autoplay, and that is a decision. Crystal's rule is that nothing
 * moves at rest and motion is only ever something a person started. The
 * catalogue says "never autoplay without a pause control", and the recipes say,
 * in Crystal's own words, "explicit next/previous navigation; never autoplay".
 * The catalogue assigns autoplay policy to the product, so a product that must
 * have it owns both the timer and the pause control. This component does not
 * supply one without the other.
 *
 * The track is a real scroll container with scroll snapping, so a pointer user
 * can swipe it, a trackpad user can flick it, and the platform's own momentum
 * and rubber-banding are intact. It is also a tab stop, because a scroll
 * container with nothing focusable inside cannot be reached without a pointer.
 * `Code`'s blocks and `Table`'s shell follow the same contract.
 *
 * The movement between slides is Crystal's, and it is on the arriving slide,
 * not on the track. `carousel-next` and `carousel-previous` are a 3D swing-in,
 * so animating the track as well would move the same thing twice. The scroll
 * itself is instant for that reason.
 */
import {
  forwardRef, useCallback, useEffect, useRef, useState,
  type HTMLAttributes, type ReactNode,
} from 'react';
import { useMotion } from '../../motion/useMotion.js';
import { cx } from '../../styles/cx.js';
import styles from './Carousel.module.scss';

export interface CarouselSlide {
  /** Stable across renders. */
  id: string;
  /** Names this slide for the indicator that goes to it. */
  label: string;
  content: ReactNode;
}

export interface CarouselProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  slides: readonly CarouselSlide[];
  /** Names the group. Required: `role="group"` without a name says nothing. */
  label: string;
  /** What the previous control says. */
  previousLabel?: string;
  nextLabel?: string;
}

/** Which way the reader went, so the arriving slide plays the right recipe. */
type Direction = 'next' | 'previous';

function Slide(
  { slide, isCurrent, direction, index, count }:
  { slide: CarouselSlide; isCurrent: boolean; direction: Direction | null; index: number; count: number },
): ReactNode {
  const [scope, play] = useMotion();
  const was = useRef(isCurrent);

  useEffect(() => {
    const arrived = isCurrent && !was.current;
    was.current = isCurrent;
    /* On arrival only, and only when somebody navigated: the slide that is
       showing when the page loads has not arrived, and nothing moves at rest. */
    if (arrived && direction !== null) {
      void play(direction === 'next' ? 'carousel-next' : 'carousel-previous');
    }
  }, [isCurrent, direction, play]);

  return (
    <li
      ref={scope as never}
      className={styles['slide']}
      aria-label={slide.label}
      aria-setsize={count}
      aria-posinset={index + 1}
      data-current={isCurrent ? '' : undefined}
    >
      {slide.content}
    </li>
  );
}

export const Carousel = forwardRef<HTMLDivElement, CarouselProps>(function Carousel(
  { slides, label, previousLabel = 'Previous slide', nextLabel = 'Next slide', className, ...props },
  ref,
) {
  const track = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<Direction | null>(null);

  const count = slides.length;
  const atStart = index === 0;
  const atEnd = index >= count - 1;

  const goTo = useCallback((next: number, how: Direction | null) => {
    const clamped = Math.min(count - 1, Math.max(0, next));
    setDirection(how);
    setIndex(clamped);
    const element = track.current?.children[clamped];
    /* `scrollIntoView` instead of arithmetic on `scrollLeft`: in a right-to-left
       locale `scrollLeft` is negative in some engines and zero-at-the-right in
       others, so arithmetic on it is wrong in one of them. Instant, because the
       movement is the recipe's.
     *
     * Called optionally because jsdom, which has no layout to scroll, does not
     * implement it. The index still changes, and that is what a unit test can
     * see. */
    element?.scrollIntoView?.({ behavior: 'auto', inline: 'start', block: 'nearest' });
  }, [count]);

  /* The reader can also swipe, so the index follows the scroll position as well
     as the controls. A passive scroll listener is used instead of an
     `IntersectionObserver`, because the observer delivers nothing in the in-app
     preview browser (D-5). `Affix` does the same for the same reason. */
  useEffect(() => {
    const element = track.current;
    if (!element) return undefined;
    const sync = () => {
      const children = [...element.children] as HTMLElement[];
      if (children.length === 0) return;
      const middle = element.scrollLeft + element.clientWidth / 2;
      let nearest = 0;
      let best = Infinity;
      children.forEach((child, i) => {
        const centre = child.offsetLeft + child.offsetWidth / 2;
        const distance = Math.abs(centre - middle);
        if (distance < best) { best = distance; nearest = i; }
      });
      setIndex((current) => (current === nearest ? current : nearest));
    };
    element.addEventListener('scroll', sync, { passive: true });
    return () => { element.removeEventListener('scroll', sync); };
  }, []);

  return (
    <div
      {...props}
      ref={ref}
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      className={cx(styles['carousel'], className)}
    >
      <ul
        ref={track}
        tabIndex={0}
        className={cx(styles['track'], 'cr-scroll-resin')}
        aria-label={label}
      >
        {slides.map((slide, position) => (
          <Slide
            key={slide.id}
            slide={slide}
            index={position}
            count={count}
            isCurrent={position === index}
            direction={direction}
          />
        ))}
      </ul>

      <div className={styles['controls']}>
        <button
          type="button"
          className="cr-button"
          disabled={atStart}
          onClick={() => { goTo(index - 1, 'previous'); }}
        >
          <span aria-hidden="true">←</span>
          <span className={styles['stepLabel']}>{previousLabel}</span>
        </button>

        {/* Indicators are buttons, as the catalogue says. A row of dots that
            cannot be pressed would be a progress readout that looks like a
            control. */}
        <ul className={styles['indicators']}>
          {slides.map((slide, position) => (
            <li key={slide.id}>
              <button
                type="button"
                className={cx(styles['indicator'], 'cr-bare')}
                aria-label={slide.label}
                aria-current={position === index ? 'true' : undefined}
                onClick={() => { goTo(position, position > index ? 'next' : 'previous'); }}
              >
                <span aria-hidden="true" className={styles['dot']} />
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="cr-button"
          disabled={atEnd}
          onClick={() => { goTo(index + 1, 'next'); }}
        >
          <span className={styles['stepLabel']}>{nextLabel}</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
});
