'use client';

/* Popover.
 *
 * An anchored surface holding arbitrary content. React Aria owns the positioning,
 * the flipping when there is no room, the dismissal and the focus behaviour;
 * Crystal owns which material it is made of, and that is the interesting part.
 *
 * **A transient overlay is Frost** (Crystal R15e). A popover opened from the
 * page is a panel that opens over content, and it is Frost. The same popover
 * opened inside a dialog or a drawer is opening over a surface that is already a
 * pane, and two panes of diffused glass stacked read as neither — so it recesses
 * into Haze instead. The decision is made in React because the DOM cannot make it:
 * every overlay is portalled to a container on `body` and loses its nesting on
 * the way there. See `src/overlays/surface.tsx`.
 */
import type { ReactNode } from 'react';
import {
  Popover as AriaPopover, Dialog, DialogTrigger,
  type PopoverProps as AriaPopoverProps,
} from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import { useMotion } from '../../motion/useMotion.js';
import { Arrival } from '../../motion/Arrival.js';
import { Departure } from '../../motion/Departure.js';
import { SurfaceProvider, useOverlayMaterial, overlayMaterialProps, overlayMaterialClass } from '../../overlays/surface.js';
import { OverlayArrow } from '../OverlayArrow/OverlayArrow.js';
import styles from './Popover.module.scss';

export interface PopoverProps extends Omit<AriaPopoverProps, 'className' | 'children'> {
  /** The popover's accessible name. Required: a surface focus moves into needs one. */
  label: string;
  /** Point at the trigger. Off by default — an arrow is a claim about position. */
  hasArrow?: boolean;
  children: ReactNode;
  className?: string;
}

export function Popover({
  label, hasArrow = false, children, className, ...props
}: PopoverProps): React.JSX.Element {
  const material = useOverlayMaterial();
  /* `popover-in` on the mount that is the opening; `popover-out` as it closes,
     held on screen by React Aria until it has played (see `Departure`). */
  const [scope, play] = useMotion();

  return (
    <AriaPopover {...props} ref={scope as never} className={cx(styles['popover'], overlayMaterialClass(material), className)} {...overlayMaterialProps(material)}>
      {({ isExiting }) => (
        <>
          <Arrival play={play} recipe="popover-in" />
          <Departure isExiting={isExiting} play={play} recipe="popover-out" scope={scope} />
          {hasArrow ? <OverlayArrow /> : null}
          {/* A `Dialog` rather than a bare div, because React Aria puts the focus
              behaviour there: content a person can reach has to be reachable and
              has to give focus back. A popover holding only text is still a place
              focus can land, and still needs a name. */}
          <Dialog aria-label={label} className={cx(styles['body'])}>
            {/* Anything opened from inside this is opening on top of it. */}
            <SurfaceProvider surface={material}>{children}</SurfaceProvider>
          </Dialog>
        </>
      )}
    </AriaPopover>
  );
}

export { DialogTrigger as PopoverTrigger };
