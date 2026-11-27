'use client';

/* Carousel: a scrolling track of slides with controls and position indicators.
 *
 * There is no autoplay, and that is a decision. Prismata's rule is that nothing
 * moves at rest and motion is only ever something a person started. The
 * catalogue says "never autoplay without a pause control", and the recipes say,
 * in Prismata's own words, "explicit next/previous navigation; never autoplay".
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
 * The movement between slides is the track gliding to the next slide, the same
 * movement a swipe makes, so the controls and the hand move the slides the same
 * way. It used to be an instant jump followed by a 3D swing-in on the arriving
 * slide (`carousel-next`), which testers found juddery and disorienting: the
 * content jumped, then turned. A reader who asks for reduced motion gets the
 * jump alone.
 *
 * Spacing is the product's to set: `gap` between slides, `padding` inside each,
 * from Prismata's spacing scale.
 */
import {
  forwardRef, useCallback, useEffect, useRef, useState,
  type CSSProperties, type HTMLAttributes, type ReactNode,
} from 'react';
import { cx } from '../../styles/cx.js';
import { spacingValue, type PrismataSpacing } from '../../styles/spacing.js';
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
  /** Space between slides, from Prismata's scale. Defaults to `md`. */
  gap?: PrismataSpacing;
  /** Space inside each slide, from Prismata's scale. Defaults to `lg`. */
  padding?: PrismataSpacing;
}

function Slide(
  { slide, isCurrent, index, count }:
  { slide: CarouselSlide; isCurrent: boolean; index: number; count: number },
): ReactNode {
  return (
    <li
      className={cx('pr-haze flush', styles['slide'])}
      aria-label={slide.label}
      aria-setsize={count}
      aria-posinset={index + 1}
      data-current={isCurrent ? '' : undefined}
    >
      {slide.content}
    </li>
  );
}

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const Carousel = forwardRef<HTMLDivElement, CarouselProps>(function Carousel(
  {
    slides, label, previousLabel = 'Previous slide', nextLabel = 'Next slide',
    gap, padding, className, style, ...props
  },
  ref,
) {
  const track = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);

  const count = slides.length;
  const atStart = index === 0;
  const atEnd = index >= count - 1;

  const goTo = useCallback((next: number) => {
    const clamped = Math.min(count - 1, Math.max(0, next));
    setIndex(clamped);
    const element = track.current;
    const target = element?.children[clamped] as HTMLElement | undefined;
    if (!element || !target) return;
    /* The distance is measured on screen, between the slide's edge and the
       track's, instead of in `scrollLeft` arithmetic: in a right-to-left locale
       `scrollLeft` runs negative, and a visual distance is right in both
       directions. `scrollBy` moves only the track, never the page around it,
       which `scrollIntoView` would. jsdom has no layout, so it is optional. */
    const delta = target.getBoundingClientRect().left - element.getBoundingClientRect().left
      - (parseFloat(getComputedStyle(element).paddingInlineStart) || 0);
    element.scrollBy?.({ left: delta, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
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
      style={{
        ...(gap !== undefined ? { '--pr-carousel-gap': spacingValue(gap) } : {}),
        ...(padding !== undefined ? { '--pr-carousel-padding': spacingValue(padding) } : {}),
        ...style,
      } as CSSProperties}
    >
      <ul
        ref={track}
        tabIndex={0}
        className={cx(styles['track'], 'pr-scroll-resin')}
        aria-label={label}
      >
        {slides.map((slide, position) => (
          <Slide
            key={slide.id}
            slide={slide}
            index={position}
            count={count}
            isCurrent={position === index}
          />
        ))}
      </ul>

      <div className={styles['controls']}>
        <button
          type="button"
          className="pr-button"
          disabled={atStart}
          onClick={() => { goTo(index - 1); }}
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
                className={cx(styles['indicator'], 'pr-bare')}
                aria-label={slide.label}
                aria-current={position === index ? 'true' : undefined}
                onClick={() => { goTo(position); }}
              >
                <span aria-hidden="true" className={styles['dot']} />
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="pr-button"
          disabled={atEnd}
          onClick={() => { goTo(index + 1); }}
        >
          <span className={styles['stepLabel']}>{nextLabel}</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
});
