'use client';

/* SegmentedControl.
 *
 * Radio group semantics, which the catalogue asks for by name and then rules out
 * the alternative: "never `aria-selected` outside a tablist". A segmented control
 * that borrows tab semantics announces its options as tabs, and a reader then
 * expects a panel to change — which is a promise the control did not make.
 *
 * **Selection is weight and the primary fill.** The fill is Crystal's dock, which
 * the catalogue names for this control; the weight is what keeps selection off
 * colour alone, because it is typographic rather than chromatic and survives
 * greyscale, forced colours and a poor screen.
 * In forced colours the fill goes and a ring takes its place, because Chromium's
 * text backplate erases a filled label.
 */
import type { ReactNode } from 'react';
import { RadioGroup, Radio, Label, Text, FieldError, type RadioGroupProps } from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import styles from './SegmentedControl.module.scss';

export interface SegmentedOption {
  value: string;
  label: ReactNode;
  isDisabled?: boolean;
}

export interface SegmentedControlProps extends Omit<RadioGroupProps, 'className' | 'style' | 'children'> {
  label: ReactNode;
  /** The options, in order. */
  options: readonly SegmentedOption[];
  description?: ReactNode;
  errorMessage?: ReactNode;
  /** Hide the label visually. It stays the group's accessible name. */
  labelHidden?: boolean;
  className?: string;
}

export function SegmentedControl({
  label, options, description, errorMessage, labelHidden = false, className, ...props
}: SegmentedControlProps): React.JSX.Element {
  /* A hidden label still has to name the group. Only a string can become an
     `aria-label`, so a rich label is rendered visually-hidden instead — never
     dropped, which would leave the group unnamed. */
  const hiddenStringLabel = labelHidden && typeof label === 'string' ? label : undefined;

  return (
    /* A radio group rather than a tablist: these are mutually exclusive values,
       not views, and the two are announced differently for good reason. */
    <RadioGroup
      {...props}
      className={cx(styles['group'], className)}
      {...(hiddenStringLabel ? { 'aria-label': hiddenStringLabel } : {})}
    >
      {labelHidden
        ? (hiddenStringLabel ? null : <VisuallyHidden as="span"><Label>{label}</Label></VisuallyHidden>)
        : <Label className={cx(styles['legend'])}>{label}</Label>}
      <div className={cx(styles['strip'], 'cr-dock')}>
        {options.map((option) => (
          <Radio
            key={option.value}
            value={option.value}
            isDisabled={option.isDisabled ?? false}
            className={cx(styles['segment'])}
          >
            {option.label}
          </Radio>
        ))}
      </div>
      {description ? (
        <Text slot="description" className={cx(styles['description'])}>{description}</Text>
      ) : null}
      <FieldError className={cx(styles['error'])}>{errorMessage}</FieldError>
    </RadioGroup>
  );
}
