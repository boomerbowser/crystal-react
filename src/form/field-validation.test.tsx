import { describe, expect, it } from 'vitest';
import { Form } from 'react-aria-components';
import { renderWithCrystal, screen } from '../test/render.js';
import { TextInput } from '../components/TextInput/TextInput.js';
import { TextArea } from '../components/TextArea/TextArea.js';
import { PasswordInput } from '../components/PasswordInput/PasswordInput.js';
import { NumberInput } from '../components/NumberInput/NumberInput.js';
import { Select } from '../components/Select/Select.js';
import { ComboBox } from '../components/ComboBox/ComboBox.js';
import { DateInput, TimeInput, DatePicker, DateRangePicker } from '../components/DatePicker/DatePicker.js';
import { CheckboxGroup, Checkbox } from '../components/Checkbox/Checkbox.js';
import { MaskInput } from '../components/MaskInput/MaskInput.js';
import { PinInput } from '../components/PinInput/PinInput.js';
import { TagsInput } from '../components/TagsInput/TagsInput.js';
import { MultiSelect } from '../components/MultiSelect/MultiSelect.js';
import { RichTextSurface } from '../components/RichTextSurface/RichTextSurface.js';
import { FormField } from '../components/FormField/FormField.js';

/* React Aria treats a defined `isInvalid` as "the caller owns validity from
 * here". A field that coerces it, as in `props.isInvalid ??
 * Boolean(errorMessage)`, hands React Aria `false` when untouched, and `false`
 * means "stop working out whether it is valid". The browser's native validation
 * then never reaches the field, and neither does any error a `Form` was given
 * to distribute. `<FieldError>` renders nothing and `aria-invalid` is never set.
 *
 * Every field that takes a name is put inside a `Form` carrying an error for
 * it, and the test checks that the field shows it. */

const OPTIONS = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }];

const CASES: Array<[string, React.JSX.Element, string]> = [
  ['TextInput', <TextInput label="Email" name="email" />, 'Email'],
  ['TextArea', <TextArea label="Email" name="email" />, 'Email'],
  ['PasswordInput', <PasswordInput label="Email" name="email" />, 'Email'],
  ['NumberInput', <NumberInput label="Email" name="email" />, 'Email'],
  ['ComboBox', <ComboBox label="Email" name="email" options={OPTIONS} />, 'Email'],
  ['DateInput', <DateInput label="Email" name="email" />, 'Email'],
  ['TimeInput', <TimeInput label="Email" name="email" />, 'Email'],
  ['DatePicker', <DatePicker label="Email" name="email" />, 'Email'],

];

describe('a server error reaches every field', () => {
  for (const [name, element, label] of CASES) {
    it(`${name} shows it and marks itself invalid`, () => {
      const { container } = renderWithCrystal(
        <Form validationErrors={{ email: ['Already registered'] }}>{element}</Form>,
      );
      expect(screen.getByText('Already registered')).toBeInTheDocument();
      /* It is drawn as invalid as well as announced. The wrapper is where React
         Aria puts the attribute when it resolved the state itself. */
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

  /* A caller who does set validity still wins, and gets the message they wrote
     instead of one React Aria supplies. */
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

/* The hand-built fields.
 *
 * Most fields here are React Aria components, and React Aria hands them their
 * share of a `Form`'s errors automatically. These fields are built by hand, so
 * React Aria does not reach them. Each takes a `name`, to match a server's error
 * against, and reads the same context React Aria's own fields read. Validation
 * display stays with React Aria this way. */
describe('a server error reaches the hand-built fields too', () => {
  const HAND_BUILT: Array<[string, React.JSX.Element]> = [
    ['MaskInput', <MaskInput label="Phone" name="phone" mask="(000) 000-0000" />],
    ['PinInput', <PinInput label="Phone" name="phone" length={4} />],
    ['TagsInput', <TagsInput label="Phone" name="phone" />],
    ['MultiSelect', <MultiSelect label="Phone" name="phone" options={OPTIONS} />],
    ['RichTextSurface', <RichTextSurface label="Phone" name="phone"><div contentEditable /></RichTextSurface>],
    ['FormField', <FormField label="Phone" name="phone"><input /></FormField>],
  ];

  for (const [name, element] of HAND_BUILT) {
    it(`${name} shows what the form was given for it`, () => {
      renderWithCrystal(
        <Form validationErrors={{ phone: ['We could not reach that number'] }}>{element}</Form>,
      );
      expect(screen.getByRole('alert').textContent).toContain('We could not reach that number');
    });
  }

  /* A caller's own message still wins. It is the more specific statement, and
     showing two at once would contradict each other. */
  it("prefers the caller's message to the form's", () => {
    renderWithCrystal(
      <Form validationErrors={{ phone: ['From the server'] }}>
        <MaskInput label="Phone" name="phone" mask="(000) 000-0000" errorMessage="From the caller" />
      </Form>,
    );
    expect(screen.getByRole('alert').textContent).toBe('From the caller');
  });
});

/* A range is two values, so it is two names. A single `name` reaches neither
   end, which is React Aria's design. The type omits `name` instead of accepting
   one it would ignore. */
describe('DateRangePicker', () => {
  it('takes an error on either end', () => {
    renderWithCrystal(
      <Form validationErrors={{ 'trip-start': ['Too early'] }}>
        <DateRangePicker label="Trip" startName="trip-start" endName="trip-end" />
      </Form>,
    );
    expect(screen.getByText('Too early')).toBeInTheDocument();
  });
});
