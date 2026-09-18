'use client';

/* FloatingAction, SpeedDial and ActionBar.
 *
 * The three Resin surfaces that float above content, and the three places the
 * same mistake gets made: a control pinned to the bottom of a viewport covers
 * whatever is underneath it, which at the end of a list is the last item and at
 * any moment might be the focused element.
 *
 * Crystal owns the material, the elevation and the safe-area offset. What it
 * cannot own is the space the page leaves underneath — `scroll-padding-block-end`
 * on the scrolling container, or a spacer at the end of the list — because only
 * the page knows what its content is. That is said in each component's
 * documentation rather than left to be discovered at the bottom of a list.
 *
 * `SpeedDial`'s actions are pills with visible labels, never icons alone. The
 * catalogue is explicit, and the reason is that an icon in a set which appeared a
 * moment ago has no surrounding context to be read from — the toolbar case, where
 * an icon is learnable, does not apply to something transient.
 *
 * `ActionBar` announces how many items are selected. A bar that appears when a
 * selection exists is invisible to somebody who cannot see it appear, so the
 * count is a live region: the arrival of the bar and the size of the selection
 * are the same piece of news.
 */
import { forwardRef, useState, type ReactNode } from 'react';
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components';
import { useMotion } from '../../motion/useMotion.js';
import { cx } from '../../styles/cx.js';
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
   * the same control rather than a different one.
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
      {open ? (
        <div className={cx(styles['dial'])} role="group" aria-label={label}>
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
        </div>
      ) : null}
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
    <Toolbar aria-label={label} className={cx(styles['actionBar'], className)}>
      <span className={cx(styles['count'])}>{selectedCount} selected</span>
      {children}
      {/* The bar appearing and the size of the selection are the same piece of
          news, and neither is visible to somebody who cannot see the bar. */}
      <VisuallyHidden as="div" role="status" aria-live="polite">
        {`${selectedCount} selected. ${label} available.`}
      </VisuallyHidden>
    </Toolbar>
  );
}
