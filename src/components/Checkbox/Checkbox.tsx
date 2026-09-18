'use client';

/* Checkbox, CheckboxGroup, Radio and RadioGroup.
 *
 * A check mark here means **checked**, which is the one place in Crystal it is
 * allowed to: the system's rule is that a check mark never means "selected" in a
 * list or a menu, where selection is label weight. A checkbox is not a list — its
 * mark is the value of a boolean, and it is contained inside the box so the pair
 * reads as one control rather than as a sticker on top of one.
 *
 * Indeterminate is set through the property and never through a class. The DOM
 * property is what a screen reader reads as "mixed"; a class that draws a dash
 * produces a control that looks partially checked and announces as unchecked,
 * which is worse than not drawing it at all.
 *
 * The group is a real fieldset with a legend, and its error describes the group.
 * That is the catalogue's wording and the distinction is practical: "choose at
 * least one" belongs to the set, and attaching it to the first checkbox makes it
 * a message about that checkbox.
 */
import { forwardRef, type ReactNode } from 'react';
import {
  Checkbox as AriaCheckbox, CheckboxGroup as AriaCheckboxGroup,
  Radio as AriaRadio, RadioGroup as AriaRadioGroup,
  Label, Text, FieldError,
  type CheckboxProps as AriaCheckboxProps,
  type CheckboxGroupProps as AriaCheckboxGroupProps,
  type RadioProps as AriaRadioProps,
  type RadioGroupProps as AriaRadioGroupProps,
} from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import { useInvalidMotion } from '../FormField/useInvalidMotion.js';
import styles from './Checkbox.module.scss';

const CheckMark = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true" className={cx(styles['mark'])}>
    <path d="M5 13l4 4L19 7" />
  </svg>
);

const DashMark = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true" className={cx(styles['mark'])}>
    <path d="M6 12h12" />
  </svg>
);

export interface CheckboxProps extends Omit<AriaCheckboxProps, 'className' | 'style' | 'children'> {
  children?: ReactNode;
  className?: string;
}

export const Checkbox = forwardRef<HTMLLabelElement, CheckboxProps>(function Checkbox(
  { children, className, ...props },
  ref,
) {
  return (
    <AriaCheckbox {...props} ref={ref} className={cx(styles['choice'], className)}>
      {({ isIndeterminate }) => (
        <>
          <span className={cx(styles['box'])}>
            {/* Driven by React Aria's state rather than by a class, so the drawn
                mark and the announced one cannot disagree. */}
            {isIndeterminate ? DashMark : CheckMark}
          </span>
          <span>{children}</span>
        </>
      )}
    </AriaCheckbox>
  );
});

export interface RadioProps extends Omit<AriaRadioProps, 'className' | 'style' | 'children'> {
  children?: ReactNode;
  className?: string;
}

export const Radio = forwardRef<HTMLLabelElement, RadioProps>(function Radio(
  { children, className, ...props },
  ref,
) {
  return (
    <AriaRadio {...props} ref={ref} className={cx(styles['choice'], className)}>
      <span className={cx(styles['box'], styles['circle'])}>
        <span className={cx(styles['dot'])} />
      </span>
      <span>{children}</span>
    </AriaRadio>
  );
});

interface GroupExtras {
  label: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  /** Lay the options out in a row. For two or three short ones. */
  orientation?: 'vertical' | 'horizontal';
  className?: string;
  children?: ReactNode;
}

export type CheckboxGroupProps =
  Omit<AriaCheckboxGroupProps, 'className' | 'style' | 'children'> & GroupExtras;

export function CheckboxGroup({
  label, description, errorMessage, orientation = 'vertical', className, children, ...props
}: CheckboxGroupProps): React.JSX.Element {
  const invalid = props.isInvalid ?? Boolean(errorMessage);
  const scope = useInvalidMotion(invalid);

  return (
    <AriaCheckboxGroup {...props} isInvalid={invalid} className={cx(styles['group'], className)}>
      <Label className={cx(styles['legend'])}>{label}</Label>
      <div
        ref={scope as never}
        className={cx(styles['options'], orientation === 'horizontal' ? styles['horizontal'] : undefined)}
      >
        {children}
      </div>
      {description ? (
        <Text slot="description" className={cx(styles['description'])}>{description}</Text>
      ) : null}
      {/* The error describes the set. "Choose at least one" attached to the first
          checkbox is a message about that checkbox. */}
      <FieldError className={cx(styles['error'])}>{errorMessage}</FieldError>
    </AriaCheckboxGroup>
  );
}

export type RadioGroupProps =
  Omit<AriaRadioGroupProps, 'className' | 'style' | 'children'> & GroupExtras;

export function RadioGroup({
  label, description, errorMessage, orientation = 'vertical', className, children, ...props
}: RadioGroupProps): React.JSX.Element {
  const invalid = props.isInvalid ?? Boolean(errorMessage);
  const scope = useInvalidMotion(invalid);

  return (
    <AriaRadioGroup {...props} isInvalid={invalid} className={cx(styles['group'], className)}>
      <Label className={cx(styles['legend'])}>{label}</Label>
      <div
        ref={scope as never}
        className={cx(styles['options'], orientation === 'horizontal' ? styles['horizontal'] : undefined)}
      >
        {children}
      </div>
      {description ? (
        <Text slot="description" className={cx(styles['description'])}>{description}</Text>
      ) : null}
      <FieldError className={cx(styles['error'])}>{errorMessage}</FieldError>
    </AriaRadioGroup>
  );
}
