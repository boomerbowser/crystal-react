import { describe, expect, it } from 'vitest';
import { Form } from 'react-aria-components';
import { renderWithCrystal, screen } from '../test/render.js';
import { TextInput } from '../components/TextInput/TextInput.js';
import { TextArea } from '../components/TextArea/TextArea.js';
import { PasswordInput } from '../components/PasswordInput/PasswordInput.js';
import { NumberInput } from '../components/NumberInput/NumberInput.js';
import { Select } from '../components/Select/Select.js';
import { ComboBox } from '../components/ComboBox/ComboBox.js';
import { DateInput } from '../components/DatePicker/DatePicker.js';
import { CheckboxGroup, Checkbox } from '../components/Checkbox/Checkbox.js';

/* The gate that did not exist, and the reason it matters.
 *
 * React Aria treats a *defined* `isInvalid` as "the caller owns validity from
 * here". Every field in this library coerced it — `props.isInvalid ??
 * Boolean(errorMessage)` — so an untouched field handed React Aria `false`, and
 * `false` is not "this field is fine": it is "stop working out whether it is".
 * Under it the browser's native validation never reached the field, and neither
 * did a single error a `Form` was given to distribute. `<FieldError>` rendered
 * nothing and `aria-invalid` was never set, however loudly the server objected.
 *
 * So: every field that takes a name is put inside a `Form` carrying an error for
 * it, and asked whether it noticed. */

const OPTIONS = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }];

const CASES: Array<[string, React.JSX.Element, string]> = [
  ['TextInput', <TextInput label="Email" name="email" />, 'Email'],
  ['TextArea', <TextArea label="Email" name="email" />, 'Email'],
  ['PasswordInput', <PasswordInput label="Email" name="email" />, 'Email'],
  ['NumberInput', <NumberInput label="Email" name="email" />, 'Email'],
  ['ComboBox', <ComboBox label="Email" name="email" options={OPTIONS} />, 'Email'],
  ['DateInput', <DateInput label="Email" name="email" />, 'Email'],
];

describe('a server error reaches every field', () => {
  for (const [name, element, label] of CASES) {
    it(`${name} shows it and marks itself invalid`, () => {
      const { container } = renderWithCrystal(
        <Form validationErrors={{ email: ['Already registered'] }}>{element}</Form>,
      );
      expect(screen.getByText('Already registered')).toBeInTheDocument();
      /* And it is drawn as wrong, not only announced as wrong. The wrapper is
         where React Aria puts the attribute when it resolved the state itself. */
      expect(container.querySelector('[data-invalid]')).not.toBeNull();
      expect(label).toBe('Email');
    });
  }

  it('Select shows it and marks itself invalid', () => {
    const { container } = renderWithCrystal(
      <Form validationErrors={{ email: ['Already registered'] }}>
        <Select label="Email" name="email" options={OPTIONS} />
      </Form>,
    );
    expect(screen.getByText('Already registered')).toBeInTheDocument();
    expect(container.querySelector('[data-invalid]')).not.toBeNull();
  });

  it('CheckboxGroup shows it and marks itself invalid', () => {
    const { container } = renderWithCrystal(
      <Form validationErrors={{ terms: ['You must agree'] }}>
        <CheckboxGroup label="Terms" name="terms">
          <Checkbox value="yes">I agree</Checkbox>
        </CheckboxGroup>
      </Form>,
    );
    expect(screen.getByText('You must agree')).toBeInTheDocument();
    expect(container.querySelector('[data-invalid]')).not.toBeNull();
  });

  /* The other half: a caller who does say so still wins, and still gets the
     message they wrote rather than one React Aria invented. */
  it("keeps the caller's own error message when one is given", () => {
    renderWithCrystal(
      <Form validationErrors={{ email: ['From the server'] }}>
        <TextInput label="Email" name="email" errorMessage="From the caller" />
      </Form>,
    );
    expect(screen.getByText('From the caller')).toBeInTheDocument();
    expect(screen.queryByText('From the server')).toBeNull();
  });

  it('a caller may still declare a field valid and be believed', () => {
    renderWithCrystal(
      <Form validationErrors={{ email: ['From the server'] }}>
        <TextInput label="Email" name="email" isInvalid={false} />
      </Form>,
    );
    expect(screen.queryByText('From the server')).toBeNull();
    expect(screen.getByRole('textbox', { name: 'Email' }).getAttribute('aria-invalid')).toBeNull();
  });
});
