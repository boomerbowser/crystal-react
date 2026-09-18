'use client';

/* Truncate.
 *
 * Clamps text to a line count and offers a real control to expand it.
 *
 * Two requirements from the catalogue, and the second is the one usually missed:
 *
 *   - **The full text remains available to assistive technology.** Line clamping
 *     hides text visually and leaves it in the DOM, so this is satisfied by the
 *     mechanism — which is exactly why clamping is used rather than cutting the
 *     string and appending an ellipsis. A cut string is gone for everyone.
 *   - **Expansion is a real control.** Not a click handler on the paragraph: a
 *     button, with `aria-expanded`, which is the difference between a feature a
 *     keyboard user can reach and one they cannot see exists.
 *
 * The control is only rendered when the text actually overflows, because an
 * expand button on a two-line paragraph clamped at three is a control that does
 * nothing — and finding that out costs a keyboard user a tab stop.
 */
import {
  forwardRef, useCallback, useEffect, useId, useRef, useState,
  type CSSProperties, type HTMLAttributes, type ReactNode,
} from 'react';
import { cx } from '../../styles/cx.js';
import { mergeRefs } from '../../utils/mergeRefs.js';
import { Button } from '../Button/Button.js';
import styles from './Truncate.module.scss';

export interface TruncateProps extends HTMLAttributes<HTMLDivElement> {
  /** How many lines before clamping. Defaults to three. */
  lines?: number;
  /** Label for the control that opens it. */
  expandLabel?: string;
  /** Label for the control that closes it again. Omit to hide the control once open. */
  collapseLabel?: string;
  children?: ReactNode;
}

export const Truncate = forwardRef<HTMLDivElement, TruncateProps>(function Truncate(
  { lines = 3, expandLabel = 'Read more', collapseLabel = 'Read less', className, style, children, ...props },
  ref,
) {
  const body = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const bodyId = useId();

  const measure = useCallback(() => {
    const element = body.current;
    if (!element) return;
    /* Measured while clamped, which is the only state where the comparison means
       anything: expanded, scrollHeight and clientHeight agree by definition. */
    if (expanded) return;
    setOverflows(element.scrollHeight > element.clientHeight + 1);
  }, [expanded]);

  useEffect(() => {
    const element = body.current;
    if (!element) return undefined;
    measure();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    observer?.observe(element);
    return () => observer?.disconnect();
  }, [measure, children, lines]);

  return (
    <div {...props} className={className}>
      <div
        ref={mergeRefs(body, ref)}
        id={bodyId}
        className={cx(styles['clamp'], expanded ? styles['expanded'] : undefined)}
        style={{ '--cr-clamp-lines': lines, ...style } as CSSProperties}
      >
        {children}
      </div>
      {/* Only when there is something to reveal: a control that does nothing
          still costs a keyboard user a tab stop to find that out. */}
      {overflows && (!expanded || collapseLabel) ? (
        <Button
          variant="quiet"
          onPress={() => setExpanded((was) => !was)}
          aria-expanded={expanded}
          aria-controls={bodyId}
        >
          {expanded ? collapseLabel : expandLabel}
        </Button>
      ) : null}
    </div>
  );
});
