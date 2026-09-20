'use client';

/* Menubar — a horizontal bar of menu triggers, each opening its own menu.
 *
 * **This is a menu bar, and the word is load-bearing.** `role="menubar"` is
 * for an application's command surface — File, Edit, View — where every item
 * performs an action. It is the wrong role for site navigation, which is what
 * `NavigationMenu` is for, and putting links inside a `menubar` tells a screen
 * reader that following one runs a command rather than goes somewhere. The two
 * components exist separately because the roles are not interchangeable and
 * choosing by appearance is how the wrong one gets used.
 *
 * **One tab stop for the whole bar.** A menubar is a composite widget: Tab
 * enters it and Tab leaves it, and the arrow keys move between triggers inside.
 * A bar where every trigger is its own tab stop makes a ten-item menu bar ten
 * presses deep, which is the difference between a keyboard being usable and
 * being technically possible.
 *
 * **Roving `tabindex`, and it follows the last place you were.** Leaving the
 * bar and coming back should return to where you left, not to the beginning —
 * otherwise every return journey starts over.
 *
 * **Home and End, because a bar can be long.** Arrow keys wrap, which is what
 * the pattern specifies and what makes a short bar quick.
 */
import { useCallback, useRef, useState, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import styles from './Menubar.module.scss';

export interface MenubarProps {
  /**
   * The triggers. Each child is one menu trigger — typically a `MenuTrigger`
   * wrapping a `Button` and a `Menu`.
   */
  children: ReactNode;
  /** Names the bar, so two command surfaces are distinguishable. */
  'aria-label'?: string;
  className?: string;
}

export function Menubar({ children, className, ...props }: MenubarProps): React.JSX.Element {
  const bar = useRef<HTMLDivElement | null>(null);
  /* Which trigger holds the bar's single tab stop. Remembered, so returning to
     the bar returns to where you left rather than to the beginning. */
  const [focused, setFocused] = useState(0);

  const triggers = useCallback((): HTMLElement[] => {
    const node = bar.current;
    if (!node) return [];
    return [...node.querySelectorAll<HTMLElement>('[data-menubar-item]')]
      .filter((element) => !element.hasAttribute('disabled'));
  }, []);

  const moveTo = useCallback((index: number): void => {
    const items = triggers();
    if (items.length === 0) return;
    /* Wrapping, which is what the pattern specifies and what makes a short bar
       quick — the last item's right arrow reaches the first in one press. */
    const next = ((index % items.length) + items.length) % items.length;
    setFocused(next);
    items[next]?.focus();
  }, [triggers]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    const items = triggers();
    const current = items.findIndex((item) => item === document.activeElement);
    if (current === -1) return;
    switch (event.key) {
      case 'ArrowRight': event.preventDefault(); moveTo(current + 1); break;
      case 'ArrowLeft': event.preventDefault(); moveTo(current - 1); break;
      case 'Home': event.preventDefault(); moveTo(0); break;
      case 'End': event.preventDefault(); moveTo(items.length - 1); break;
      default: break;
    }
  };

  return (
    <div
      ref={bar}
      role="menubar"
      aria-label={props['aria-label'] ?? 'Commands'}
      aria-orientation="horizontal"
      onKeyDown={onKeyDown}
      onFocusCapture={(event) => {
        const index = triggers().findIndex((item) => item === event.target);
        if (index !== -1) setFocused(index);
      }}
      className={cx(styles['menubar'], className)}
    >
      <MenubarRovingIndex index={focused}>{children}</MenubarRovingIndex>
    </div>
  );
}

/* The single tab stop, applied to the DOM rather than threaded through every
   child's props: the children are `MenuTrigger`s whose buttons this component
   does not construct, so it cannot pass them a `tabIndex`. */
function MenubarRovingIndex({ index, children }: { index: number; children: ReactNode }): React.JSX.Element {
  const host = useRef<HTMLDivElement | null>(null);

  const apply = useCallback((node: HTMLDivElement | null) => {
    host.current = node;
    if (!node) return;
    const items = [...node.querySelectorAll<HTMLElement>('button, [role="menuitem"]')]
      .filter((element) => element.closest('[role="menubar"]') && !element.closest('[role="menu"]'));
    items.forEach((item, position) => {
      item.setAttribute('data-menubar-item', '');
      /* `role="menubar"` must contain `menuitem`s. React Aria's `MenuTrigger`
         gives its trigger `role="button"` with `aria-haspopup`, which is right
         standing alone and invalid inside a menu bar — axe fails it as
         `aria-required-children`, and no test that queries the bar or its
         triggers by role can see it, because both report the role asked for.
         Set here rather than asked of the caller: a contract a consumer has to
         remember is a contract that is wrong in somebody's product. */
      if (item.getAttribute('role') !== 'menuitem') item.setAttribute('role', 'menuitem');
      item.tabIndex = position === index ? 0 : -1;
    });
  }, [index]);

  /* `role="none"`, so the bar's children in the accessibility tree are the
     triggers rather than this wrapper — a generic element between a `menubar`
     and its `menuitem`s breaks the same required-children rule. */
  return <div ref={apply} role="none" className={cx(styles['items'])}>{children}</div>;
}
