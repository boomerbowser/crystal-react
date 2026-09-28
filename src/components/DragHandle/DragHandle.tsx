'use client';

/* DragHandle.
 *
 * Click-and-drag by pointer, and by keyboard — which the catalogue makes a
 * requirement rather than an enhancement: "Enter lifts, arrows move, Enter drops,
 * Escape cancels. Every state is announced."
 *
 * React Aria's `useDrag` is what supplies that. Its keyboard path is not a
 * fallback bolted on beside a pointer implementation; it is the same state
 * machine, with the same announcements, driven from a different input. That is
 * the entire reason to take it, because a hand-rolled drag is where the keyboard
 * path is invariably missing — the pointer version looks finished, so nobody
 * notices the other one was never written.
 *
 * Crystal owns the lift and the settle: elevation while carried, and the
 * `drag-pickup` and `drag-settle` recipes at each end of the gesture. Both are
 * bound to the drag *state* rather than to pointer events, so the keyboard path
 * animates exactly as the pointer one does.
 *
 * What the product owns is what may be dragged where, and what a drop means. This
 * component moves nothing on its own — it reports.
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
   * minimum: a drag that carries nothing readable cannot be dropped anywhere
   * outside the application that started it.
   */
  getItems: () => { [type: string]: string }[];
  /** Accessible name for the grip — what it moves. */
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
      {/* A button, not a decorated div. React Aria's drag button is what carries
          the keyboard state machine, and a screen reader needs something it can
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
           The grip is Crystal's too — a dot grid in the handle's own ink — so the
           six-circle glyph this drew is gone rather than drawn twice. */
        className={cx(styles['handle'], 'cr-bare', 'cr-drag-handle')}
      />
    </div>
  );
});
