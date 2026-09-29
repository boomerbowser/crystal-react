'use client';

/* Resizable.
 *
 * Two regions with a grab handle between them. React Aria's `useMove` supplies the
 * interaction, and it is the right primitive precisely because it is not a drag
 * hook: it reports movement from a pointer **and** from the arrow keys through one
 * interface, so the keyboard path is not a second implementation that drifts.
 *
 * "Pointer dragging is never the only route" is the catalogue's rule and it is
 * the one that decides the markup. The handle is a `separator` with
 * `aria-valuenow`, `aria-valuemin` and `aria-valuemax`, which is what lets a
 * screen reader announce the size as it changes rather than announcing that
 * something was grabbed. A `div` with a pointer handler is invisible to every
 * route except a mouse.
 *
 * The bounds are the product's; what Crystal owns is that reaching one is a state
 * the handle shows rather than a silent refusal to move.
 */
import {
  forwardRef, useRef, useState,
  type HTMLAttributes, type ReactNode,
} from 'react';
import { useMove } from 'react-aria';
import { cx } from '../../styles/cx.js';
import { useMotion } from '../../motion/useMotion.js';
import styles from './Resizable.module.scss';

export interface ResizableProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** The region that resizes. The second child fills what is left. */
  children: ReactNode;
  /** The region that takes the remaining space. */
  secondary?: ReactNode;
  /** Current size of the first region, in px. Uncontrolled if omitted. */
  size?: number;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  orientation?: 'horizontal' | 'vertical';
  isDisabled?: boolean;
  /** Called as the size changes. The product owns persistence. */
  onSizeChange?: (size: number) => void;
  /** Accessible name for the handle — what it resizes. */
  'aria-label'?: string;
}

export const Resizable = forwardRef<HTMLDivElement, ResizableProps>(function Resizable(
  {
    children, secondary, size, defaultSize = 280, minSize = 120, maxSize = 720,
    orientation = 'horizontal', isDisabled = false, onSizeChange,
    'aria-label': label = 'Resize', className, ...props
  },
  ref,
) {
  const [uncontrolled, setUncontrolled] = useState(defaultSize);
  const current = size ?? uncontrolled;
  /* Movement accumulates against the size at the moment the gesture started, not
     against the latest render — otherwise a controlled parent that rounds or
     debounces makes the handle drift away from the pointer. */
  const startedAt = useRef(current);

  const clamp = (value: number) => Math.min(maxSize, Math.max(minSize, value));

  const apply = (next: number) => {
    const bounded = clamp(next);
    if (size === undefined) setUncontrolled(bounded);
    onSizeChange?.(bounded);
  };

  /* `resize-settle` on the region once a resize ends — the pointer let go, or a
     key press done — and only if the size moved: "after measured layout size
     changes". Never on the handle, which the recipe says not to animate. */
  const [settle, playSettle] = useMotion();
  const sizeAtStart = useRef(current);

  const { moveProps } = useMove({
    onMoveStart: () => { startedAt.current = current; sizeAtStart.current = current; },
    onMoveEnd: () => { if (clamp(startedAt.current) !== sizeAtStart.current) void playSettle('resize-settle'); },
    onMove: (event) => {
      /* `deltaX`/`deltaY` are the same numbers for a pointer and for an arrow
         key, which is the whole reason this hook is here rather than a pointer
         handler plus a keydown handler that disagree. */
      const delta = orientation === 'horizontal' ? event.deltaX : event.deltaY;
      startedAt.current += delta;
      apply(startedAt.current);
    },
  });

  const atMin = current <= minSize;
  const atMax = current >= maxSize;

  return (
    <div
      {...props}
      ref={ref}
      className={cx(styles['resizable'], styles[orientation], className)}
    >
      <div
        ref={settle as never}
        className={cx(styles['region'])}
        style={orientation === 'horizontal'
          ? { flex: `0 0 ${current}px` }
          : { flex: `0 0 ${current}px` }}
      >
        {children}
      </div>
      <div
        {...(isDisabled ? {} : moveProps)}
        role="separator"
        tabIndex={isDisabled ? -1 : 0}
        aria-label={label}
        aria-orientation={orientation === 'horizontal' ? 'vertical' : 'horizontal'}
        aria-valuenow={Math.round(current)}
        aria-valuemin={minSize}
        aria-valuemax={maxSize}
        aria-disabled={isDisabled || undefined}
        data-cr-state={atMin ? 'at-min' : atMax ? 'at-max' : 'idle'}
        className={cx(styles['handle'])}
      />
      <div className={cx(styles['region'])} style={{ flex: '1 1 0' }}>{secondary}</div>
    </div>
  );
});
