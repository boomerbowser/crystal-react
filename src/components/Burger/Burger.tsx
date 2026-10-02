'use client';

/* Burger: the control that discloses navigation on a narrow viewport.
 *
 * As a disclosure it needs a name, `aria-expanded` and `aria-controls`. The name
 * is needed because an icon-only control has none by default, and a screen
 * reader would otherwise announce "button". `aria-expanded` is needed because
 * drawing the state does not announce it. `aria-controls` identifies the
 * element it discloses.
 *
 * The name does not change with the state. "Open menu" becoming "Close menu"
 * re-announces the control as if it were a different one, and a reader who tabs
 * back to it hears a new name for an element they already know.
 * `aria-expanded` already carries the state, in the place assistive technology
 * looks for it.
 *
 * This is the one place in the slice where motion carries meaning. The bars
 * turning into a cross is the state change, so Crystal's `icon-turn` recipe
 * plays it. Under reduced motion the semantic state applies immediately and the
 * decorative movement is omitted.
 * The recipe's own words: "parent expanded state is authoritative."
 */
import { forwardRef } from 'react';
import { Button, type ButtonProps } from 'react-aria-components';
import { useMotion } from '../../motion/useMotion.js';
import { cx } from '../../styles/cx.js';
import styles from './Burger.module.scss';

export interface BurgerProps extends Omit<ButtonProps, 'className' | 'style' | 'children'> {
  /** Whether the navigation it discloses is open. Controlled. */
  isOpen: boolean;
  /** Told when it is pressed; the caller owns the state. */
  onOpenChange: (isOpen: boolean) => void;
  /**
   * The name, in both states. Not "Open menu"/"Close menu": `aria-expanded`
   * carries the state, and changing the name re-announces the control as a
   * different one.
   */
  label?: string;
  /** The `id` of the element this discloses. */
  controls?: string;
  className?: string;
}

export const Burger = forwardRef<HTMLButtonElement, BurgerProps>(function Burger(
  { isOpen, onOpenChange, label = 'Navigation', controls, className, ...props },
  ref,
) {
  const [scope, play] = useMotion();

  return (
    <Button
      {...props}
      ref={ref}
      aria-label={label}
      aria-expanded={isOpen}
      {...(controls ? { 'aria-controls': controls } : {})}
      onPress={(event) => {
        play('icon-turn');
        onOpenChange(!isOpen);
        props.onPress?.(event);
      }}
      data-open={isOpen || undefined}
      className={cx(styles['burger'], className)}
    >
      {/* One element, three bars drawn on it. The middle bar is the element's
          own background and the outer two are its pseudo-elements, so the
          cross is a single transform on a single node. Three separate
          animations could desynchronise. */}
      <span ref={scope as never} className={cx(styles['bars'])} aria-hidden="true" />
    </Button>
  );
});
