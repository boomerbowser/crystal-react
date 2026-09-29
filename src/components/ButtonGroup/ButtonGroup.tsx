'use client';

/* ButtonGroup and SplitButton.
 *
 * A group is one Resin plane with its actions on it, and the accessibility rule
 * is conditional in a way that is easy to get wrong: `role="group"` **with a
 * name** when the actions are related, and nothing at all when they are merely
 * adjacent. A group role without a name announces "group" and tells the reader
 * nothing; three unrelated buttons in a row announced as a group tells them
 * something untrue. So the role is earned by passing a label.
 *
 * A split button is two buttons, not one button with a menu attached. That
 * matters because the disclosure has its own name, its own `aria-expanded` and
 * its own 44px target — a single control that behaves differently depending on
 * which half was pressed is not describable to somebody who cannot see the halves.
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
  /** What the disclosure opens — used for its name, so it is not a second "More". */
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
      {/* Both halves take the same variant. They looked like two different
          controls when the disclosure defaulted to primary and the action did
          not — which is what a split button must never look like. */}
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
