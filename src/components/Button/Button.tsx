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
  /**
   * Makes this a toggle: `aria-pressed`, and the appearance Crystal already
   * specifies for a pressed action — the reading pad in `--cr-primary` with its
   * feather off, `--cr-on-primary` ink, and the label at weight 800.
   *
   * Absent rather than `false` when it is not given, because a button that is
   * not a toggle must not report a pressed state at all: `aria-pressed="false"`
   * on an ordinary action tells a reader there is a state here to watch.
   *
   * `IconButton` has had this since the actions slice. Having it on one shape
   * of the same control and not the other is the inconsistency, and Crystal's
   * own stylesheet has styled `button[aria-pressed=true]` throughout.
   */
  isSelected?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/* Crystal's own variant class names, as literals rather than module classes.
 *
 * `.cr-button.primary`, `.cr-button.quiet::before` and `.cr-button.danger` are
 * core's rules, and a hashed module class cannot satisfy them. Emitting the
 * plain names is what lets Crystal paint the variants too, which is the whole
 * point of the sweep — this library stopped re-describing them. */
const VARIANT_CLASS: Record<ButtonVariant, string | undefined> = {
  /* The reading pad in the action colour, with the palette's tested ink pair. */
  primary: 'primary',
  /* No pad at all: the label sits directly on the Resin shell. */
  quiet: 'quiet',
  /* An independent boundary rather than a fill, so the label's contrast never
     comes to depend on a status colour. */
  danger: 'danger',
  /* Resin is the base surface Crystal already applies to every `<button>`, so
     this variant adds nothing — it exists so `variant="resin"` is sayable
     rather than implicit. */
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

  /* `cr-button` is what makes Crystal the painter: core keys the Resin material
     on the `button` element and the geometry on this class, so wearing it is the
     whole of what this library has to do to look like Crystal. */
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
