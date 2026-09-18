'use client';

/* AnimateOnScroll.
 *
 * Plays an entry recipe the first time an element comes into view, and then never
 * again — "pending" and "played" are the only two states the catalogue gives it,
 * and an element that re-animates every time it scrolls past is the pattern that
 * makes a long page exhausting.
 *
 * The rule that shapes the implementation: **content is present and readable
 * before the animation runs, never revealed by it.** So this does not start the
 * element at `opacity: 0` in CSS and fade it in — that is the common approach and
 * it means a reader whose IntersectionObserver never fires, whose JavaScript
 * failed, or who is reading with a screen reader gets an invisible page. The
 * element is fully rendered and fully opaque; the recipe plays over it.
 *
 * Reduced motion removes the movement. `useMotion` already refuses to animate,
 * and the element was already readable, so the reduced-motion path is simply the
 * page with nothing moving on it.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { useMotion } from '../../motion/useMotion.js';
import { mergeRefs } from '../../utils/mergeRefs.js';

/* "Which recipes are allowed" is Crystal's half of this component, so it is a
   list rather than a free string. Entry recipes only: a press or a field
   validation playing because something scrolled into view is motion that means
   nothing, and motion that means nothing is what makes a page feel restless.
   `list-in` is the default because an element arriving in the viewport is the
   same event as an item arriving in a list. */
const ENTRY_RECIPES = ['list-in', 'message-in', 'media-in', 'page-in', 'accordion-in'] as const;

export type ScrollEntryRecipe = typeof ENTRY_RECIPES[number];

export interface AnimateOnScrollProps {
  /** Which Crystal entry recipe to play. Only entry recipes are allowed. */
  recipe?: ScrollEntryRecipe;
  /**
   * How much of the element must be visible before it plays, 0 to 1. A tall
   * element at 1 may never play at all, which is why the default is a sliver.
   */
  threshold?: number;
  children?: ReactNode;
}

export function AnimateOnScroll({
  recipe = 'list-in', threshold = 0.15, children,
}: AnimateOnScrollProps): React.JSX.Element {
  const [scope, play] = useMotion();
  const host = useRef<HTMLDivElement | null>(null);
  const played = useRef(false);

  if (!(ENTRY_RECIPES as readonly string[]).includes(recipe)) {
    throw new RangeError(
      `"${recipe}" is not an entry recipe. Animate-on-scroll plays one of: ${ENTRY_RECIPES.join(', ')}.`,
    );
  }

  useEffect(() => {
    const element = host.current;
    if (!element || played.current) return undefined;

    /* No observer — an older browser, a test environment — means the content is
       simply there, unanimated. Never the other way round: a missing observer
       must not leave the page hidden. */
    if (typeof IntersectionObserver !== 'function') {
      played.current = true;
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || played.current) continue;
        played.current = true;
        play(recipe);
        observer.disconnect();
      }
    }, { threshold });

    observer.observe(element);
    return () => observer.disconnect();
  }, [recipe, threshold, play]);

  return <div ref={mergeRefs(host, scope as never)}>{children}</div>;
}
