import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { TextArea } from './TextArea.js';
import { NumberInput } from '../NumberInput/NumberInput.js';
import { SearchInput } from '../SearchInput/SearchInput.js';
import { JsonInput } from '../JsonInput/JsonInput.js';

describe('TextArea', () => {
  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<TextArea label="Notes" />);
    await expectNoAxeViolations(container);
  });

  /* A live region that speaks on every keystroke is a field nobody can use with
     a screen reader, so the count announces only as the limit approaches. */
  it('announces the count only as the limit approaches', async () => {
    renderWithCrystal(<TextArea label="Bio" maxLength={30} />);
    expect(screen.queryByRole('status')).toBeNull();

    await userEvent.type(screen.getByRole('textbox', { name: 'Bio' }), 'a'.repeat(12));
    expect(screen.getByRole('status').textContent).toContain('12 / 30');
  });

  it('becomes invalid past the limit', async () => {
    renderWithCrystal(<TextArea label="Bio" maxLength={3} />);
    const field = screen.getByRole('textbox', { name: 'Bio' });
    await userEvent.type(field, 'abcd');
    expect(field.getAttribute('aria-invalid')).toBe('true');
  });
});

describe('NumberInput', () => {
  /* The catalogue allows either a native number input or a text input with
     `inputmode` — React Aria takes the second, which is the better half of the
     choice: a native number input drops values it cannot parse and formats to the
     browser's locale rather than the document's. What has to be true either way
     is that the arrow keys step. */
  it('takes a numeric keypad and steps from the keyboard', async () => {
    const { container } = renderWithCrystal(
      <NumberInput label="Quantity" defaultValue={2} minValue={0} maxValue={10} />,
    );
    const field = screen.getByRole('textbox', { name: 'Quantity' }) as HTMLInputElement;
    expect(field.inputMode).toBe('numeric');

    field.focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(field.value).toBe('3');
    await expectNoAxeViolations(container);
  });

  /* A control that silently refuses to move is indistinguishable from one that
     is broken. */
  it('disables the stepper at a bound rather than refusing silently', () => {
    renderWithCrystal(<NumberInput label="Quantity" defaultValue={10} minValue={0} maxValue={10} />);
    expect(screen.getByRole('button', { name: /Increase/i })).toBeDisabled();
  });

  /* React Aria names the steppers from the field's own label, so a form with
     three number fields does not have three buttons called "Increase". */
  it('names its steppers after the field', () => {
    renderWithCrystal(<NumberInput label="Quantity" defaultValue={2} />);
    expect(screen.getByRole('button', { name: /Increase Quantity/i })).toBeInTheDocument();
  });
});

describe('SearchInput', () => {
  /* A landmark is a statement about the page, and two of them is worse than
     none — so it is opt-in. */
  it('emits no landmark unless asked', () => {
    const { container, rerenderWithCrystal } = renderWithCrystal(<SearchInput label="Find" />);
    expect(container.querySelector('search')).toBeNull();

    /* The native `search` element rather than `role="search"`: it is the same
       landmark, and jsdom's role mapping simply predates the element. */
    rerenderWithCrystal(<SearchInput label="Find" landmark />);
    expect(container.querySelector('search')).not.toBeNull();
  });

  /* A spinner that only spins says nothing to a reader who cannot see it. */
  it('announces that a search is running', () => {
    renderWithCrystal(<SearchInput label="Find" isLoading />);
    expect(screen.getByRole('status').textContent).toBe('Searching');
  });
});

describe('JsonInput', () => {
  /* The parser's own message names the position. Replacing it with "Invalid JSON"
     throws away the only part that helps. */
  it('reports the parse error in text, associated with the field', async () => {
    renderWithCrystal(<JsonInput label="Configuration" defaultValue="{ oops }" />);
    const field = screen.getByRole('textbox', { name: 'Configuration' });
    field.focus();
    await userEvent.tab();

    const described = field.getAttribute('aria-describedby') ?? '';
    const message = described.split(' ').map((id) => document.getElementById(id)?.textContent ?? '').join(' ');
    expect(message).toMatch(/JSON|token|position/i);
  });

  /* JSON is invalid for almost the whole time it is being typed, so reporting
     after every character is a field shouting at somebody mid-sentence. */
  it('stays quiet while it is being typed', async () => {
    renderWithCrystal(<JsonInput label="Configuration" />);
    /* `{` starts a special-key sequence for userEvent, so it is escaped. */
    await userEvent.type(screen.getByRole('textbox', { name: 'Configuration' }), '{{ "a":');
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
