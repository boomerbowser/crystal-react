'use client';

/* Menu.
 *
 * React Aria owns `role="menu"`, arrow-key movement, type-ahead, Escape, the
 * return of focus to the trigger and all submenu behaviour. Crystal owns the
 * surface, the rows and one semantic decision.
 *
 * A check mark in a menu means checked, and this is the only place in Crystal
 * where a check mark means that. Everywhere else it means validated or
 * informational, and selection is carried by label weight, never by a mark
 * beside the label, which offsets it. A checkable menu item is a checkbox in a
 * menu: it reports `aria-checked`, and a checkbox draws a check. The highlighted
 * row still uses weight.
 *
 * The space for the mark is reserved whether or not an item is checked, so the
 * rows do not shift sideways as they are ticked.
 */
import { useRef, useState, type ReactElement, type ReactNode, type RefObject } from 'react';
import {
  Menu as AriaMenu, MenuItem as AriaMenuItem, MenuTrigger as AriaMenuTrigger,
  SubmenuTrigger as AriaSubmenuTrigger, MenuSection, Header, Separator,
  Popover, Keyboard,
  type MenuProps as AriaMenuProps, type MenuTriggerProps as AriaMenuTriggerProps,
} from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import { useMotion } from '../../motion/useMotion.js';
import { Arrival } from '../../motion/Arrival.js';
import { Departure } from '../../motion/Departure.js';
import { SurfaceProvider, useOverlayMaterial, overlayMaterialProps, overlayMaterialClass } from '../../overlays/surface.js';
import styles from './Menu.module.scss';

const CheckIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M5 13l4 4L19 7" /></svg>
);
const ChevronIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
);

export interface MenuProps<T extends object> extends Omit<AriaMenuProps<T>, 'className'> {
  /** The menu's accessible name, when the trigger's own name is not enough. */
  label?: string;
  /**
   * What the surface positions against, when that is not the trigger. A context
   * menu opens at the pointer, so it points this at a one-pixel anchor placed
   * there.
   */
  triggerRef?: RefObject<HTMLElement | null>;
  className?: string;
}

/** The surface and the list. Put it inside a `MenuTrigger` with its trigger. */
export function Menu<T extends object>({
  label, triggerRef, className, ...props
}: MenuProps<T>): React.JSX.Element {
  const material = useOverlayMaterial();
  /* The catalogue's `menu-in` plays on the surface when it mounts to open, and
     `menu-out` as it closes. React Aria unmounts the popover when it closes,
     but holds an exiting overlay for its running animations, and `Departure`
     starts the recipe where React Aria will find it. */
  const [scope, play] = useMotion();

  return (
    <Popover
      {...(triggerRef ? { triggerRef } : {})}
      ref={scope as never}
      className={cx(styles['popover'], overlayMaterialClass(material))}
      {...overlayMaterialProps(material)}
    >
      {({ isExiting }) => (
        <>
          <Arrival play={play} recipe="menu-in" />
          <Departure isExiting={isExiting} play={play} recipe="menu-out" scope={scope} />
          {/* A submenu opened from here is opening on top of this surface. */}
          <SurfaceProvider surface={material}>
            <AriaMenu
              {...props}
              {...(label ? { 'aria-label': label } : {})}
              className={cx(styles['menu'], 'cr-scroll-resin', className)}
            />
          </SurfaceProvider>
        </>
      )}
    </Popover>
  );
}

export interface MenuItemProps {
  id?: string | number;
  /** What the item does. */
  children: ReactNode;
  /** The keystroke that does the same thing, shown and announced. */
  shortcut?: string;
  /** Makes this a checkable item: it reports `aria-checked` and draws a check. */
  isChecked?: boolean;
  isDisabled?: boolean;
  /** Marks a destructive action, which is stated in words and not in colour alone. */
  isDestructive?: boolean;
  onAction?: () => void;
  /**
   * Makes the item a link. React Aria then renders a real `<a>`, so the
   * browser's own affordances come with it: middle-click, open in a new tab, and
   * the status bar showing where it goes. An item that navigates without being a
   * link loses all of these.
   */
  href?: string;
  /** Where a link item opens. Only meaningful with `href`. */
  target?: string;
  /** What the item is called, when its children are not plain text. */
  textValue?: string;
  className?: string;
}

export function MenuItem({
  children, shortcut, isChecked, isDisabled = false, isDestructive = false,
  onAction, href, target, textValue, id, className,
}: MenuItemProps): React.JSX.Element {
  const checkable = isChecked !== undefined;

  return (
    <AriaMenuItem
      {...(id !== undefined ? { id } : {})}
      {...(textValue ? { textValue } : {})}
      isDisabled={isDisabled}
      {...(onAction ? { onAction } : {})}
      {...(href !== undefined ? { href } : {})}
      {...(target !== undefined ? { target } : {})}
      /* React Aria turns this into role="menuitemcheckbox" and aria-checked. */
      {...(checkable ? { selectionMode: 'multiple' as const } : {})}
      {...(isDestructive ? { 'data-destructive': true } : {})}
      className={cx(styles['item'], className)}
    >
      {checkable ? (
        <span
          className={cx(styles['mark'])}
          {...(isChecked ? {} : { 'data-hidden': true })}
          aria-hidden="true"
        >
          {CheckIcon}
        </span>
      ) : null}
      <span className={cx(styles['label'])}>{children}</span>
      {/* `Keyboard` is announced as the shortcut instead of read as loose text
         beside the label: "Save, Control S", not "Save Control S". */}
      {shortcut ? <Keyboard className={cx(styles['shortcut'])}>{shortcut}</Keyboard> : null}
    </AriaMenuItem>
  );
}

export interface MenuGroupProps {
  /** The group's heading. A heading is what makes a separator unnecessary. */
  label?: ReactNode;
  children: ReactNode;
  className?: string;
  /**
   * `single` makes the group a set of radio items: React Aria renders each as
   * `menuitemradio` with `aria-checked`. The chosen item is shown by label
   * weight and the selected fill, never by a check mark, which in Crystal means
   * validated. Use it for a choice of one, such as a playback speed.
   */
  selectionMode?: 'single';
  selectedKey?: string | number | null;
  onSelectionChange?: (key: string | number) => void;
}

export function MenuGroup({
  label, children, className, selectionMode, selectedKey, onSelectionChange,
}: MenuGroupProps): React.JSX.Element {
  return (
    <MenuSection
      className={cx(styles['section'], className)}
      {...(selectionMode ? {
        selectionMode,
        /* A choice of one is never empty, so the chosen item cannot be pressed
           off: pressing it again keeps it. */
        disallowEmptySelection: true,
        selectedKeys: selectedKey === null || selectedKey === undefined ? [] : [selectedKey],
        onSelectionChange: (keys: 'all' | Set<string | number>) => {
          if (keys === 'all') return;
          const [first] = [...keys];
          if (first !== undefined) onSelectionChange?.(first);
        },
      } : {})}
    >
      {label ? <Header className={cx(styles['heading'])}>{label}</Header> : null}
      {children}
    </MenuSection>
  );
}

/** A rule between groups, for when a heading would say nothing useful. */
export function MenuSeparator(): React.JSX.Element {
  return <Separator className={cx(styles['separator'])} />;
}

export interface SubmenuProps {
  /** The row that opens the submenu. */
  label: ReactNode;
  /** The nested `Menu`. Exactly one, which is what React Aria's trigger takes. */
  children: ReactElement;
  isDisabled?: boolean;
  textValue?: string;
}

/**
 * A menu inside a menu. React Aria owns all of it: the delay before it opens,
 * the diagonal the pointer may travel without closing it, right-arrow to enter
 * and left-arrow to leave.
 */
export function Submenu({ label, children, isDisabled = false, textValue }: SubmenuProps): React.JSX.Element {
  return (
    <AriaSubmenuTrigger>
      <AriaMenuItem
        isDisabled={isDisabled}
        {...(textValue ? { textValue } : {})}
        className={cx(styles['item'])}
      >
        <span className={cx(styles['label'])}>{label}</span>
        <span className={cx(styles['chevron'])} aria-hidden="true">{ChevronIcon}</span>
      </AriaMenuItem>
      {children}
    </AriaSubmenuTrigger>
  );
}

export interface MenuTriggerProps extends AriaMenuTriggerProps {}

export function MenuTrigger(props: MenuTriggerProps): React.JSX.Element {
  return <AriaMenuTrigger {...props} />;
}

export interface ContextMenuProps {
  /** The menu itself: a `Menu` with its items. */
  menu: (anchor: RefObject<HTMLElement | null>) => ReactElement;
  /** What right-clicking opens the menu on. */
  children: ReactNode;
  className?: string;
}

/**
 * A menu opened by right-click, and by the keyboard.
 *
 * React Aria has no primitive for this. The usual substitute, a long-press
 * trigger, is a different gesture and does not respond to the keyboard. The
 * pointer's position therefore becomes a one-pixel anchor, and the menu measures
 * against that instead of against a trigger.
 *
 * The keyboard route is required. Every operating system opens a context menu
 * without a mouse through Shift+F10 and the Menu key, and a context menu that
 * answers only the right mouse button is unavailable to a keyboard user. Opened
 * that way it appears at the element, because there is no pointer position.
 *
 * The keystroke is heard on the region, so it has to reach the region, and
 * something inside must be focusable: a row, a link, a button, whatever the menu
 * is about. The region is not made a tab stop itself, because that would add one
 * to every list item in an application. If nothing inside is focusable, there is
 * no keyboard route, and for most people no menu.
 */
export function ContextMenu({ menu, children, className }: ContextMenuProps): React.JSX.Element {
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  const anchor = useRef<HTMLElement | null>(null);
  const region = useRef<HTMLDivElement>(null);

  return (
    <>
      <div
        ref={region}
        className={className}
        onContextMenu={(event) => {
          event.preventDefault();
          setPoint({ x: event.clientX, y: event.clientY });
        }}
        onKeyDown={(event) => {
          if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return;
          event.preventDefault();
          const box = region.current?.getBoundingClientRect();
          setPoint({
            x: box ? box.left + box.width / 2 : 0,
            y: box ? box.top + box.height / 2 : 0,
          });
        }}
      >
        {children}
      </div>
      {/* Invisible, unreachable, and the only thing the surface measures against. */}
      <div
        ref={(node) => { anchor.current = node; }}
        aria-hidden="true"
        className={cx(styles['pointAnchor'])}
        style={{ left: point?.x ?? 0, top: point?.y ?? 0 }}
      />
      <AriaMenuTrigger
        isOpen={point !== null}
        onOpenChange={(open) => { if (!open) setPoint(null); }}
      >
        {/* React Aria requires a trigger element. This one is never seen, never
            focusable and never pressed. The gesture happens on the region above
            and the position comes from the anchor. */}
        <span hidden />
        {menu(anchor)}
      </AriaMenuTrigger>
    </>
  );
}
