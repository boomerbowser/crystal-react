import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { AuthBlock, DEFAULT_AUTH_ERROR, type AuthMode, type AuthState } from './AuthBlock.js';

const noop = (): void => {};
const field = (name: string): HTMLInputElement => {
  const found = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
  if (!found) throw new Error(`no field named ${name}`);
  return found;
};

describe('AuthBlock', () => {
  /* First half of the catalogue rule: real form semantics with autocomplete tokens. */
  it.each([
    ['sign-in', { email: 'username', password: 'current-password' }],
    ['register', { name: 'name', email: 'username', password: 'new-password' }],
    ['reset', { email: 'username' }],
  ] as const)('gives the %s fields the tokens they are', (mode, tokens) => {
    renderWithCrystal(<AuthBlock mode={mode} onSubmit={noop} />);
    for (const [name, token] of Object.entries(tokens)) expect(field(name)).toHaveAttribute('autocomplete', token);
    expect(screen.getByRole('button', { name: /sign in|create account|send reset link/i })).toHaveAttribute('type', 'submit');
  });

  it('offers a one-time code to the verification field', () => {
    renderWithCrystal(<AuthBlock mode="verify" onSubmit={noop} />);
    expect(document.querySelector('input[autocomplete="one-time-code"]')).not.toBeNull();
  });

  it('is one real form that hands the product the named values', async () => {
    const onSubmit = vi.fn();
    renderWithCrystal(<AuthBlock mode="sign-in" onSubmit={onSubmit} />);
    expect(document.querySelectorAll('form')).toHaveLength(1);
    await userEvent.type(screen.getByRole('textbox', { name: 'Email' }), 'ada@example.com');
    await userEvent.type(field('password'), 'correct horse');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    const values = onSubmit.mock.calls[0]![0] as FormData;
    expect(values.get('email')).toBe('ada@example.com');
    expect(values.get('password')).toBe('correct horse');
  });

  /* Second half: a failure never reveals which factor was wrong. */
  it('says one failure for signing in, attached to no field, whatever the product passes', () => {
    renderWithCrystal(
      <AuthBlock mode="sign-in" onSubmit={noop} state="error" errors={{ email: 'No account uses that address' }} />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(DEFAULT_AUTH_ERROR);
    expect(screen.queryByText('No account uses that address')).toBeNull();
    expect(field('email')).not.toHaveAttribute('aria-invalid');
    expect(field('password')).not.toHaveAttribute('aria-invalid');
  });

  it('does not take field errors for a reset either', () => {
    renderWithCrystal(<AuthBlock mode="reset" onSubmit={noop} errors={{ email: 'No account uses that address' }} />);
    expect(screen.queryByText('No account uses that address')).toBeNull();
  });

  it('lets registration say what is wrong with the shape of a field', () => {
    renderWithCrystal(<AuthBlock mode="register" onSubmit={noop} errors={{ password: 'Use at least 12 characters' }} />);
    expect(screen.getByText('Use at least 12 characters')).toBeInTheDocument();
    expect(field('password')).toHaveAttribute('aria-invalid', 'true');
  });

  it('holds the form when locked, and says when to try again', async () => {
    const onSubmit = vi.fn();
    renderWithCrystal(<AuthBlock mode="sign-in" onSubmit={onSubmit} state="locked" lockedMessage="Try again in 15 minutes." />);
    expect(screen.getByRole('alert')).toHaveTextContent('Try again in 15 minutes.');
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('says it is signing in, from a region that was already there', () => {
    const { rerender } = renderWithCrystal(<AuthBlock mode="sign-in" onSubmit={noop} />);
    expect(screen.getByRole('status')).toHaveTextContent('');
    rerender(<AuthBlock mode="sign-in" onSubmit={noop} state="submitting" />);
    expect(screen.getByRole('status')).toHaveTextContent('Signing in');
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled();
  });

  it('moves between modes when the product can', async () => {
    const onModeChange = vi.fn();
    renderWithCrystal(<AuthBlock mode="sign-in" onSubmit={noop} onModeChange={onModeChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Forgot your password?' }));
    expect(onModeChange).toHaveBeenCalledWith('reset');
  });

  it.each(
    (['sign-in', 'register', 'reset', 'verify'] as AuthMode[]).flatMap((mode) =>
      (['at-rest', 'submitting', 'error', 'locked'] as AuthState[]).map((state) => [mode, state] as const)),
  )('has no axe violations %s %s', async (mode, state) => {
    const { container } = renderWithCrystal(
      <AuthBlock mode={mode} state={state} onSubmit={noop} onModeChange={noop} notice={mode === 'reset' ? 'If an account uses that address, a link is on its way.' : undefined} />,
    );
    await expectNoAxeViolations(container);
  });
});
