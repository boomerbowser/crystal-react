'use client';

/* The shell of a React Aria field.
 *
 * It carries the validity React Aria resolved, which can differ from the one
 * the caller declared. They differ when the field is wrong for a reason the
 * caller does not know about, such as a server's rejection distributed by
 * `Form` or a native constraint the browser checked. Crystal's validation
 * motion has to play in those cases too: a field that failed on the server
 * must look exactly like one that failed locally, because to the person
 * filling in the form they are the same thing.
 *
 * React Aria hands that resolved value to a render function, which is why the
 * shell is a component and not a `<div>` written inline.
 */
import type { ReactNode, Ref } from 'react';
import { Button, Group } from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import { useFieldMotion, useInvalidMotion } from './useInvalidMotion.js';

export interface FieldShellProps {
  isInvalid: boolean;
  /** Mark focus as well as validity. On for a shell holding a single control. */
  playsFocus?: boolean;
  className?: string | undefined;
  children: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

export function FieldShell({
  isInvalid, playsFocus = true, className, children,
}: FieldShellProps): React.JSX.Element {
  const [scope, play] = useFieldMotion(isInvalid);
  return (
    <div
      ref={scope as never}
      className={cx(className)}
      {...(isInvalid ? { 'data-invalid': true } : {})}
      /* React's onFocus is focusin, so it arrives here from the control inside.
         One handler on the shell rather than one on every control that might
         live in it. */
      {...(playsFocus ? { onFocus: () => play('field-focus') } : {})}
    >
      {children}
    </div>
  );
}

/**
 * The same, as React Aria's `Group`, for a field made of several controls: a
 * date field's segments, a number field's stepper, a combobox's input and its
 * button. `Group` gives the collection one focus ring and one name, and this
 * gives it the validity React Aria resolved.
 */
export interface FieldGroupShellProps extends FieldShellProps {}

export function FieldGroupShell({
  isInvalid, playsFocus = true, className, children,
}: FieldGroupShellProps): React.JSX.Element {
  const [scope, play] = useFieldMotion(isInvalid);
  return (
    <Group
      ref={scope as never}
      className={cx(className)}
      {...(isInvalid ? { 'data-invalid': true } : {})}
      {...(playsFocus ? { onFocus: () => play('field-focus') } : {})}
    >
      {children}
    </Group>
  );
}

/**
 * The same again, as React Aria's `Button`, for a select's trigger, where the
 * shell and the control are one pressable element. It takes no `playsFocus`,
 * because a button marks its own focus and the field motion here is validation
 * only.
 */
export interface FieldButtonShellProps {
  isInvalid: boolean;
  className?: string | undefined;
  children: ReactNode;
}

export function FieldButtonShell({
  isInvalid, className, children,
}: FieldButtonShellProps): React.JSX.Element {
  const scope = useInvalidMotion(isInvalid);
  return (
    <Button
      ref={scope as never}
      className={cx(className)}
      {...(isInvalid ? { 'data-invalid': true } : {})}
    >
      {children}
    </Button>
  );
}
