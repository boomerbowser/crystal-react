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

  /* A live region that speaks on every keystroke makes the field unusable with a
     screen reader, so the count announces only as the limit approaches. The
     region itself exists from the first render, because one that appears at the
     same moment as its content is not reliably announced. */
  it('mounts the live region silent and fills it as the limit approaches', async () => {
    renderWithCrystal(<TextArea label="Bio" maxLength={30} />);
    const region = screen.getByRole('status');
    expect(region.textContent).toBe('');

    const field = screen.getByRole('textbox', { name: 'Bio' });
    await userEvent.type(field, 'a'.repeat(5));
    /* Still 25 remaining, so nothing is said yet, and the same node is still there. */
    expect(screen.getByRole('status')).toBe(region);
    expect(region.textContent).toBe('');

    await userEvent.type(field, 'a'.repeat(7));
    expect(region.textContent).toBe('18 characters remaining');
    /* The visible figure is separate, and not announced twice. */
    expect(screen.getByText('12 / 30').getAttribute('aria-hidden')).toBe('true');
  });

  it('says how far over the limit the text is', async () => {
    renderWithCrystal(<TextArea label="Bio" maxLength={4} />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Bio' }), 'abcdefg');
    expect(screen.getByRole('status').textContent).toBe('3 characters over the limit');
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
     `inputmode`. React Aria uses the text input. A native number input drops
     values it cannot parse and formats to the browser's locale instead of the
     document's. Either way, the arrow keys must step. */
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

  /* A control that silently refuses to move looks broken. */
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
  /* A landmark describes the page, and two search landmarks are worse than none,
     so it is opt-in. */
  it('emits no landmark unless asked', () => {
    const { container, rerenderWithCrystal } = renderWithCrystal(<SearchInput label="Find" />);
    expect(container.querySelector('search')).toBeNull();

    /* Queries the native `search` element instead of `role="search"`. It is the
       same landmark, and jsdom's role mapping predates the element. */
    rerenderWithCrystal(<SearchInput label="Find" landmark />);
    expect(container.querySelector('search')).not.toBeNull();
  });

  /* A spinner alone tells a reader who cannot see it nothing. */
  it('announces that a search is running', () => {
    renderWithCrystal(<SearchInput label="Find" isLoading />);
    expect(screen.getByRole('status').textContent).toBe('Searching');
  });
});

describe('JsonInput', () => {
  /* The parser's own message names the position, so it is reported as is. "Invalid
     JSON" would lose the position. */
  it('reports the parse error in text, associated with the field', async () => {
    renderWithCrystal(<JsonInput label="Configuration" defaultValue="{ oops }" />);
    const field = screen.getByRole('textbox', { name: 'Configuration' });
    field.focus();
    await userEvent.tab();

    const described = field.getAttribute('aria-describedby') ?? '';
    const message = described.split(' ').map((id) => document.getElementById(id)?.textContent ?? '').join(' ');
    expect(message).toMatch(/JSON|token|position/i);
  });

  /* JSON is invalid for almost the whole time it is being typed, so the error is
     not reported after every character. */
  it('stays quiet while it is being typed', async () => {
    renderWithCrystal(<JsonInput label="Configuration" />);
    /* `{` starts a special-key sequence for userEvent, so it is escaped. */
    await userEvent.type(screen.getByRole('textbox', { name: 'Configuration' }), '{{ "a":');
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
