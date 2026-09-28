'use client';

/* Tooltip.
 *
 * The rule that matters more than the appearance: **a tooltip is never the sole
 * accessible name.** It supplements a name that already exists. A control whose
 * only label is a tooltip is unusable by touch, unusable by a screen reader that
 * does not surface `aria-describedby`, and unreadable the moment the pointer
 * moves — `IconButton` takes a `label` for that reason, and this is what goes
 * beside it, not instead of it.
 *
 * React Aria handles the rest of what the catalogue asks: it opens on focus as
 * well as hover, so a keyboard reaches it; it stays open while the pointer is
 * over the tooltip itself, so a link inside one can be clicked; and Escape
 * dismisses it. A tooltip built on hover alone has none of those.
 */
import type { ReactNode } from 'react';
import {
  Tooltip as AriaTooltip, TooltipTrigger as AriaTooltipTrigger,
  type TooltipProps as AriaTooltipProps, type TooltipTriggerComponentProps,
} from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import { useMotion } from '../../motion/useMotion.js';
import { Arrival } from '../../motion/Arrival.js';
import { OverlayArrow } from '../OverlayArrow/OverlayArrow.js';
import styles from './Tooltip.module.scss';

export interface TooltipProps extends Omit<AriaTooltipProps, 'className' | 'children'> {
  hasArrow?: boolean;
  children: ReactNode;
  className?: string;
}

export function Tooltip({
  hasArrow = true, children, className, ...props
}: TooltipProps): React.JSX.Element {
  /* `tooltip-in` on the mount that is the opening; `tooltip-out` is owed and not
     yet played, for the reason given in Menu. */
  const [scope, play] = useMotion();
  return (
    <AriaTooltip
      {...props}
      ref={scope as never}
      /* Frost, always — a transient overlay is Frost (Crystal R15e), and a
         tooltip does not step down inside a dialog because it is not competing
         with the dialog for depth: it is a small panel that lands where the
         pointer is, above whatever is there. */
      data-cr-overlay="frost"
      className={cx(styles['tooltip'], 'cr-frost', className)}
    >
      <Arrival play={play} recipe="tooltip-in" />
      {hasArrow ? <OverlayArrow /> : null}
      {children}
    </AriaTooltip>
  );
}

export interface TooltipTriggerProps extends TooltipTriggerComponentProps {}

/**
 * Wraps a control and its tooltip. `delay` is React Aria's: the wait before the
 * first tooltip in a group appears, after which the rest appear at once, so
 * moving along a toolbar does not stutter.
 */
export function TooltipTrigger(props: TooltipTriggerProps): React.JSX.Element {
  return <AriaTooltipTrigger delay={700} closeDelay={200} {...props} />;
}
