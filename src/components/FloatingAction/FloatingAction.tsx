'use client';

/* FloatingAction, SpeedDial and ActionBar.
 *
 * The three Resin surfaces that float above content. A control pinned to the
 * bottom of a viewport covers whatever is underneath it: at the end of a list
 * that is the last item, and at any moment it may be the focused element.
 *
 * Crystal owns the material, the elevation and the safe-area offset. The page
 * owns the space it leaves underneath (`scroll-padding-block-end` on the
 * scrolling container, or a spacer at the end of the list), because only the
 * page knows its content. Each component's documentation says so.
 *
 * `SpeedDial`'s actions are pills with visible labels, never icons alone, as the
 * catalogue requires. An icon in a set that appeared a moment ago has no
 * surrounding context to be read from. In a toolbar an icon can be learned, but
 * that does not apply to something transient.
 *
 * `ActionBar` announces how many items are selected. Somebody who cannot see the
 * bar appear would not otherwise know a selection exists, so the count is a live
 * region that reports the bar's arrival and the size of the selection together.
 */
import { forwardRef, useState, type ReactNode } from 'react';
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components';
import { useMotion } from '../../motion/useMotion.js';
import { cx } from '../../styles/cx.js';
import { AnimatePresence } from 'motion/react';
import { usePresenceMotion } from '../../motion/ListPresence.js';
import { mergeRefs } from '../../utils/mergeRefs.js';
import { Button } from '../Button/Button.js';
import { Toolbar } from '../Toolbar/Toolbar.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import styles from './FloatingAction.module.scss';

export interface FloatingActionProps extends Omit<AriaButtonProps, 'className' | 'children' | 'style'> {
  /** What the action does. Required: a circular icon control has no other name. */
  label: string;
  icon: ReactNode;
  /**
   * Show the label beside the icon, as a pill. The circle is the compact form of
   * the same control.
   */
  isExtended?: boolean;
  className?: string;
}

export const FloatingAction = forwardRef<HTMLButtonElement, FloatingActionProps>(
  function FloatingAction({ label, icon, isExtended = false, className, ...props }, ref) {
    const [scope, play] = useMotion();

    return (
      <AriaButton
        {...props}
        ref={mergeRefs(scope as never, ref)}
        aria-label={label}
        onPressStart={() => play('press')}
        className={cx(styles['floating'], isExtended ? styles['extended'] : undefined, className)}
      >
        <span aria-hidden="true">{icon}</span>
        {isExtended ? <span>{label}</span> : null}
      </AriaButton>
    );
  },
);

export interface SpeedDialAction {
  id: string;
  label: string;
  icon?: ReactNode;
  onPress: () => void;
}

export interface SpeedDialProps extends Omit<FloatingActionProps, 'onPress'> {
  /** The actions it expands into. Each keeps a visible label. */
  actions: readonly SpeedDialAction[];
}

export function SpeedDial({ actions, label, icon, ...props }: SpeedDialProps): React.JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* The actions arrive with `menu-in` as the dial opens and leave with
          `menu-out` as it closes, held in presence so they can be seen going. */}
      <AnimatePresence initial={false}>
        {open ? (
          <DialGroup key="dial" aria-label={label}>
            {actions.map((action) => (
              <Button
                key={action.id}
                variant="resin"
                onPress={() => { action.onPress(); setOpen(false); }}
              >
                {action.icon ? <span aria-hidden="true">{action.icon}</span> : null}
                {/* Always visible. An icon in a set that appeared a moment ago has
                    no context to be read from. */}
                {action.label}
              </Button>
            ))}
          </DialGroup>
        ) : null}
      </AnimatePresence>
      <FloatingAction
        {...props}
        label={label}
        icon={icon}
        aria-expanded={open}
        onPress={() => setOpen((was) => !was)}
      />
    </>
  );
}

export interface ActionBarProps {
  /** Whether a selection exists. The bar is absent, not hidden, when it does not. */
  isVisible: boolean;
  /** How many items are selected. Announced, because the bar's arrival is news. */
  selectedCount: number;
  /** What the bar is for. Names the toolbar. */
  label?: string;
  children?: ReactNode;
  className?: string;
}

export function ActionBar({
  isVisible, selectedCount, label = 'Selection actions', children, className,
}: ActionBarProps): React.JSX.Element | null {
  if (!isVisible) return null;

  return (
    <Toolbar variant="resin" aria-label={label} className={cx(styles['actionBar'], className)}>
      <span className={cx(styles['count'])}>{selectedCount} selected</span>
      {children}
      {/* Announces the bar's arrival and the size of the selection together,
          for somebody who cannot see the bar. */}
      <VisuallyHidden as="div" role="status" aria-live="polite">
        {`${selectedCount} selected. ${label} available.`}
      </VisuallyHidden>
    </Toolbar>
  );
}

function DialGroup({ children, ...props }: { children: ReactNode; 'aria-label': string }): React.JSX.Element {
  const presence = usePresenceMotion('menu-in', 'menu-out');
  return <div {...props} ref={presence as never} role="group" className={cx(styles['dial'])}>{children}</div>;
}
