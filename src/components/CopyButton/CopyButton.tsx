'use client';

/* CopyButton.
 *
 * Copies a value and says so. Two details carry the whole component:
 *
 *   - **The confirmation is announced, not only drawn.** A label that changes
 *     from "Copy" to "Copied" is a visual change a screen reader may never
 *     mention, so the message also goes to a live region. Without it the control
 *     appears to do nothing.
 *   - **It says what it copied.** "Copied" alone is a claim about something the
 *     reader cannot see. The label names the thing, which is also what makes
 *     several copy buttons on one page tellable apart.
 *
 * `copy-confirm` is the recipe Crystal's catalogue assigns this, played on the
 * state change rather than on the click, so a keyboard user sees it too.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
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

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), resetAfterMs);
    } catch {
      /* Denied permission, or no clipboard at all. Saying nothing is right here:
         claiming a copy that did not happen is worse than a control that appears
         not to have worked, and the value is still on screen to select. */
    }
  }, [value, resetAfterMs]);

  return (
    <>
      <Button {...props} variant={variant} onPress={() => void copy()}>
        {copied ? copiedLabel : label}
      </Button>
      {/* Announced as well as drawn: a label that changes is a visual event, and
          a live region is what turns it into a spoken one. */}
      <VisuallyHidden as="div" role="status" aria-live="polite">
        {copied ? `${copiedLabel}: ${label}` : ''}
      </VisuallyHidden>
    </>
  );
}
