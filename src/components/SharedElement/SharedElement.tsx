'use client';

/* SharedElement.
 *
 * Carries one element between two views so it reads as the same object rather
 * than as one thing disappearing and another appearing. A thumbnail in a grid and
 * the hero image on the page it opens are the same photograph, and a transition
 * that says so is the difference between a view change and a page reload.
 *
 * Motion's `layoutId` is the mechanism: two elements sharing an id in the same
 * `AnimatePresence` are animated from one position and size to the other. It is
 * the only implementation in the ecosystem that does this without the product
 * measuring anything itself.
 *
 * **Reduced motion removes it entirely**, which is the catalogue's wording and is
 * stronger than damping it. A shared-element transition is a moving object
 * crossing the viewport; slowing it down still moves it. So under reduced motion
 * the element renders without a `layoutId` at all and the views simply swap.
 *
 * The other rule — "never the only way a view change is signalled" — cannot be
 * enforced from inside a component, so it is said here: the destination needs a
 * heading, a title change, or focus moving into it. Somebody who cannot see the
 * object travel must still know they arrived.
 */
import { motion } from 'motion/react';
import type { HTMLAttributes, ReactNode } from 'react';
import { useCrystalTheme } from '../../theme/CrystalProvider.js';

export interface SharedElementProps extends Omit<HTMLAttributes<HTMLDivElement>,
  'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration' | 'onDrag' | 'onDragStart' | 'onDragEnd'> {
  /**
   * The identity. Two elements with the same id in the two views are treated as
   * the same object; the id must be stable across the change, so it is usually
   * the thing's own id rather than its position.
   */
  id: string;
  children?: ReactNode;
}

export function SharedElement({ id, style, children, ...props }: SharedElementProps): React.JSX.Element {
  const { reduceMotion } = useCrystalTheme();

  /* Removed, not damped. A slower moving object is still a moving object. */
  if (reduceMotion) {
    return <div {...props} {...(style ? { style } : {})} data-cr-motion-state="instant">{children}</div>;
  }

  return (
    /* Motion's `MotionStyle` is a superset of React's `CSSProperties` whose
       members are non-optional, so under `exactOptionalPropertyTypes` the two do
       not unify even though every real value is valid in both. The cast is the
       narrow fix, at the one place it is needed. */
    <motion.div {...props} {...(style ? { style: style as never } : {})} layoutId={id} data-cr-shared={id}>
      {children}
    </motion.div>
  );
}
