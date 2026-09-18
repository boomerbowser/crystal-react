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
import { forwardRef, useRef, type ReactNode } from 'react';
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components';
import { useMotion } from '../../motion/useMotion.js';
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
  secondary: styles['secondary'],
  quiet: styles['quiet'],
  /* Resin is the base surface the stylesheet already applies, so this variant
     adds nothing — it exists so `variant="resin"` is sayable rather than implicit. */
  resin: undefined,
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { children, variant = 'resin', shape = 'pill', className, style, ...props },
  forwardedRef,
) {
  const localRef = useRef<HTMLButtonElement>(null);
  /* `once` coalesces a repeat of the same recipe while it is still running, so a
     held key repeating does not restart the press animation on every repeat. */
  const play = useMotion(localRef, { once: true });

  const classes = [
    styles['button'],
    VARIANT_CLASS[variant],
    shape === 'card' ? styles['card'] : undefined,
    className,
  ].filter(Boolean).join(' ');

  /* `style` is spread only when defined: under `exactOptionalPropertyTypes` an
     explicit `undefined` is not the same as an absent property, and React Aria's
     `style` accepts a render function rather than plain undefined. */
  return (
    <AriaButton
      {...props}
      ref={(node: HTMLButtonElement | null) => {
        localRef.current = node;
        if (typeof forwardedRef === 'function') forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
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
