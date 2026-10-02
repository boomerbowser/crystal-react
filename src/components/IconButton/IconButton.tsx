'use client';

/* IconButton and CloseButton.
 *
 * An icon has no text, so the accessible name is the only name the control has.
 * `label` is required, which makes an unnamed icon button a compile error
 * instead of an audit finding.
 *
 * The icon itself is `aria-hidden`. A screen reader reading both the icon's own
 * title and the button's label says the thing twice.
 *
 * `CloseButton` is an IconButton with one extra requirement from the catalogue:
 * the name says what closes. A page with three dismissible things has three
 * buttons called "Close", and a screen reader user listing the controls learns
 * nothing. So `closes` is required and the name is built from it.
 *
 * Escape must do the same thing. That belongs to whatever owns the container
 * (`Dialog` gets it from React Aria). It is stated here because a close button
 * added to something that does not handle Escape only half dismisses it.
 */
import { forwardRef, useEffect, type ReactNode } from 'react';
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components';
import { useMotion } from '../../motion/useMotion.js';
import { cx } from '../../styles/cx.js';
import { mergeRefs } from '../../utils/mergeRefs.js';
import styles from './IconButton.module.scss';

export interface IconButtonProps extends Omit<AriaButtonProps, 'className' | 'children' | 'style'> {
  /** What the control does. Required: an icon has no other name. */
  label: string;
  /** The icon. Hidden from assistive technology. The label is the name. */
  icon: ReactNode;
  /** `resin` floats it as a control plane; `quiet` sits on the surface it is on. */
  variant?: 'quiet' | 'resin';
  /** A circle rather than a pill. For a single round action. */
  circle?: boolean;
  /** Toggle state. Present makes the control a toggle and announces it as one. */
  isSelected?: boolean;
  className?: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, variant = 'quiet', circle = false, isSelected, className, ...props },
  ref,
) {
  const [scope, play] = useMotion();
  /* A disclosure's icon plays `icon-turn` when what it discloses opens or
     closes. It follows the expanded state, which is authoritative, and never
     plays on the render that first shows it. The state is read from the
     rendered `aria-expanded`, because a menu or a disclosure hands it to its
     trigger through React Aria's context, which this component never sees as a
     prop. An icon button that discloses nothing has no `aria-expanded`, and its
     icon never turns. */
  const [turn, playTurn] = useMotion();
  useEffect(() => {
    const button = scope.current as HTMLElement | null;
    if (!button || typeof MutationObserver === 'undefined') return undefined;
    let was = button.getAttribute('aria-expanded');
    const watcher = new MutationObserver(() => {
      const is = button.getAttribute('aria-expanded');
      if (was !== null && is !== null && is !== was) void playTurn('icon-turn');
      was = is;
    });
    watcher.observe(button, { attributes: true, attributeFilter: ['aria-expanded'] });
    return () => { watcher.disconnect(); };
  }, [scope, playTurn]);

  return (
    <AriaButton
      {...props}
      ref={mergeRefs(scope as never, ref)}
      aria-label={label}
      {...(isSelected === undefined ? {} : { 'aria-pressed': isSelected })}
      onPressStart={() => play('press')}
      className={cx(
        styles['iconButton'],
        /* Nothing for `resin`: Crystal paints every `<button>` as a Resin
           control already, so the variant is the absence of a class. `quiet`
           takes that coat off. */
        variant === 'resin' ? undefined : styles['quiet'],
        circle ? styles['circle'] : undefined,
        className,
      )}
    >
      <span ref={turn as never} aria-hidden="true" className={styles['icon']}>{icon}</span>
    </AriaButton>
  );
});

export interface CloseButtonProps extends Omit<IconButtonProps, 'label' | 'icon'> {
  /**
   * What this dismisses, such as "the filters panel" or "this notification".
   * The name
   * becomes "Close <closes>", because a page with three things called "Close"
   * tells a screen reader user nothing about any of them.
   */
  closes: string;
  icon?: ReactNode;
}

const CrossIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const CloseButton = forwardRef<HTMLButtonElement, CloseButtonProps>(function CloseButton(
  { closes, icon = CrossIcon, ...props },
  ref,
) {
  return <IconButton {...props} ref={ref} label={`Close ${closes}`} icon={icon} />;
});
