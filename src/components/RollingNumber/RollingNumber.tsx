'use client';

/* RollingNumber — a number that rolls digit by digit when it changes.
 *
 * **Crystal assigns this component no motion recipe**, and that is a fact worth
 * stating rather than working around. `Card` plays nothing for the same reason —
 * a library must not invent motion the design system did not specify. But here
 * the movement *is* the component: the catalogue's own anatomy is "a number that
 * animates digit by digit when it changes", so refusing to move would be
 * refusing to build it.
 *
 * The resolution is to build the roll out of Crystal's published motion *tokens*
 * rather than out of an invented recipe. The travel is one digit; the duration is
 * `motion.duration.state`, which is what Crystal uses for a value changing; the
 * easing is `motion.easing.settle`. Nothing here is a number this library chose,
 * and if Crystal ever authors a recipe for it, this is the file that changes.
 *
 * The announcement is the other half. "The value is announced once it settles,
 * not on every frame": the digits are `aria-hidden`, and a polite live region
 * carries the settled value one roll-duration later. Under reduced motion the
 * roll is removed and the duration resolves to zero, so the announcement is
 * immediate — which is the correct behaviour rather than a degraded one.
 */
import { forwardRef, useEffect, useRef, useState, type HTMLAttributes } from 'react';
import { useCrystalTheme } from '../../theme/CrystalProvider.js';
import { crystalTokens } from '../../theme/tokens.generated.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import { cx } from '../../styles/cx.js';
import styles from './RollingNumber.module.scss';

export interface RollingNumberProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  value: number;
  /** How it reads. `Intl.NumberFormat` options, so the digits and the
   *  announcement are formatted by the same thing. */
  format?: Intl.NumberFormatOptions;
  locale?: string;
  /** What the number is *of*, appended to the announcement. */
  description?: string;
}

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

/** Crystal's own duration for a value changing, in milliseconds. */
const ROLL_MS = Number.parseFloat(crystalTokens['motion.duration.state']);

export const RollingNumber = forwardRef<HTMLSpanElement, RollingNumberProps>(function RollingNumber(
  { value, format, locale, description, className, ...props },
  ref,
) {
  const { resolveDuration } = useCrystalTheme();
  const text = new Intl.NumberFormat(locale, format).format(value);
  const [settled, setSettled] = useState(text);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const duration = resolveDuration(ROLL_MS);
    if (duration === 0) { setSettled(text); return undefined; }
    timer.current = setTimeout(() => { setSettled(text); }, duration);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [text, resolveDuration]);

  return (
    <span {...props} ref={ref} className={cx(styles['rolling'], className)}>
      {/* The glyphs are a picture of the number while it is moving. */}
      <span aria-hidden="true" className={styles['digits']}>
        {[...text].map((character, index) => {
          const digit = DIGITS.indexOf(character as typeof DIGITS[number]);
          const key = `${index}-${character}`;
          if (digit < 0) return <span key={key} className={styles['fixed']}>{character}</span>;
          return (
            <span key={key} className={styles['column']}>
              {/* The whole strip, translated. Rendering ten glyphs per digit is
                  what makes the roll CSS rather than a scripted animation, and a
                  CSS translate is what `prefers-reduced-motion` can switch off. */}
              <span className={styles['strip']} style={{ translate: `0 ${-digit * 100}%` }}>
                {DIGITS.map((d) => <span key={d} className={styles['glyph']}>{d}</span>)}
              </span>
            </span>
          );
        })}
      </span>
      <VisuallyHidden role="status">
        {description === undefined ? settled : `${settled} ${description}`}
      </VisuallyHidden>
    </span>
  );
});
