'use client';

/* Tour — a sequence of steps that points at parts of the interface.
 *
 * "Focus moves to each step; **the sequence is escapable** and its position is
 * announced." Escapable is the word that shapes this component. A tour is the
 * one pattern in a library that takes the whole interface away from someone who
 * did not ask for it, so every step carries a visible way out, Escape ends it
 * from anywhere, and ending returns focus to whatever had it when the tour
 * began — not to the last step's target, which by then may not exist.
 *
 * "Its position is announced": each panel says "Step 2 of 5" in its accessible
 * name, not only in small text. A reader who cannot see the progress dots
 * otherwise has no idea whether they are near the end.
 *
 * **The highlight is a hole in the scrim, not a ring around the target.** A ring
 * drawn over the page has to sit above the scrim and below nothing, and it
 * fights every stacking context on the way; a scrim with the target cut out of
 * it is one element, and the cut-out is what makes the target look lit rather
 * than the target being painted. It follows the target's own radius, so a pill
 * is cut as a pill.
 *
 * **Position is measured, not guessed.** The target is read with
 * `getBoundingClientRect` on mount, on resize and on scroll. jsdom reports zero
 * for all of it, which is not a reason to avoid measuring — it is the reason the
 * positioning is verified in a browser and the semantics are verified here.
 */
import {
  useCallback, useEffect, useId, useLayoutEffect, useRef, useState,
  type ReactNode, type RefObject,
} from 'react';
import { Portal } from '../Portal/Portal.js';
import { Button } from '../Button/Button.js';
import styles from './Tour.module.scss';

export interface TourStep {
  /** What this step points at. A step with no target is a centred panel, which
   *  is the right shape for "welcome" and "you are done". */
  target?: RefObject<HTMLElement | null>;
  title: ReactNode;
  children?: ReactNode;
}

export interface TourProps {
  steps: readonly TourStep[];
  /** Running. */
  isOpen: boolean;
  /** Which step. Controlled, so a product can branch or skip. */
  step?: number;
  onStepChange?: (step: number) => void;
  /** Ended — by finishing, by Escape, or by the way out on every panel. */
  onClose?: () => void;
  /** How the position is said. Given the numbers, in the reader's language. */
  formatPosition?: (step: number, total: number) => string;
  backLabel?: string;
  nextLabel?: string;
  finishLabel?: string;
  closeLabel?: string;
}

interface Box { top: number; left: number; width: number; height: number; radius: number }

/* How much room the cut-out leaves around the target, so the highlight reads as
   a margin rather than as a tight crop. Crystal's smallest spacing step. */
const HALO = 8;

export function Tour({
  steps, isOpen, step = 0, onStepChange, onClose,
  formatPosition = (at, total) => `Step ${at + 1} of ${total}`,
  backLabel = 'Back', nextLabel = 'Next', finishLabel = 'Done', closeLabel = 'End tour',
}: TourProps): ReactNode {
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<Box | null>(null);

  /* Whatever had focus when the tour began. Captured once, because by the end
     the last step's target may have been replaced by what the tour was
     explaining. */
  const returnTo = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (isOpen) returnTo.current = document.activeElement as HTMLElement | null;
  }, [isOpen]);

  const current = steps[step];
  const last = step >= steps.length - 1;

  const measure = useCallback(() => {
    const node = current?.target?.current;
    if (!node) { setBox(null); return; }
    const rect = node.getBoundingClientRect();
    setBox({
      top: rect.top - HALO,
      left: rect.left - HALO,
      width: rect.width + HALO * 2,
      height: rect.height + HALO * 2,
      /* The target's own radius, so a pill is cut as a pill. Crystal's action
         radius is `999px`, which is "as round as it can be" rather than a real
         999 — clamped to half the shorter side, which is what the browser draws
         anyway. */
      radius: Math.min(
        Number.parseFloat(getComputedStyle(node).borderRadius) || 0,
        (rect.width + HALO * 2) / 2,
        (rect.height + HALO * 2) / 2,
      ),
    });
  }, [current]);

  useLayoutEffect(() => {
    if (!isOpen) return undefined;
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [isOpen, measure]);

  const close = useCallback(() => {
    onClose?.();
    returnTo.current?.focus();
  }, [onClose]);

  /* Focus lands on the panel itself rather than on its first button: the panel
     is what the reader has just been moved to, and its name carries the step,
     the position and the text. Landing on "Next" announces "Next".

     A callback ref for the arrival and an effect for the moves between steps.
     An effect alone is not enough: `Portal` resolves its container in an effect
     of its own and renders nothing on the first client pass, so an effect here
     runs while `panel.current` is still null and the tour opens with focus
     wherever it was — which is outside the tour, where Escape does nothing. */
  const attach = useCallback((node: HTMLDivElement | null) => {
    panel.current = node;
    node?.focus();
  }, []);

  useEffect(() => {
    if (isOpen) panel.current?.focus();
  }, [isOpen, step]);

  if (!isOpen || !current) return null;

  return (
    <Portal>
      <div
        className={styles['tour']}
        onKeyDown={(event) => {
          if (event.key !== 'Escape') return;
          event.stopPropagation();
          close();
        }}
      >
        {/* One element, with the target cut out of it. `evenodd` is what makes
            the hole: the viewport rectangle and the target's rounded one wind
            the same way, so the overlap falls outside the fill.

            `path()` rather than `xywh() exclude`, which is not CSS — `clip-path`
            takes a single shape and has no combinator. The first version of this
            used one, the declaration was dropped as invalid, and the scrim
            simply had no hole in it: `getComputedStyle` in a real browser
            reported `clip-path: none` while every unit test passed, because
            jsdom measures nothing and had no box to cut. */}
        <div
          className={styles['scrim']}
          data-cut={box ? '' : undefined}
          style={box ? { clipPath: spotlight(box) } as React.CSSProperties : undefined}
        />
        <div
          ref={attach}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          aria-labelledby={`${id}-title`}
          aria-describedby={`${id}-body`}
          className={styles['panel']}
          data-anchored={box ? '' : undefined}
          style={box ? {
            '--panel-top': `${box.top + box.height}px`,
            '--panel-left': `${box.left}px`,
          } as React.CSSProperties : undefined}
        >
          <p className={styles['position']} id={`${id}-position`}>
            {formatPosition(step, steps.length)}
          </p>
          <p className={styles['title']} id={`${id}-title`}>
            {/* The position is part of the name, not only small text beside it:
                a reader who cannot see the progress has no other way to know
                whether they are near the end. */}
            <span className={styles['said']}>{`${formatPosition(step, steps.length)}. `}</span>
            {current.title}
          </p>
          {current.children ? (
            <div className={styles['body']} id={`${id}-body`}>{current.children}</div>
          ) : <span id={`${id}-body`} hidden />}
          <div className={styles['actions']}>
            {/* The way out, on every step. A tour takes the whole interface away
                from someone who did not ask for it. */}
            <Button variant="quiet" onPress={close}>{closeLabel}</Button>
            <span className={styles['spacer']} />
            {step > 0 ? (
              <Button variant="quiet" onPress={() => onStepChange?.(step - 1)}>{backLabel}</Button>
            ) : null}
            <Button onPress={() => (last ? close() : onStepChange?.(step + 1))}>
              {last ? finishLabel : nextLabel}
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

/* The viewport, with a rounded rectangle taken out of it.
 *
 * Written as one `path()` with the even-odd rule rather than as a mask or a
 * giant `box-shadow`: Mirage is a *filter*, not a fill, so whatever draws the
 * scrim has to be a single element that can carry `backdrop-filter` — a
 * spotlight made of four rectangles or of a 9999px shadow cannot.
 *
 * Both subpaths run clockwise. Under `evenodd` a point inside both is crossed
 * twice and therefore outside the fill, which is the hole.
 */
function spotlight({ top, left, width, height, radius }: Box): string {
  const r = Math.max(0, radius);
  const right = left + width;
  const bottom = top + height;
  const hole = r === 0
    ? `M${left},${top}H${right}V${bottom}H${left}Z`
    : `M${left + r},${top}`
      + `H${right - r}A${r},${r} 0 0 1 ${right},${top + r}`
      + `V${bottom - r}A${r},${r} 0 0 1 ${right - r},${bottom}`
      + `H${left + r}A${r},${r} 0 0 1 ${left},${bottom - r}`
      + `V${top + r}A${r},${r} 0 0 1 ${left + r},${top}Z`;
  return `path(evenodd, "M0,0H100000V100000H0Z ${hole}")`;
}
