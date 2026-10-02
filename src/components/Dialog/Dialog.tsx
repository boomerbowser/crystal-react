'use client';

/* Dialog.
 *
 * React Aria's Modal and Dialog own focus containment, the return of focus on
 * close, Escape handling, scroll locking and `aria-modal`. Crystal owns the
 * materials and the movement.
 *
 * The surface is Haze, not Resin. Resin is the floating control plane. A dialog
 * is content to be read, so it is an 80% feathered content fill, and the Mirage
 * scrim beneath it separates it from the page. It has no elevation above.
 *
 * The body scrolls and the surface does not, so a dialog that overflows on a
 * phone still works. A surface that both carries a material and scrolls cannot
 * take the edge fade, because the mask dissolves the element's own fill and
 * border along with its content. The title stays out of the scroller so it
 * remains visible.
 *
 * `AnimatePresence` is there for the exit motion. Without it a closing dialog
 * unmounts immediately and its dismissal never plays. `AnimatePresence` keeps the
 * subtree mounted until the exit settles.
 */
import { useId, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Modal,
  ModalOverlay,
  Dialog as AriaDialog,
  Heading,
  type ModalOverlayProps,
  type DialogProps as AriaDialogProps,
} from 'react-aria-components';
import { usePresetMotion } from '../../motion/usePresetMotion.js';
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
  /**
   * `alertdialog` for a dialog that interrupts to ask something that cannot
   * wait, such as unsaved work or a destructive confirmation. A screen reader
   * then announces it as an alert as well as moving into it.
   */
  role?: 'dialog' | 'alertdialog';
}

/* React's DOM `onAnimationStart` event and Motion's lifecycle callback of the
   same name collide, and under `exactOptionalPropertyTypes` the collision is a
   type error. The DOM events are dropped from the wrapped surface. An overlay has
   no use for CSS animation events, and a caller wants Motion's callback. */
type OverlayProps = Omit<ModalOverlayProps, 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'>;
const MotionOverlay = motion.create(
  ModalOverlay as React.ForwardRefExoticComponent<OverlayProps & React.RefAttributes<HTMLDivElement>>,
);
type SurfaceProps = Omit<AriaDialogProps, 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'>;
const MotionDialog = motion.create(
  AriaDialog as React.ForwardRefExoticComponent<SurfaceProps & React.RefAttributes<HTMLElement>>,
);

export function Dialog({ title, children, className, role = 'dialog', ...props }: DialogProps): React.JSX.Element {
  const titleId = useId();
  /* The catalogue gives a dialog three movements. `mirage` and `mirage-out` are
     the scrim's wash, the chromatic diffusion revealing from an edge and
     withdrawing toward the opposite one. `dismiss` is the surface's departure. A
     dialog is anchored to the page, so its dismissal fades and does not fall.
     The Haze surface has no arrival of its own. It is defined by its paint, and
     the scrim's reveal brings it in. */
  const wash = usePresetMotion('mirage', 'mirage-out', { active: props.isOpen === true });
  const dismissal = usePresetMotion(null, 'dismiss', { anchored: true, active: props.isOpen === true });

  return (
    <AnimatePresence>
      {props.isOpen ? (
        <MotionOverlay
          {...props}
          isOpen
          className={cx(styles['scrim'], 'cr-mirage')}
          {...wash}
        >
          <Modal className={cx(styles['modal'])}>
            <MotionDialog
              role={role}
              aria-labelledby={titleId}
              className={cx(styles['dialog'], 'cr-dialog', className)}
              {...dismissal}
            >
              <Heading slot="title" id={titleId} className={cx(styles['title'])}>
                {title}
              </Heading>
              {/* A dialog is a reading surface, so its scrollbar is the Frost one.
                  It is on the body and not the surface, because the surface
                  carries the material. */}
              <ScrollArea variant="frost" className="cr-dialog-body">
                {/* A dialog is Haze, so anything opened from inside it opens on
                    top of Haze and recesses instead of floating. Resin never
                    contains Resin. The DOM cannot express this, because an
                    overlay is portalled to `body` and loses its nesting. */}
                <SurfaceProvider surface="haze">{children}</SurfaceProvider>
              </ScrollArea>
            </MotionDialog>
          </Modal>
        </MotionOverlay>
      ) : null}
    </AnimatePresence>
  );
}
