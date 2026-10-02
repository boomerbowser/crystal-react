'use client';

/* Truncate.
 *
 * Clamps text to a line count and offers a real control to expand it.
 *
 * Two requirements from the catalogue:
 *
 *   - The full text remains available to assistive technology. Line clamping
 *     hides text visually and leaves it in the DOM, which is why clamping is used
 *     instead of cutting the string and appending an ellipsis. A cut string is
 *     gone for everyone.
 *   - Expansion is a real control: a button with `aria-expanded`, not a click
 *     handler on the paragraph, so a keyboard user can reach it.
 *
 * The control is rendered only when the text overflows. An expand button on a
 * two-line paragraph clamped at three does nothing, and it still costs a keyboard
 * user a tab stop.
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
    /* Measured only while clamped. When expanded, scrollHeight and clientHeight
       are equal, so the comparison says nothing. */
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
      {/* Only when there is something to reveal. A control that does nothing
          still costs a keyboard user a tab stop. */}
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
