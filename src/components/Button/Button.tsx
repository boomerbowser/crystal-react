'use client';

/* Button.
 *
 * React Aria supplies the behaviour — press handling across pointer, keyboard and
 * touch, the `data-*` state attributes, and the disabled and focus semantics.
 * Crystal supplies the appearance and the motion. This file is the join, and
 * deliberately owns nothing else.
 *
 * Motion is bound to state rather than to a click handler. `onPressStart` is the
 * moment a press *begins* by any input method, including Space and Enter, so a
 * keyboard user gets the same feedback a pointer user gets. Binding to `onClick`
 * would have excluded them, which is the mistake the upstream motion work had to
 * correct across eleven recipes.
 */
import { forwardRef, type ReactNode } from 'react';
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components';
import { useMotion } from '../../motion/useMotion.js';
import { mergeRefs } from '../../utils/mergeRefs.js';
import { cx } from '../../styles/cx.js';
import styles from './Button.module.scss';

/**
 * Fill, not geometry. A button is a pill in every variant.
 *
 * There is no `secondary`. It named a second action colour and Crystal defines
 * one: the palettes publish a single action pair, and the companion and glow
 * hues are expressive paint that `colors.md` says is never assumed to be
 * text-safe. A variant named after a colour the system does not define is a
 * promise it cannot keep, so Meridian withdrew it on 22 September 2026 and
 * `crystal.css` has no `.secondary` rule either. What it used to mean is
 * `resin`, which is the default.
 *
 * There *is* a `danger`, and this library was missing it. Crystal 2.1.0 restored
 * `.cr-button.danger` as an **independent boundary** rather than a fill — a
 * destructive action keeps the neutral reading pad and takes the danger ink on
 * its perimeter, because a solid danger fill makes the label's contrast depend
 * on a status colour that the palettes are explicitly not allowed to redefine.
 * Adopted here rather than left out: when Crystal and a library diverge, the
 * library adopts.
 */
export type ButtonVariant = 'primary' | 'quiet' | 'danger' | 'resin';

/**
 * Shape.
 *
 * `pill` is the rule — action controls are pills, independent of the content
 * radius. `card` is Crystal's one documented exception, for a button that reads
 * as a surface rather than as an action.
 */
export type ButtonShape = 'pill' | 'card';

export interface ButtonProps extends Omit<AriaButtonProps, 'className' | 'style' | 'children'> {
  children?: ReactNode;
  variant?: ButtonVariant;
  shape?: ButtonShape;
  className?: string;
  style?: React.CSSProperties;
}

const VARIANT_CLASS: Record<ButtonVariant, string | undefined> = {
  primary: styles['primary'],
  /* The base surface, minus the reading pad: the whole Resin shell with the
     label directly on the material, which is what makes a quiet button quiet. */
  quiet: styles['quiet'],
  /* The boundary, not a fill. See the note above. */
  danger: styles['danger'],
  /* Resin is the base surface the stylesheet already applies, so this variant
     adds nothing — it exists so `variant="resin"` is sayable rather than implicit. */
  resin: undefined,
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { children, variant = 'resin', shape = 'pill', className, style, ...props },
  forwardedRef,
) {
  /* `once` coalesces a repeat of the same recipe while it is still running, so a
     held key repeating does not restart the press animation on every repeat.
     The scope is Motion's, and it cancels anything in flight on unmount. */
  const [scope, play] = useMotion({ once: true });

  const classes = cx(
    styles['button'],
    VARIANT_CLASS[variant],
    shape === 'card' && styles['card'],
    className,
  );

  /* `style` is spread only when defined: under `exactOptionalPropertyTypes` an
     explicit `undefined` is not the same as an absent property, and React Aria's
     `style` accepts a render function rather than plain undefined. */
  return (
    <AriaButton
      {...props}
      ref={mergeRefs<HTMLButtonElement>(scope as never, forwardedRef)}
      className={classes}
      {...(style ? { style } : {})}
      onPressStart={(event) => {
        play('press');
        props.onPressStart?.(event);
      }}
      onHoverStart={(event) => {
        play('hover');
        props.onHoverStart?.(event);
      }}
    >
      {children}
    </AriaButton>
  );
});
