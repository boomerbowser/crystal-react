'use client';

/* PasswordInput.
 *
 * The reveal toggle is the component. The catalogue is unusually specific about
 * it — "a button with `aria-pressed` and a real accessible name; never a
 * decorative icon" — and every part of that sentence is a mistake somebody has
 * shipped:
 *
 *   - A `div` with an onClick cannot be reached by keyboard, so the only way to
 *     check a password you typed is to delete it and start again.
 *   - Without `aria-pressed` the control announces the same thing in both
 *     states, so a screen reader user cannot tell whether the password is
 *     currently visible — which is a privacy question, not a convenience one.
 *   - "Show" alone does not say what is shown, and an eye icon says nothing at
 *     all.
 *
 * The strength meter carries a **word** as well as a bar. A bar that is longer or
 * shorter is meaningless to a reader who cannot see it and imprecise to one who
 * can, so the word is the meaning and the bar is the picture of it. Strength
 * policy is the product's: Crystal scores nothing, because a scoring rule that
 * disagrees with the server's is worse than none.
 */
import { forwardRef, useState, type ReactNode } from 'react';
import {
  TextField as AriaTextField, Label, Input, Button, Group, Text, FieldError,
  type TextFieldProps as AriaTextFieldProps,
} from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import { useInvalidMotion } from '../FormField/useInvalidMotion.js';
import styles from './PasswordInput.module.scss';

/** What the product decided about the value. Crystal renders it; it scores nothing. */
export interface PasswordStrength {
  /** 0 to 1. Drives the bar's length only. */
  score: number;
  /** The meaning — "Weak", "Strong". This is what is announced. */
  label: string;
  /** Colour role. Defaults to the palette's ink so it never implies a status Crystal did not assign. */
  tone?: 'danger' | 'attention' | 'success' | 'neutral';
}

export interface PasswordInputProps extends Omit<AriaTextFieldProps, 'className' | 'style' | 'children' | 'type'> {
  label: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  placeholder?: string;
  /** What the toggle reveals, for its name — "the password", "the recovery key". */
  reveals?: string;
  /** The product's verdict on the value. Rendered, never computed here. */
  strength?: PasswordStrength;
  className?: string;
  style?: React.CSSProperties;
}

const TONE_COLOUR: Record<NonNullable<PasswordStrength['tone']>, string> = {
  danger: 'var(--cr-danger-ink)',
  attention: 'var(--cr-attention-ink)',
  success: 'var(--cr-success-ink)',
  neutral: 'var(--cr-muted)',
};

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z" />
    <circle cx="12" cy="12" r="3" />
    {open ? null : <path d="M4 20L20 4" />}
  </svg>
);

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { label, description, errorMessage, placeholder, reveals = 'the password', strength, className, style, ...props },
  forwardedRef,
) {
  const invalid = props.isInvalid ?? Boolean(errorMessage);
  const shellScope = useInvalidMotion(invalid);
  const [revealed, setRevealed] = useState(false);

  return (
    <AriaTextField
      {...props}
      type={revealed ? 'text' : 'password'}
      isInvalid={invalid}
      className={cx(styles['field'], className)}
      {...(style ? { style } : {})}
    >
      <Label className={cx(styles['label'])}>{label}</Label>
      <Group
        ref={shellScope as never}
        className={cx(styles['shell'])}
        {...(invalid ? { 'data-invalid': true } : {})}
      >
        <Input
          ref={forwardedRef}
          className={cx(styles['control'])}
          {...(placeholder ? { placeholder } : {})}
        />
        {/* A real button, named for what it reveals, announcing which state it is
            in — whether the password is currently visible is a privacy question. */}
        <Button
          aria-label={revealed ? `Hide ${reveals}` : `Show ${reveals}`}
          aria-pressed={revealed}
          onPress={() => setRevealed((was) => !was)}
          className={cx(styles['inlineAction'])}
        >
          <EyeIcon open={revealed} />
        </Button>
      </Group>
      {strength ? (
        <div className={cx(styles['meter'])}>
          <div className={cx(styles['meterTrack'])}>
            <div
              className={cx(styles['meterFill'])}
              style={{
                '--cr-strength': `${Math.round(Math.min(1, Math.max(0, strength.score)) * 100)}%`,
                '--cr-strength-colour': TONE_COLOUR[strength.tone ?? 'neutral'],
              } as React.CSSProperties}
            />
          </div>
          {/* The word is the meaning; the bar is a picture of it. */}
          <span role="status" aria-live="polite">{strength.label}</span>
        </div>
      ) : null}
      {description ? (
        <Text slot="description" className={cx(styles['description'])}>{description}</Text>
      ) : null}
      <FieldError className={cx(styles['error'])}>{errorMessage}</FieldError>
    </AriaTextField>
  );
});
