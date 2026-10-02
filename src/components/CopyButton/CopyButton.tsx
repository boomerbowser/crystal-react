'use client';

/* CopyButton.
 *
 * Copies a value and says so.
 *
 *   - The confirmation is announced as well as drawn. A label that changes
 *     from "Copy" to "Copied" is a visual change a screen reader may never
 *     mention, so the message also goes to a live region. Without it the control
 *     appears to do nothing.
 *   - It says what it copied. "Copied" alone refers to something the reader
 *     cannot see. The label names the thing, which also tells several copy
 *     buttons on one page apart.
 *
 * `copy-confirm` is the recipe Crystal's catalogue assigns this. It plays on the
 * state change, not on the click, so a keyboard user sees it too.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useChangeMotion, entered } from '../../motion/useChangeMotion.js';
import { Button, type ButtonProps } from '../Button/Button.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';

export interface CopyButtonProps extends Omit<ButtonProps, 'onPress' | 'children'> {
  /** What to copy. */
  value: string;
  /** What the control does, naming the thing. Also its accessible name. */
  label?: string;
  /** What it says once copied. */
  copiedLabel?: string;
  /** How long the confirmation lasts. */
  resetAfterMs?: number;
}

export function CopyButton({
  value, label = 'Copy', copiedLabel = 'Copied', resetAfterMs = 2000, variant = 'quiet', ...props
}: CopyButtonProps): React.JSX.Element {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /* `copy-confirm` plays when the clipboard write has resolved, never on the
     press, and not when the label reverts. */
  const confirm = useChangeMotion(copied, entered('copy-confirm'));

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), resetAfterMs);
    } catch {
      /* Denied permission, or no clipboard at all. The control says nothing,
         because claiming a copy that did not happen is worse than a control that
         appears not to have worked, and the value is still on screen to select. */
    }
  }, [value, resetAfterMs]);

  return (
    <>
      <Button {...props} ref={confirm as never} variant={variant} onPress={() => void copy()}>
        {copied ? copiedLabel : label}
      </Button>
      {/* Announced as well as drawn. A label change is visual only, so the
          live region speaks it. */}
      <VisuallyHidden as="div" role="status" aria-live="polite">
        {copied ? `${copiedLabel}: ${label}` : ''}
      </VisuallyHidden>
    </>
  );
}
