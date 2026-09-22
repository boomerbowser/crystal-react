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

/** Fill, not geometry. A button is a pill in every variant. */
export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'resin';

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
  /* The base surface, which is what Crystal's own stylesheet gives it: the
     modifier fills were removed from `crystal.css` once they were found to
     compute identically to it. The name stays because it is what a caller
     means. */
  secondary: undefined,
  quiet: styles['quiet'],
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
