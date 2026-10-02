'use client';

/* DragHandle.
 *
 * Click-and-drag by pointer and by keyboard. The catalogue makes the keyboard a
 * requirement: "Enter lifts, arrows move, Enter drops, Escape cancels. Every
 * state is announced."
 *
 * React Aria's `useDrag` supplies that. Its keyboard path is the same state
 * machine as the pointer path, with the same announcements, driven from a
 * different input. That is why this component uses it: a hand-rolled drag
 * usually lacks the keyboard path, because the pointer version looks finished.
 *
 * Crystal owns the lift and the settle: elevation while carried, and the
 * `drag-pickup` and `drag-settle` recipes at each end of the gesture. Both are
 * bound to the drag state and not to pointer events, so the keyboard path
 * animates exactly as the pointer one does.
 *
 * The product owns what may be dragged where, and what a drop means. This
 * component moves nothing on its own. It reports.
 */
import { forwardRef, useRef, type HTMLAttributes, type ReactNode } from 'react';
import { useDrag } from 'react-aria';
import { useMotion } from '../../motion/useMotion.js';
import { cx } from '../../styles/cx.js';
import { mergeRefs } from '../../utils/mergeRefs.js';
import styles from './DragHandle.module.scss';

export interface DragHandleProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * What is being carried, as drag items. A plain-text description is the
   * minimum, because a drag that carries nothing readable cannot be dropped
   * anywhere outside the application that started it.
   */
  getItems: () => { [type: string]: string }[];
  /** Accessible name for the grip: what it moves. */
  handleLabel?: string;
  isDisabled?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  children?: ReactNode;
}

export const DragHandle = forwardRef<HTMLDivElement, DragHandleProps>(function DragHandle(
  { getItems, handleLabel = 'Drag to reorder', isDisabled = false, onDragStart, onDragEnd, className, children, ...props },
  ref,
) {
  const [scope, play] = useMotion();
  const lifted = useRef(false);

  const { dragProps, dragButtonProps, isDragging } = useDrag({
    getItems,
    onDragStart: () => {
      lifted.current = true;
      play('drag-pickup');
      onDragStart?.();
    },
    onDragEnd: () => {
      lifted.current = false;
      play('drag-settle');
      onDragEnd?.();
    },
  });

  return (
    <div
      {...props}
      {...(isDisabled ? {} : dragProps)}
      ref={mergeRefs(scope as never, ref)}
      data-cr-state={isDragging ? 'dragging' : 'at-rest'}
      className={cx(styles['draggable'], isDragging ? styles['dragging'] : undefined, className)}
    >
      {children}
      {/* A button, not a decorated div. React Aria's drag button carries the
          keyboard state machine, and a screen reader needs something it can
          activate to start one. */}
      <button
        {...dragButtonProps}
        type="button"
        disabled={isDisabled}
        aria-label={handleLabel}
        data-cr-state={isDragging ? 'dragging' : 'at-rest'}
        /* Crystal's lift keys on this. */
        data-dragging={isDragging || undefined}
        /* Crystal's drag handle (2.2.0): a bare control with a grip and a lift.
           Crystal also draws the grip, a dot grid in the handle's own ink, so
           this component draws no glyph of its own. */
        className={cx(styles['handle'], 'cr-bare', 'cr-drag-handle')}
      />
    </div>
  );
});
