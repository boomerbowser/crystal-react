'use client';

/* AuthBlock — sign in, register, reset and verification.
 *
 * "**Real form semantics with autocomplete tokens; failures never reveal which
 * factor was wrong.**" States: `at-rest`, `submitting`, `error`, `locked`.
 *
 * The provider and its policy are the product's. The block owns the parts a
 * password manager and an attacker both read:
 *
 *   - **A real form.** One `<form>` per mode, a submit button, named fields, and
 *     the autocomplete token each field actually is: `username` and
 *     `current-password` to sign in, `new-password` to register, `one-time-code`
 *     to verify. A password manager fills and saves from those tokens, and a
 *     phone offers the code from the message that carried it.
 *   - **A failure names no factor.** Signing in takes one message for every
 *     failure — no account, wrong password, wrong code — and the block has no
 *     way to attach it to a field, so a product cannot say "no account uses that
 *     address" by accident. A reset always answers the same way, whether or not
 *     the address has an account. Registration is the exception the catalogue
 *     allows: its errors are about the shape of what was typed ("use at least
 *     12 characters"), and they are the product's to word without naming an
 *     existing account.
 *   - **Locked is said and holds the form.** Too many attempts disables the
 *     fields and says when to try again, as an alert.
 *
 * "Haze card on the Plastic foundation": the block draws both — the Plastic
 * ground it stands on and the Haze card on it — because an authentication page
 * is usually the whole page.
 */
import type { FormEvent, ReactNode } from 'react';
import { Form } from 'react-aria-components';
import { Button } from '../Button/Button.js';
import { TextInput } from '../TextInput/TextInput.js';
import { PasswordInput } from '../PasswordInput/PasswordInput.js';
import { PinInput } from '../PinInput/PinInput.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import { cx } from '../../styles/cx.js';
import styles from './AuthBlock.module.scss';

export type AuthMode = 'sign-in' | 'register' | 'reset' | 'verify';
export type AuthState = 'at-rest' | 'submitting' | 'error' | 'locked';

export interface AuthBlockProps {
  mode: AuthMode;
  /** Another mode, chosen from the links beneath the form. Omit to offer none. */
  onModeChange?: (mode: AuthMode) => void;
  /** The form's values, as the browser collects them from the named fields. */
  onSubmit: (values: FormData) => void;
  state?: AuthState;
  /**
   * Shown in `error`. One message for every failure; there is deliberately no
   * way to attach it to a field.
   */
  errorMessage?: ReactNode;
  /** Shown in `locked`: when to try again. */
  lockedMessage?: ReactNode;
  /** Registration only: field name → a message about the shape of what was typed. */
  errors?: Readonly<Record<string, string>>;
  /** A notice above the form — after a reset, the answer that names no account. */
  notice?: ReactNode;
  /** The product's name or mark, above the heading. */
  brand?: ReactNode;
  headingLevel?: 1 | 2;
  className?: string;
}

const HEADING: Readonly<Record<AuthMode, string>> = {
  'sign-in': 'Sign in',
  register: 'Create an account',
  reset: 'Reset your password',
  verify: 'Enter your code',
};

const SUBMIT: Readonly<Record<AuthMode, string>> = {
  'sign-in': 'Sign in',
  register: 'Create account',
  reset: 'Send reset link',
  verify: 'Verify',
};

const BUSY: Readonly<Record<AuthMode, string>> = {
  'sign-in': 'Signing in',
  register: 'Creating your account',
  reset: 'Sending',
  verify: 'Checking your code',
};

export const DEFAULT_AUTH_ERROR = 'That did not work. Check what you entered and try again.';

export function AuthBlock({
  mode, onModeChange, onSubmit, state = 'at-rest', errorMessage = DEFAULT_AUTH_ERROR,
  lockedMessage = 'Too many attempts. Try again later.', errors = {}, notice, brand, headingLevel = 1, className,
}: AuthBlockProps): React.JSX.Element {
  const Heading = `h${headingLevel}` as 'h1';
  const busy = state === 'submitting';
  const held = busy || state === 'locked';

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (held) return;
    onSubmit(new FormData(event.currentTarget));
  };

  return (
    <div className={cx(styles['ground'], 'cr-plastic', className)} data-cr-state={state}>
      <div className={cx(styles['card'], 'cr-haze')}>
        {brand ? <div className={cx(styles['brand'])}>{brand}</div> : null}
        <Heading className={cx(styles['heading'])}>{HEADING[mode]}</Heading>

        {notice ? <p role="status" className={cx(styles['notice'])}>{notice}</p> : null}
        {state === 'error' ? <p role="alert" className={cx(styles['failure'])}>{errorMessage}</p> : null}
        {state === 'locked' ? <p role="alert" className={cx(styles['failure'])}>{lockedMessage}</p> : null}

        <Form
          onSubmit={submit}
          validationBehavior="aria"
          {...(mode === 'register' ? { validationErrors: errors } : {})}
          aria-busy={busy || undefined}
          className={cx(styles['form'])}
        >
          <fieldset disabled={held} className={cx(styles['fields'])}>
            <Fields mode={mode} />
          </fieldset>
          <Button type="submit" variant="primary" isDisabled={held} className={cx(styles['submit'])}>
            {SUBMIT[mode]}
          </Button>
        </Form>

        {onModeChange ? <Alternatives mode={mode} onModeChange={onModeChange} /> : null}

        <VisuallyHidden role="status">{busy ? BUSY[mode] : ''}</VisuallyHidden>
      </div>
    </div>
  );
}

/* Each mode's fields, with the token each one is. */
function Fields({ mode }: { mode: AuthMode }): React.JSX.Element {
  switch (mode) {
    case 'sign-in':
      return (
        <>
          <TextInput name="email" type="email" label="Email" autoComplete="username" isRequired />
          <PasswordInput name="password" label="Password" autoComplete="current-password" isRequired />
        </>
      );
    case 'register':
      return (
        <>
          <TextInput name="name" label="Name" autoComplete="name" isRequired />
          <TextInput name="email" type="email" label="Email" autoComplete="username" isRequired />
          <PasswordInput name="password" label="Password" autoComplete="new-password" isRequired />
        </>
      );
    case 'reset':
      return <TextInput name="email" type="email" label="Email" autoComplete="username" isRequired />;
    case 'verify':
      return <PinInput name="code" label="Code" description="Sent to your phone or email." />;
  }
}

function Alternatives({ mode, onModeChange }: { mode: AuthMode; onModeChange: (mode: AuthMode) => void }): React.JSX.Element {
  const go = (to: AuthMode, label: string): React.JSX.Element => (
    <Button key={to} variant="quiet" onPress={() => { onModeChange(to); }}>{label}</Button>
  );
  return (
    <div className={cx(styles['alternatives'])}>
      {mode === 'sign-in' ? [go('reset', 'Forgot your password?'), go('register', 'Create an account')] : go('sign-in', 'Back to sign in')}
    </div>
  );
}
