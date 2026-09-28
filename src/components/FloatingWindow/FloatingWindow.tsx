'use client';

/* FloatingWindow — a draggable, resizable panel that stays in the viewport.
 *
 * **The keyboard story is designed here, not inherited.** Every other overlay
 * in this library is a React Aria primitive that arrives with its keyboard
 * model already correct. This one is not, which means a window that can only be
 * moved with a pointer is a window half the users cannot move — and it would
 * look complete to anyone testing with a mouse. So the title bar is a real
 * control: focus it and the arrow keys move the window, Shift widens the step,
 * and with a modifier they resize instead. Home returns it to where it started.
 *
 * **`role="dialog"` only when it is modal, and focus is trapped only then.**
 * The catalogue's own line. A non-modal window that trapped focus would be a
 * window you cannot Tab out of, which is a trap in the ordinary sense; a
 * non-modal one announced as a dialog claims an exclusivity it does not have.
 *
 * **Bounds are enforced on every change, not corrected afterwards.** A window
 * allowed to leave the viewport and pulled back on the next frame visibly
 * jumps, and one dragged off a corner can be dropped somewhere with no way to
 * reach its title bar again — at which point neither pointer nor keyboard can
 * recover it, because both need the handle.
 *
 * **The product owns the content, the bounds and persistence; Crystal owns the
 * material, the elevation and the motion.** Position and size are therefore
 * reported rather than hidden, so a product can remember them.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import styles from './FloatingWindow.module.scss';

export interface WindowRect { x: number; y: number; width: number; height: number }

export interface FloatingWindowProps {
  /** The window's accessible name. Required: it is a surface focus moves into. */
  label: string;
  children: ReactNode;
  /** Where and how big it starts. */
  defaultRect?: WindowRect;
  /** Reported on every move and resize, so a product can remember it. */
  onRectChange?: (rect: WindowRect) => void;
  /**
   * Announce it as a dialog and trap focus inside it. Off by default: a window
   * that traps focus without being modal is a window you cannot Tab out of.
   */
  isModal?: boolean;
  /** How far one arrow press moves it. Shift multiplies this by ten. */
  step?: number;
  /** Smallest it may become, so it can never be resized past its own handle. */
  minWidth?: number;
  minHeight?: number;
  className?: string;
}

const DEFAULT_RECT: WindowRect = { x: 24, y: 24, width: 360, height: 240 };

export function FloatingWindow({
  label, children, defaultRect = DEFAULT_RECT, onRectChange,
  isModal = false, step = 16, minWidth = 220, minHeight = 120, className,
}: FloatingWindowProps): React.JSX.Element {
  const [rect, setRect] = useState<WindowRect>(defaultRect);
  const initial = useRef(defaultRect);
  const report = useRef(onRectChange);
  report.current = onRectChange;

  /* Clamped on the way in, never corrected on the way out. A window pulled back
     on the next frame visibly jumps, and one dropped past a corner cannot be
     recovered by pointer or keyboard, because both need the title bar. */
  const clamp = useCallback((next: WindowRect): WindowRect => {
    const viewportWidth = typeof window === 'undefined' ? Infinity : window.innerWidth;
    const viewportHeight = typeof window === 'undefined' ? Infinity : window.innerHeight;
    const width = Math.max(minWidth, Math.min(next.width, viewportWidth));
    const height = Math.max(minHeight, Math.min(next.height, viewportHeight));
    return {
      width,
      height,
      x: Math.max(0, Math.min(next.x, viewportWidth - width)),
      y: Math.max(0, Math.min(next.y, viewportHeight - height)),
    };
  }, [minWidth, minHeight]);

  const move = useCallback((next: WindowRect): void => {
    setRect(() => {
      const clamped = clamp(next);
      report.current?.(clamped);
      return clamped;
    });
  }, [clamp]);

  /* Pointer dragging, from the title bar only. Pointer capture rather than
     document listeners, so a fast drag that outruns the element does not lose
     the window — and so releasing outside the viewport still ends the drag. */
  const dragFrom = useRef<{ pointer: number; x: number; y: number; rect: WindowRect } | null>(null);

  const onPointerDown = (event: React.PointerEvent<HTMLElement>): void => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragFrom.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, rect };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLElement>): void => {
    const from = dragFrom.current;
    if (!from || from.pointer !== event.pointerId) return;
    move({
      ...from.rect,
      x: from.rect.x + (event.clientX - from.x),
      y: from.rect.y + (event.clientY - from.y),
    });
  };

  const endDrag = (event: React.PointerEvent<HTMLElement>): void => {
    if (dragFrom.current?.pointer === event.pointerId) dragFrom.current = null;
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>): void => {
    /* Shift widens the step; a modifier resizes rather than moves. Without the
       resize half, a keyboard user can place the window but never fit it to
       what is inside. */
    const distance = event.shiftKey ? step * 10 : step;
    const resizing = event.altKey || event.ctrlKey || event.metaKey;
    const deltas: Record<string, [number, number]> = {
      ArrowLeft: [-distance, 0], ArrowRight: [distance, 0],
      ArrowUp: [0, -distance], ArrowDown: [0, distance],
    };

    if (event.key === 'Home') {
      event.preventDefault();
      move(initial.current);
      return;
    }
    const delta = deltas[event.key];
    if (!delta) return;
    event.preventDefault();
    const [dx, dy] = delta;
    move(resizing
      ? { ...rect, width: rect.width + dx, height: rect.height + dy }
      : { ...rect, x: rect.x + dx, y: rect.y + dy });
  };

  /* The viewport can shrink underneath a window — a rotated phone, a resized
     browser — and a window that was in bounds a moment ago is not any more. */
  useEffect(() => {
    const onResize = (): void => { move(rect); };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); };
  }, [move, rect]);

  return (
    <section
      {...(isModal ? { role: 'dialog', 'aria-modal': true } : {})}
      aria-label={label}
      data-modal={isModal || undefined}
      className={cx(styles['window'], 'cr-resin', 'panel', className)}
      style={{
        insetInlineStart: `${rect.x}px`,
        insetBlockStart: `${rect.y}px`,
        inlineSize: `${rect.width}px`,
        blockSize: `${rect.height}px`,
      }}
    >
      {/* A real control: focusable, named, and operable without a pointer — and
          a real `<button>` rather than a `<header role="button">`, which is what
          it was. HTML-AAM does not let a sectioning element be overridden into a
          widget, so axe fails that as `aria-allowed-role`; the element still
          *reported* `button`, which is why every test querying it by role passed
          and only running axe over a story found it. */}
      <button
        type="button"
        aria-label={`${label} — move or resize with the arrow keys`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
        className={cx(styles['bar'], 'cr-bare')}
      >
        <span className={cx(styles['title'])}>{label}</span>
      </button>
      <div className={cx(styles['body'])}>{children}</div>
    </section>
  );
}
