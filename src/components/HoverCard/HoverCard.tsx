'use client';

/* HoverCard — a preview that opens on hover or focus after a delay.
 *
 * **It opens on focus, not only on hover.** A card that appears on hover alone
 * is unreachable from the keyboard and invisible on touch, which makes whatever
 * it previews unreachable too. This is the same rule the tooltip follows and the
 * most common way this component is built wrong.
 *
 * **The delay is the component.** Too short and it fires as the pointer crosses
 * on its way somewhere else, filling the screen with cards nobody asked for.
 * Too long and it reads as broken. The close delay matters as much: the pointer
 * has to travel from the trigger *into* the card, and any gap between them is
 * time the card can decide to close underneath a pointer that is on its way in.
 *
 * **An intent counter, not a boolean.** The trigger and the card each report
 * entering and leaving. Closing on the first leave would close the card the
 * instant the pointer crosses from one to the other; counting means the card
 * stays open as long as the pointer is over *either*, and closes when it is
 * over neither. This is the same defect the disclosure, popover, menu and toast
 * closures already solved with a counter, recorded in the plan as "an intent
 * counter so a stale completion cannot hide a reopened component".
 *
 * **It is never the sole accessible name.** Like the tooltip: the trigger has
 * its own name, and this supplements it. A card is a preview of a destination,
 * not the destination's label.
 *
 * **A transient overlay is Frost** (Crystal R15e). Opened from the page it is
 * Frost; opened inside a dialog or a drawer it recesses to Haze, decided in React
 * because the DOM cannot decide it — the card is portalled and loses its nesting
 * on the way.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Popover as AriaPopover, Dialog, DialogTrigger } from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import { useMotion } from '../../motion/useMotion.js';
import { Arrival } from '../../motion/Arrival.js';
import { Departure } from '../../motion/Departure.js';
import { SurfaceProvider, useOverlayMaterial, overlayMaterialProps, overlayMaterialClass } from '../../overlays/surface.js';
import styles from './HoverCard.module.scss';

export interface HoverCardProps {
  /** The control the card previews. Keeps its own accessible name. */
  trigger: ReactNode;
  /** The card's accessible name — it is a surface focus can move into. */
  label: string;
  children: ReactNode;
  /** How long the pointer must rest before it opens. */
  openDelay?: number;
  /** How long it waits after the pointer leaves both trigger and card. */
  closeDelay?: number;
  className?: string;
}

export function HoverCard({
  trigger, label, children, openDelay = 500, closeDelay = 300, className,
}: HoverCardProps): React.JSX.Element {
  const material = useOverlayMaterial();
  /* A hover card is a popover that opens on intent: `popover-in`, as the
     catalogue assigns it, on the mount that is the opening. */
  const [scope, play] = useMotion();
  const [isOpen, setOpen] = useState(false);
  /* How many of {trigger, card} the pointer or focus is currently within.
     A boolean would close the card the instant the pointer crossed the gap
     between them, which is the one journey the component has to survive. */
  const within = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = (): void => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
  };
  useEffect(() => clear, []);

  const enter = useCallback(() => {
    within.current += 1;
    clear();
    if (!isOpen) timer.current = setTimeout(() => { setOpen(true); }, openDelay);
  }, [isOpen, openDelay]);

  const leave = useCallback(() => {
    within.current = Math.max(0, within.current - 1);
    clear();
    if (within.current === 0) timer.current = setTimeout(() => { setOpen(false); }, closeDelay);
  }, [closeDelay]);

  const intent = {
    onPointerEnter: enter,
    onPointerLeave: leave,
    onFocus: enter,
    onBlur: leave,
  };

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={setOpen}>
      <span className={cx(styles['trigger'])} {...intent}>{trigger}</span>
      <AriaPopover
        {...overlayMaterialProps(material)}
        ref={scope as never}
        className={cx(styles['card'], overlayMaterialClass(material), className)}
      >
        {({ isExiting }) => (
          <>
            <Arrival play={play} recipe="popover-in" />
            <Departure isExiting={isExiting} play={play} recipe="popover-out" scope={scope} />
            <SurfaceProvider surface={material}>
              {/* The card is hoverable: the pointer travelling into it must not
                  close it, which is what the counter is for. */}
              <Dialog aria-label={label} className={cx(styles['body'])} {...intent}>
                {children}
              </Dialog>
            </SurfaceProvider>
          </>
        )}
      </AriaPopover>
    </DialogTrigger>
  );
}
