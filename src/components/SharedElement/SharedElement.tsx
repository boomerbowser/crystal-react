'use client';

/* SharedElement.
 *
 * Carries one element between two views so it reads as the same object instead
 * of one thing disappearing and another appearing. A thumbnail in a grid and the
 * hero image on the page it opens are the same photograph, and the transition
 * shows that.
 *
 * Motion's `layoutId` is the mechanism: two elements sharing an id in the same
 * `AnimatePresence` are animated from one position and size to the other. It is
 * the only implementation in the ecosystem that does this without the product
 * measuring anything itself.
 *
 * Reduced motion removes it entirely, which is the catalogue's wording and is
 * stronger than damping it. A shared-element transition is a moving object
 * crossing the viewport, and slowing it down still moves it. Under reduced motion
 * the element renders without a `layoutId` and the views swap.
 *
 * The travel takes Crystal's spatial duration and entering ease. The rest of the
 * destination (its heading, its text) waits for the object to land and then
 * fades in, through `SharedElementReveal`: shown at once, it appears in full
 * while the object is still small and in flight, which testers read as the
 * view's contents showing too early.
 *
 * The corner radius is read from the element and handed to Motion in pixels.
 * Motion keeps a radius round while it scales the box, but only one it can do
 * arithmetic on; a `var()` radius is scaled with the box and the corners warp
 * for the length of the travel.
 *
 * The other rule, "never the only way a view change is signalled", cannot be
 * enforced from inside a component. The destination needs a heading, a title
 * change, or focus moving into it, so that somebody who cannot see the object
 * travel still knows they arrived.
 */
import { motion } from 'motion/react';
import type { HTMLAttributes, ReactNode } from 'react';
import { useCrystalTheme } from '../../theme/CrystalProvider.js';
import { crystalTokens } from '../../theme/tokens.generated.js';

/** Crystal's spatial duration, in seconds, and its entering ease. */
const TRAVEL_S = Number.parseFloat(crystalTokens['motion.duration.spatial']) / 1000;
const ENTER_EASE = (crystalTokens['motion.easing.enter'].match(/[\d.]+/g) ?? []).map(Number) as [number, number, number, number];

export interface SharedElementProps extends Omit<HTMLAttributes<HTMLDivElement>,
  'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration' | 'onDrag' | 'onDragStart' | 'onDragEnd'> {
  /**
   * The identity. Two elements with the same id in the two views are treated as
   * the same object. The id must be stable across the change, so it is usually
   * the thing's own id, not its position.
   */
  id: string;
  children?: ReactNode;
}

/** A `var(--name)` radius resolved against the root, in pixels; anything else
 *  is returned as it is. On the server there is nothing to resolve against. */
function resolveRadius(value: string | number | undefined): string | number | undefined {
  if (typeof value !== 'string' || typeof document === 'undefined') return value;
  const variable = /^var\((--[\w-]+)\)$/.exec(value.trim());
  if (!variable?.[1]) return value;
  const resolved = getComputedStyle(document.documentElement).getPropertyValue(variable[1]).trim();
  return resolved || value;
}

export function SharedElement({ id, style, children, ...props }: SharedElementProps): React.JSX.Element {
  const { reduceMotion, resolveDuration } = useCrystalTheme();
  /* The radius, resolved to pixels in the same render that mounts the element,
     because Motion takes its starting snapshot on mount and a radius corrected
     one render later is too late. */
  const radius = resolveRadius(style?.borderRadius);

  /* Removed, not damped. A slower moving object is still a moving object. */
  if (reduceMotion) {
    return <div {...props} {...(style ? { style } : {})} data-cr-motion-state="instant">{children}</div>;
  }

  const duration = resolveDuration(TRAVEL_S * 1000) / 1000;
  return (
    /* Motion's `MotionStyle` is a superset of React's `CSSProperties` whose
       members are non-optional, so under `exactOptionalPropertyTypes` the two do
       not unify even though every real value is valid in both. The cast is
       confined to this one place. */
    <motion.div
      {...props}
      style={{ ...style, ...(radius ? { borderRadius: radius } : {}) } as never}
      layoutId={id}
      transition={{ layout: { duration, ease: ENTER_EASE } }}
      data-cr-shared={id}
    >
      {children}
    </motion.div>
  );
}

export interface SharedElementRevealProps extends Omit<HTMLAttributes<HTMLDivElement>,
  'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration' | 'onDrag' | 'onDragStart' | 'onDragEnd'> {
  children?: ReactNode;
}

/**
 * The rest of a destination view: hidden while the shared element travels,
 * then faded in once it lands, so the view's contents never show before the
 * object that opened it has arrived. Under reduced motion it is shown at once.
 */
export function SharedElementReveal({ style, children, ...props }: SharedElementRevealProps): React.JSX.Element {
  const { reduceMotion, resolveDuration } = useCrystalTheme();
  if (reduceMotion) return <div {...props} {...(style ? { style } : {})}>{children}</div>;
  const travel = resolveDuration(TRAVEL_S * 1000) / 1000;
  return (
    <motion.div
      {...props}
      {...(style ? { style: style as never } : {})}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: travel * 0.8, duration: travel * 0.6, ease: ENTER_EASE }}
    >
      {children}
    </motion.div>
  );
}
