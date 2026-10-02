'use client';

/* A React Aria radio that plays `selection` when it becomes the chosen option.
 *
 * The catalogue gives `selection` to every control that picks one of several,
 * such as a variant, a shipping service or a payment method. The rule is the one
 * `useChangeMotion` states. It plays on the value React Aria resolved, whether
 * set by a press, an arrow key or from outside, and never on the render that
 * shows an option already chosen. The group's state is read from React Aria's
 * context, so the option needs nothing passed to it that a plain `Radio` does
 * not.
 */
import { useContext } from 'react';
import { Radio, RadioGroupStateContext, type RadioProps } from 'react-aria-components';
import { useChangeMotion, entered } from '../../motion/useChangeMotion.js';

export function SelectedRadio(props: RadioProps): React.JSX.Element {
  const state = useContext(RadioGroupStateContext);
  const scope = useChangeMotion(state?.selectedValue === props.value, entered('selection'));
  return <Radio ref={scope as never} {...props} />;
}
