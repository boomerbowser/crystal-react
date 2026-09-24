'use client';

/* CouponInput — a code, an action, and an answer that is said out loud.
 *
 * "Field and action share **one pill row**", and "**success and failure are
 * announced**; an applied code is removable."
 *
 * **The answer is the whole component.** A coupon field is one of the few places
 * in a checkout where the reader has done something and genuinely cannot tell
 * whether it worked: the total may or may not have moved, it may have moved for
 * another reason, and the code may have been rejected for a reason nobody
 * printed. So `applied` and `invalid` are not decorations on a text field — they
 * are the states this component exists to carry, and both are announced.
 *
 * Failure is `alert`, success is `status`. A code that did not apply is
 * something the reader must act on before they can continue, and it is the
 * narrow case where interrupting is correct; a code that did apply is a fact
 * they can hear when they get there. The same split the feedback slice made
 * between `Alert` and `Banner`.
 *
 * **An applied code is removable**, and removing it is a control rather than
 * clearing the field: a reader who has applied a code and changed their mind
 * needs an action with a name, not an empty box and a hope. Focus goes back to
 * the field afterwards, because the field is what is there once the code is
 * gone — the same reasoning `Banner`'s `returnFocusTo` is about, except that
 * here the component knows the answer and does not have to ask.
 *
 * `applying` disables the action rather than swapping it for a spinner. A
 * control that disappears under the reader's cursor mid-press is the defect
 * `MediaControls` avoids with its single play toggle.
 */
import {
  forwardRef, useId, useRef, type FormEvent, type ReactNode,
} from 'react';
import { Button } from '../Button/Button.js';
import { TextInput } from '../TextInput/TextInput.js';
import { mergeRefs } from '../../utils/mergeRefs.js';
import { cx } from '../../styles/cx.js';
import styles from './CouponInput.module.scss';

export interface CouponInputProps {
  /** What the code is for. The field's label. */
  label?: ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  /** Called with the trimmed code. The product validates; this component reports. */
  onApply: (code: string) => void;
  /** The code that is currently applied, if one is. */
  applied?: string;
  onRemove?: () => void;
  /** Why the last code was refused. Announced assertively. */
  error?: ReactNode;
  /** A code is on its way to the server. */
  isApplying?: boolean;
  applyLabel?: string;
  removeLabel?: (code: string) => string;
  /** What is said when a code applies. */
  appliedMessage?: (code: string) => string;
  className?: string;
}

export const CouponInput = forwardRef<HTMLInputElement, CouponInputProps>(
  function CouponInput({
    label = 'Discount code', value, onValueChange, onApply, applied, onRemove,
    error, isApplying = false, applyLabel = 'Apply',
    removeLabel = (code) => `Remove ${code}`,
    appliedMessage = (code) => `${code} applied`,
    className,
  }, forwardedRef) {
    const id = useId();
    const field = useRef<HTMLInputElement>(null);

    const apply = (event: FormEvent) => {
      event.preventDefault();
      const code = value.trim();
      /* An empty apply is a press that cannot succeed. Refusing it here is
         better than sending it and reporting a failure the reader caused by
         pressing a control that should not have been pressable. */
      if (code === '' || isApplying) return;
      onApply(code);
    };

    if (applied !== undefined) {
      return (
        <div className={cx(styles['coupon'], className)}>
          <p className={styles['applied']} id={`${id}-applied`}>
            <span aria-hidden="true" className={styles['tick']}>✓</span>
            {applied}
          </p>
          {onRemove ? (
            <Button
              variant="quiet"
              onPress={() => {
                onRemove();
                /* The field is what is there once the code is gone. */
                field.current?.focus();
              }}
            >
              {removeLabel(applied)}
            </Button>
          ) : null}
          {/* Polite: the code worked, which is a fact the reader can hear when
              they reach it rather than one that has to interrupt them. */}
          <span role="status" className={styles['announcement']}>
            {appliedMessage(applied)}
          </span>
        </div>
      );
    }

    return (
      /* A form, so Enter in the field applies the code. A field beside a button
         that only answers to the button is a field that swallows the key every
         reader will try first. */
      <form className={cx(styles['coupon'], className)} onSubmit={apply} noValidate>
        <div className={styles['row']}>
          <TextInput
            ref={mergeRefs(field, forwardedRef)}
            label={label}
            value={value}
            onChange={onValueChange}
            isInvalid={error !== undefined}
            {...(error === undefined ? {} : { errorMessage: error })}
            className={cx(styles['field'])}
          />
          {/* Disabled while applying rather than replaced by a spinner: a
              control that vanishes under the cursor mid-press is a control the
              reader has to find again. */}
          <Button type="submit" isDisabled={isApplying || value.trim() === ''}>
            {applyLabel}
          </Button>
        </div>
        {/* Assertive: a refused code is something the reader has to act on
            before they can finish, which is the narrow case where interrupting
            is right. */}
        <span role="alert" className={styles['announcement']}>{error}</span>
      </form>
    );
  },
);
