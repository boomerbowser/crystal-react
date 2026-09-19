'use client';

/* Dialog.
 *
 * React Aria's Modal and Dialog own focus containment, the return of focus on
 * close, Escape handling, scroll locking and `aria-modal`. Crystal owns the
 * materials and the movement.
 *
 * The material assignment is the part worth stating, because it is easy to get
 * backwards: the surface is **Haze**, not Resin. Resin is the floating control
 * plane; a dialog is content to be read, so it is an 80% feathered content fill,
 * and what separates it from the page is the Mirage scrim beneath rather than
 * elevation above.
 *
 * The body scrolls, not the surface. A dialog that overflows on a phone was the
 * defect Meridian reported from the deployed preview, and a surface that both
 * carries a material and scrolls cannot take the edge fade — a mask dissolves the
 * element's own fill and border along with its content. Keeping the title out of
 * the scroller is the better behaviour regardless: context that scrolls away is
 * context lost.
 *
 * Exit motion is why this uses `AnimatePresence`. Without it a closing dialog
 * unmounts immediately and its dismissal never plays — the animation and the
 * element race, and the element wins. `AnimatePresence` holds the subtree mounted
 * until the exit settles, which is the whole reason the React binding is better
 * here than a hand-rolled one.
 */
import { useId, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Modal,
  ModalOverlay,
  Dialog as AriaDialog,
  Heading,
  type ModalOverlayProps,
} from 'react-aria-components';
import { usePreset } from '../../motion/usePreset.js';
import { ScrollArea } from '../ScrollArea/ScrollArea.js';
import { cx } from '../../styles/cx.js';
import { SurfaceProvider } from '../../overlays/surface.js';
import styles from './Dialog.module.scss';

export interface DialogProps extends Omit<ModalOverlayProps,
  'className' | 'children' | 'style' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'> {
  /** The dialog's accessible name, rendered as its heading. */
  title: ReactNode;
  children?: ReactNode;
  className?: string;
  /**
   * Whether the scrim dismisses on click. Defaults to React Aria's behaviour.
   * A destructive or unsaved-work dialog should set this false so a stray click
   * cannot discard work.
   */
  isDismissable?: boolean;
}

/* React's DOM `onAnimationStart` event and Motion's lifecycle callback of the
   same name collide, and under `exactOptionalPropertyTypes` that is a hard error
   rather than a merge. Dropping the DOM event from the wrapped surface is the
   narrow fix: an overlay has no use for CSS animation events, and Motion's
   callback is the one a caller would actually reach for. */
type OverlayProps = Omit<ModalOverlayProps, 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'>;
const MotionOverlay = motion.create(
  ModalOverlay as React.ForwardRefExoticComponent<OverlayProps & React.RefAttributes<HTMLDivElement>>,
);

export function Dialog({ title, children, className, ...props }: DialogProps): React.JSX.Element {
  const titleId = useId();
  /* `anchored` is true because a dialog is fixed to the page rather than floating
     above it: Crystal's dismissal fades an anchored surface and drops an
     unanchored one. */
  const [scope] = usePreset({ anchored: true });

  return (
    <AnimatePresence>
      {props.isOpen ? (
        <MotionOverlay
          {...props}
          isOpen
          className={cx(styles['scrim'])}
          /* The scrim's own wash. Opacity only — a backdrop-filtered surface is
             expensive enough to composite without animating its geometry too. */
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Modal>
            <AriaDialog
              ref={scope as never}
              aria-labelledby={titleId}
              className={cx(styles['dialog'], className)}
            >
              <Heading slot="title" id={titleId} className={cx(styles['title'])}>
                {title}
              </Heading>
              {/* A dialog is a reading surface, so its scrollbar is the Frost one —
                  and it is on the body rather than the surface, because the
                  surface is what carries the material. */}
              <ScrollArea variant="frost" className={cx(styles['body'])}>
                {/* A dialog is Haze, so anything opened from inside it is opening
                    on top of Haze and recesses rather than floating. Resin never
                    contains Resin, and the DOM cannot say so — an overlay is
                    portalled to `body` and loses its nesting on the way. */}
                <SurfaceProvider surface="haze">{children}</SurfaceProvider>
              </ScrollArea>
            </AriaDialog>
          </Modal>
        </MotionOverlay>
      ) : null}
    </AnimatePresence>
  );
}
