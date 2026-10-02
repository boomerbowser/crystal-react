'use client';

/* ButtonGroup and SplitButton.
 *
 * A group is one Resin plane with its actions on it. The accessibility rule is
 * conditional: `role="group"` with a name when the actions are related, and
 * nothing at all when they are only adjacent. A group role without a name
 * announces "group" and tells the reader nothing, and three unrelated buttons
 * announced as a group tell them something untrue. The role is applied only
 * when a label is passed.
 *
 * A split button is two buttons, not one button with a menu attached. The
 * disclosure has its own name, its own `aria-expanded` and its own 44px target.
 * A single control that behaves differently depending on which half was pressed
 * cannot be described to somebody who cannot see the halves.
 */
import { forwardRef, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import { Button, type ButtonProps } from '../Button/Button.js';
import styles from './ButtonGroup.module.scss';

export interface ButtonGroupProps {
  /**
   * What the actions have in common. Passing it makes the group a named `group`;
   * omitting it leaves the buttons as themselves, which is right when they are
   * only adjacent.
   */
  label?: string;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  children?: ReactNode;
}

export function ButtonGroup({
  label, orientation = 'horizontal', className, children,
}: ButtonGroupProps): React.JSX.Element {
  return (
    <div
      {...(label ? { role: 'group', 'aria-label': label } : {})}
      className={cx(
        'cr-group',
        orientation === 'vertical' ? 'vertical' : undefined,
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface SplitButtonProps extends Omit<ButtonProps, 'children'> {
  /** The default action's label. */
  children: ReactNode;
  /** What the disclosure opens. Used for its name, so it is not a second "More". */
  menuLabel: string;
  /** Whether the menu is open. The product owns the menu itself. */
  isOpen?: boolean;
  onToggleMenu?: () => void;
  /** A name for the pair, when the two belong together. */
  label?: string;
  className?: string;
}

const ChevronIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export const SplitButton = forwardRef<HTMLButtonElement, SplitButtonProps>(function SplitButton(
  { children, menuLabel, isOpen = false, onToggleMenu, label, className, variant = 'primary', ...props },
  ref,
) {
  return (
    <ButtonGroup {...(label ? { label } : {})} {...(className ? { className } : {})}>
      {/* Both halves take the same variant. If the disclosure and the action
          differed, they would look like two different controls, which a split
          button must never do. */}
      <Button {...props} variant={variant} ref={ref}>{children}</Button>
      {/* Its own button, its own name, its own target. A split control whose two
          halves share one name cannot be described to somebody who cannot see
          that there are two. */}
      <Button
        variant={variant}
        aria-label={menuLabel}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onPress={() => onToggleMenu?.()}
        className={cx(styles['disclosure'])}
      >
        {ChevronIcon}
      </Button>
    </ButtonGroup>
  );
});
