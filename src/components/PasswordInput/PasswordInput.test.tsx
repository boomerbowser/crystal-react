import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { PasswordInput } from './PasswordInput.js';

describe('PasswordInput', () => {
  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<PasswordInput label="Password" />);
    await expectNoAxeViolations(container);
  });

  /* Each part of the catalogue's sentence prevents a known failure: a div that
     cannot be reached by keyboard, a toggle that announces the same thing in
     both states, and an eye icon that says nothing at all. */
  it('has a named toggle that says which state it is in', async () => {
    renderWithCrystal(<PasswordInput label="Password" reveals="the password" />);
    const toggle = screen.getByRole('button', { name: 'Show the password' });
    expect(toggle.getAttribute('aria-pressed')).toBe('false');

    await userEvent.click(toggle);
    const hide = screen.getByRole('button', { name: 'Hide the password' });
    expect(hide.getAttribute('aria-pressed')).toBe('true');
  });

  it('reaches the toggle from the keyboard', async () => {
    renderWithCrystal(<PasswordInput label="Password" />);
    await userEvent.tab();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: /Show/ })).toHaveFocus();
  });

  /* A bar that is longer or shorter is meaningless to a reader who cannot see it
     and imprecise to one who can, so the word carries the meaning. */
  it('says the strength in words, not only as a bar', () => {
    renderWithCrystal(
      <PasswordInput label="Password" strength={{ score: 0.3, label: 'Weak', tone: 'danger' }} />,
    );
    expect(screen.getByRole('status').textContent).toBe('Weak');
  });
});
