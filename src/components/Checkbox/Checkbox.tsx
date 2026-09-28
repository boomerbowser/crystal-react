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
import { forwardRef, useEffect, useRef, type ReactNode } from 'react';
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
import { useMotion } from '../../motion/useMotion.js';
import { declaredInvalid } from '../FormField/useInvalidMotion.js';
import { FieldShell } from '../FormField/FieldShell.js';
import styles from './Checkbox.module.scss';

/* Plays `check` when the value becomes true and `check-off` when it returns to
 * false — Crystal's iris opening and closing toward the same point. Bound to the
 * value React Aria resolved rather than to a click, so a checkbox changed by the
 * keyboard, by a form reset or by a server response animates the same way one
 * changed by hand does; and undefined first, so a box that mounts already
 * checked does not animate, because that state was never entered.
 *
 * The catalogue assigned both recipes to the checkbox and the radio from 2.0,
 * and R15h in Crystal's request log recorded that the web preview had `check`
 * "wired to nothing". This library shipped the same way until now. */
function ChoiceMotion({ isSelected, play }: {
  isSelected: boolean;
  play: ReturnType<typeof useMotion>[1];
}): null {
  const previous = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    if (previous.current !== undefined && previous.current !== isSelected) {
      void play(isSelected ? 'check' : 'check-off');
    }
    previous.current = isSelected;
  }, [isSelected, play]);
  return null;
}

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
  /* The recipe plays on the box, which is the indicator: the label stays still. */
  const [scope, play] = useMotion();
  return (
    <AriaCheckbox {...props} ref={ref} className={cx(styles['choice'], className)}>
      {({ isIndeterminate, isSelected }) => (
        <>
          <span ref={scope as never} className={cx(styles['box'])}>
            {/* Driven by React Aria's state rather than by a class, so the drawn
                mark and the announced one cannot disagree. */}
            {isIndeterminate ? DashMark : CheckMark}
          </span>
          <span>{children}</span>
          <ChoiceMotion isSelected={isSelected} play={play} />
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
  const [scope, play] = useMotion();
  return (
    <AriaRadio {...props} ref={ref} className={cx(styles['choice'], className)}>
      {({ isSelected }) => (
        <>
          <span ref={scope as never} className={cx(styles['box'], styles['circle'])}>
            <span className={cx(styles['dot'])} />
          </span>
          <span>{children}</span>
          <ChoiceMotion isSelected={isSelected} play={play} />
        </>
      )}
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

  return (
    <AriaCheckboxGroup {...props} {...declaredInvalid(props.isInvalid, errorMessage)} className={cx(styles['group'], className)}>
      {({ isInvalid }) => (
      <>
      <Label className={cx(styles['legend'])}>{label}</Label>
      {/* The validity React Aria resolved, not the one the caller declared: a
          server's "choose at least one" has to move the set exactly as a local
          rule would. */}
      <FieldShell
        isInvalid={isInvalid}
        playsFocus={false}
        className={cx(styles['options'], orientation === 'horizontal' ? styles['horizontal'] : undefined)}
      >
        {children}
      </FieldShell>
      {description ? (
        <Text slot="description" className={cx(styles['description'])}>{description}</Text>
      ) : null}
      {/* The error describes the set. "Choose at least one" attached to the first
          checkbox is a message about that checkbox. */}
      <FieldError className={cx(styles['error'])}>{errorMessage}</FieldError>
      </>
      )}
    </AriaCheckboxGroup>
  );
}

export type RadioGroupProps =
  Omit<AriaRadioGroupProps, 'className' | 'style' | 'children'> & GroupExtras;

export function RadioGroup({
  label, description, errorMessage, orientation = 'vertical', className, children, ...props
}: RadioGroupProps): React.JSX.Element {

  return (
    <AriaRadioGroup {...props} {...declaredInvalid(props.isInvalid, errorMessage)} className={cx(styles['group'], className)}>
      {({ isInvalid }) => (
      <>
      <Label className={cx(styles['legend'])}>{label}</Label>
      {/* The validity React Aria resolved, not the one the caller declared: a
          server's "choose at least one" has to move the set exactly as a local
          rule would. */}
      <FieldShell
        isInvalid={isInvalid}
        playsFocus={false}
        className={cx(styles['options'], orientation === 'horizontal' ? styles['horizontal'] : undefined)}
      >
        {children}
      </FieldShell>
      {description ? (
        <Text slot="description" className={cx(styles['description'])}>{description}</Text>
      ) : null}
      <FieldError className={cx(styles['error'])}>{errorMessage}</FieldError>
      </>
      )}
    </AriaRadioGroup>
  );
}
