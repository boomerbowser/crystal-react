import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { PinInput } from './PinInput.js';

describe('PinInput', () => {
  it('has no accessibility violations and is one labelled group', async () => {
    const { container } = renderWithCrystal(<PinInput label="Verification code" length={4} />);
    expect(screen.getByRole('group', { name: 'Verification code' })).toBeInTheDocument();
    /* Each cell says where it is, so arrowing through the row is followable. */
    expect(screen.getByRole('textbox', { name: 'Character 1 of 4' })).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  /* The single most common complaint about this pattern: a code arrives from a
     text message as one string, and a row of boxes that each take one character
     turns a paste into one character in the first box. */
  it('fills the whole value from a paste', async () => {
    const onChange = vi.fn();
    renderWithCrystal(<PinInput label="Code" length={6} onChange={onChange} />);
    const first = screen.getByRole('textbox', { name: 'Character 1 of 6' });
    first.focus();
    await userEvent.paste('482913');
    expect(onChange).toHaveBeenLastCalledWith('482913');
  });

  it('calls back once the last character is entered', async () => {
    const onComplete = vi.fn();
    renderWithCrystal(<PinInput label="Code" length={4} onComplete={onComplete} />);
    screen.getByRole('textbox', { name: 'Character 1 of 4' }).focus();
    await userEvent.paste('1234');
    expect(onComplete).toHaveBeenCalledWith('1234');
  });

  /* Backspace in an empty box steps back and deletes there; otherwise correcting
     a typo means reaching for the pointer. */
  it('moves back on backspace in an empty cell', async () => {
    renderWithCrystal(<PinInput label="Code" length={4} defaultValue="12" />);
    const third = screen.getByRole('textbox', { name: 'Character 3 of 4' });
    third.focus();
    await userEvent.keyboard('{Backspace}');
    expect(screen.getByRole('textbox', { name: 'Character 2 of 4' })).toHaveFocus();
  });
});
