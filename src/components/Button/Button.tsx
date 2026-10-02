'use client';

/* Button.
 *
 * React Aria supplies the behaviour: press handling across pointer, keyboard and
 * touch, the `data-*` state attributes, and the disabled and focus semantics.
 * Crystal supplies the appearance and the motion. This file joins the two and
 * owns nothing else.
 *
 * Motion is bound to state, not to a click handler. `onPressStart` fires when a
 * press begins by any input method, including Space and Enter, so a keyboard
 * user gets the same feedback a pointer user gets. Binding to `onClick` would
 * exclude them.
 */
import { forwardRef, type ReactNode } from 'react';
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components';
import { useMotion } from '../../motion/useMotion.js';
import { mergeRefs } from '../../utils/mergeRefs.js';
import { cx } from '../../styles/cx.js';
import styles from './Button.module.scss';

/**
 * A variant sets the fill, never the geometry. A button is a pill in every
 * variant.
 *
 * There is no `secondary`. It named a second action colour, and Crystal defines
 * only one: the palettes publish a single action pair, and the companion and
 * glow hues are expressive paint that `colors.md` says is never assumed to be
 * text-safe. Meridian withdrew it on 22 September 2026, and `crystal.css` has
 * no `.secondary` rule either. Its old meaning is `resin`, which is the default.
 *
 * `danger` follows `.cr-button.danger`, which Crystal 2.1.0 restored as an
 * independent boundary instead of a fill. A destructive action keeps the
 * neutral reading pad and takes the danger ink on its perimeter, because a
 * solid danger fill makes the label's contrast depend on a status colour that
 * the palettes may not redefine. When Crystal and a library diverge, the
 * library adopts.
 */
export type ButtonVariant = 'primary' | 'quiet' | 'danger' | 'resin';

/**
 * Shape.
 *
 * `pill` is the rule: action controls are pills, independent of the content
 * radius. `card` is Crystal's one documented exception, for a button that reads
 * as a surface instead of an action.
 */
export type ButtonShape = 'pill' | 'card';

export interface ButtonProps extends Omit<AriaButtonProps, 'className' | 'style' | 'children'> {
  children?: ReactNode;
  variant?: ButtonVariant;
  shape?: ButtonShape;
  /**
   * Makes this a toggle: `aria-pressed`, and the appearance Crystal already
   * specifies for a pressed action (the reading pad in `--cr-primary` with its
   * feather off, `--cr-on-primary` ink, and the label at weight 800).
   *
   * Absent, not `false`, when it is not given. A button that is not a toggle
   * must not report a pressed state at all: `aria-pressed="false"` on an
   * ordinary action tells a reader there is a state to watch.
   *
   * `IconButton` has had this since the actions slice, and Crystal's own
   * stylesheet styles `button[aria-pressed=true]`, so both shapes of the
   * control support it.
   */
  isSelected?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/* Crystal's own variant class names, as literals instead of module classes.
 *
 * `.cr-button.primary`, `.cr-button.quiet::before` and `.cr-button.danger` are
 * core's rules, and a hashed module class cannot satisfy them. Emitting the
 * plain names lets Crystal paint the variants, so this library does not
 * describe them again. */
const VARIANT_CLASS: Record<ButtonVariant, string | undefined> = {
  /* The reading pad in the action colour, with the palette's tested ink pair. */
  primary: 'primary',
  /* No pad at all: the label sits directly on the Resin shell. */
  quiet: 'quiet',
  /* An independent boundary instead of a fill, so the label's contrast never
     depends on a status colour. */
  danger: 'danger',
  /* Resin is the base surface Crystal already applies to every `<button>`, so
     this variant adds no class. It exists so `variant="resin"` can be written
     explicitly. */
  resin: undefined,
};
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { children, variant = 'resin', shape = 'pill', isSelected, className, style, ...props },
  forwardedRef,
) {
  /* `once` coalesces a repeat of the same recipe while it is still running, so a
     held key repeating does not restart the press animation on every repeat.
     The scope is Motion's, and it cancels anything in flight on unmount. */
  const [scope, play] = useMotion({ once: true });

  /* `cr-button` makes Crystal the painter: core keys the Resin material on the
     `button` element and the geometry on this class, so wearing the class is all
     this library does to look like Crystal. */
  const classes = cx(
    styles['button'],
    'cr-button',
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
      {...(isSelected === undefined ? {} : { 'aria-pressed': isSelected })}
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
