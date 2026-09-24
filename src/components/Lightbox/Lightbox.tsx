'use client';

/* Lightbox — a single media item enlarged over a scrim.
 *
 * "**A dialog.** Zoom and pan are keyboard reachable, and closing returns focus
 * to the thumbnail." The dialog part is React Aria's, which is where focus
 * containment, Escape and focus restoration already live and where they should
 * stay — rebuilding any of the three is how a reader ends up inside a viewer
 * with no way out.
 *
 * **Pan is the platform's, not a keyboard handler of ours.** The enlarged item
 * lives in a scroll container, so once it is bigger than the viewport a reader
 * tabs to it and pans with the arrow keys the way they pan anything else — with
 * the engine's own smooth scrolling, its own scrollbars, its own behaviour under
 * a screen reader. A component that read arrow keys itself would have to answer
 * "what do arrows do here" differently depending on the zoom, which is a mode
 * nobody was told about; this way the answer is always "whatever arrows do in
 * the thing you are focused on".
 *
 * That is also what lets a gallery put *its* arrows on the dialog: moving
 * between items and panning inside one are two different focus positions, not
 * two meanings for one key.
 *
 * **Zoom is buttons first.** `+` and `-` work while focus is in the viewer, and
 * the two controls exist so that the feature is discoverable at all — a shortcut
 * nobody can see is a feature for people who already know it is there.
 */
import {
  useCallback, useId, useRef, useState,
  type KeyboardEvent, type ReactNode,
} from 'react';
import {
  Dialog as AriaDialog, Modal, ModalOverlay, type ModalOverlayProps,
} from 'react-aria-components';
import { IconButton, CloseButton } from '../IconButton/IconButton.js';
import { cx } from '../../styles/cx.js';
import styles from './Lightbox.module.scss';

/* Crystal's own step. Doubling is too coarse for reading a photograph and 10%
   is too many presses to get anywhere. */
const STEP = 0.5;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

export interface LightboxProps
  extends Omit<ModalOverlayProps, 'className' | 'children' | 'style'> {
  /** What is being shown. The dialog's accessible name. */
  label: string;
  /** The item. An `img`, a `video`, anything with its own aspect. */
  children: ReactNode;
  /** Shown under the item. */
  caption?: ReactNode;
  /** Where in a set this is, in words — a gallery's "3 of 12". Announced. */
  position?: string;
  /** A gallery's controls. Rendered in the header beside the close button. */
  actions?: ReactNode;
  /** Answered while focus is in the viewer but outside a control. */
  onKeyShortcut?: (key: string) => boolean;
  className?: string;
  zoomInLabel?: string;
  zoomOutLabel?: string;
}

const PlusIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const MinusIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M5 12h14" />
  </svg>
);

export function Lightbox({
  label, children, caption, position, actions, onKeyShortcut,
  zoomInLabel = 'Zoom in', zoomOutLabel = 'Zoom out', className, ...props
}: LightboxProps): ReactNode {
  const id = useId();
  const [zoom, setZoom] = useState(1);
  const frame = useRef<HTMLDivElement>(null);

  const change = useCallback((by: number) => {
    setZoom((at) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((at + by) * 100) / 100)));
  }, []);

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLElement>) => {
    /* Never a key the control under the reader has its own use for — the same
       rule the video player's shortcuts follow, and for the same reason. */
    const from = event.target as HTMLElement;
    if (from.closest('button, input, [role="slider"], a, select, textarea')) return;
    if (onKeyShortcut?.(event.key)) { event.preventDefault(); return; }
    if (event.key === '+' || event.key === '=') { event.preventDefault(); change(STEP); }
    if (event.key === '-') { event.preventDefault(); change(-STEP); }
  }, [change, onKeyShortcut]);

  return (
    <ModalOverlay {...props} className={cx(styles['scrim'])}>
      <Modal className={cx(styles['modal'])}>
        <AriaDialog
          aria-labelledby={`${id}-label`}
          className={cx(styles['viewer'], className)}
        >
          {/* The handler is on a wrapper rather than on the dialog: React Aria's
              `Dialog` does not take DOM handlers, and putting it here keeps the
              shortcut on exactly the subtree the reader is inside. */}
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- a shortcut over controls that are focusable in their own right, not a control */}
          <div className={styles['keys']} onKeyDown={onKeyDown}>
          <div className={styles['header']}>
            <p className={styles['label']} id={`${id}-label`}>
              {label}
              {/* The position is part of the name rather than beside it: a reader
                  who cannot see the strip has no other way to know where in the
                  set they are. */}
              {position ? <span className={styles['position']}>{position}</span> : null}
            </p>
            <div className={styles['actions']}>
              {actions}
              <IconButton
                label={zoomOutLabel}
                icon={MinusIcon}
                variant="resin"
                isDisabled={zoom <= MIN_ZOOM}
                onPress={() => change(-STEP)}
              />
              <IconButton
                label={zoomInLabel}
                icon={PlusIcon}
                variant="resin"
                isDisabled={zoom >= MAX_ZOOM}
                onPress={() => change(STEP)}
              />
              <CloseButton closes={label} variant="resin" slot="close" />
            </div>
          </div>

          {/* The scroll container *is* the pan. Focusable only once there is
              something to pan to, because a scroll region that never scrolls is
              a tab stop that does nothing. */}
          <div
            ref={frame}
            className={styles['frame']}
            tabIndex={zoom > MIN_ZOOM ? 0 : -1}
            {...(zoom > MIN_ZOOM
              ? { role: 'group', 'aria-label': `${label}, pan with the arrow keys` }
              : {})}
          >
            <div
              className={styles['item']}
              style={{ '--lightbox-zoom': String(zoom) } as React.CSSProperties}
            >
              {children}
            </div>
          </div>

          {caption ? <p className={styles['caption']}>{caption}</p> : null}

          {/* The zoom, said. The buttons change nothing a screen reader would
              otherwise notice — the picture is the same picture. */}
          <span role="status" className={styles['announcement']}>
            {zoom > MIN_ZOOM ? `Zoomed to ${Math.round(zoom * 100)} per cent` : ''}
          </span>
          </div>
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}
