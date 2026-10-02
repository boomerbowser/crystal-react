'use client';

/* CouponInput: a code, an action, and an answer that is announced.
 *
 * "Field and action share one pill row", and "success and failure are
 * announced; an applied code is removable."
 *
 * A coupon field is one of the few places in a checkout where the reader has
 * done something and cannot tell whether it worked. The total may or may not
 * have moved, it may have moved for another reason, and the code may have been
 * rejected for a reason nobody printed. `applied` and `invalid` are the states
 * this component exists to carry, and both are announced.
 *
 * Failure is `alert`, success is `status`. A code that did not apply is
 * something the reader must act on before they can continue, which is the
 * narrow case where interrupting is correct. A code that did apply is a fact
 * they can hear when they get there. This is the same split the feedback slice
 * made between `Alert` and `Banner`.
 *
 * An applied code is removable through a named control. Clearing the field is
 * not enough for a reader who has applied a code and changed their mind. Focus
 * goes back to the field afterwards, because the field is what is there once
 * the code is gone. `Banner`'s `returnFocusTo` follows the same reasoning, but
 * here the component knows the target and does not have to ask.
 *
 * `applying` disables the action and does not swap it for a spinner. A control
 * that disappears under the reader's cursor mid-press is the defect
 * `MediaControls` avoids with its single play toggle.
 */
import {
  forwardRef, useEffect, useId, useRef, type FormEvent, type ReactNode,
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

    /* Focus goes back to the field once the code is gone. This runs in an
       effect keyed on the code going away, because the applied state and the
       form are two different trees. When Remove is pressed, the input this ref
       names does not exist yet. Focusing it then focuses nothing, and the
       reader is left on a control that has just removed itself. The field
       comes back in one render and receives focus in the next, here.

       `wasApplied` is used instead of `applied === undefined`, so this does not
       fire on a component that mounts without a code. */
    const wasApplied = useRef(applied !== undefined);
    useEffect(() => {
      const removed = wasApplied.current && applied === undefined;
      wasApplied.current = applied !== undefined;
      if (removed) field.current?.focus();
    }, [applied]);

    const apply = (event: FormEvent) => {
      event.preventDefault();
      const code = value.trim();
      /* An empty apply cannot succeed, so it is refused here and never sent.
         Sending it would report a failure caused by a control that should not
         have been pressable. */
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
            <Button variant="quiet" onPress={onRemove}>
              {removeLabel(applied)}
            </Button>
          ) : null}
          {/* Polite. The code worked, which the reader can hear when they reach
              it, with no need to interrupt them. */}
          <span role="status" className={styles['announcement']}>
            {appliedMessage(applied)}
          </span>
        </div>
      );
    }

    return (
      /* A form, so Enter in the field applies the code. Enter is the key every
         reader tries first. */
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
          {/* Disabled while applying, and not replaced by a spinner. A control
              that vanishes under the cursor mid-press has to be found again. */}
          <Button type="submit" isDisabled={isApplying || value.trim() === ''}>
            {applyLabel}
          </Button>
        </div>
        {/* Assertive. The reader has to act on a refused code before they can
            finish, which is the narrow case where interrupting is right. */}
        <span role="alert" className={styles['announcement']}>{error}</span>
      </form>
    );
  },
);
