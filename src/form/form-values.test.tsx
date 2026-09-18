import { describe, it, expect } from 'vitest';
import { renderWithCrystal } from '../test/render.js';
import { PinInput } from '../components/PinInput/PinInput.js';
import { TagsInput } from '../components/TagsInput/TagsInput.js';
import { MultiSelect } from '../components/MultiSelect/MultiSelect.js';
import { MaskInput } from '../components/MaskInput/MaskInput.js';

const OPTIONS = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }];

/* A field with a `name` has to put something in the form. Four of these took a
   name and submitted nothing, which is worse than taking no name at all: a
   required field that never submits fails validation, gets filled in, and fails
   again — a loop with no way out from inside the form. */
describe('a named field reaches FormData', () => {
  const read = (form: HTMLFormElement) => [...new FormData(form).entries()];

  it('MaskInput submits its raw value', () => {
    const { container } = renderWithCrystal(
      <form><MaskInput label="P" name="f" mask="0000" defaultValue="1234" /></form>,
    );
    expect(read(container.querySelector('form')!)).toEqual([['f', '1234']]);
  });

  it('PinInput submits the whole code as one value', () => {
    const { container } = renderWithCrystal(
      <form><PinInput label="P" name="f" length={4} defaultValue="1234" /></form>,
    );
    expect(read(container.querySelector('form')!)).toEqual([['f', '1234']]);
  });

  /* Several values become several inputs of the same name — how HTML has always
     carried a multiple selection, and what valuesFromForm turns back into an
     array. */
  it('TagsInput submits one entry per tag', () => {
    const { container } = renderWithCrystal(
      <form><TagsInput label="P" name="f" defaultValue={['x', 'y']} /></form>,
    );
    expect(read(container.querySelector('form')!)).toEqual([['f', 'x'], ['f', 'y']]);
  });

  it('MultiSelect submits one entry per selection', () => {
    const { container } = renderWithCrystal(
      <form><MultiSelect label="P" name="f" options={OPTIONS} defaultValue={['a', 'b']} /></form>,
    );
    expect(read(container.querySelector('form')!)).toEqual([['f', 'a'], ['f', 'b']]);
  });

  /* Nothing chosen is no key at all, not an empty one — again HTML's behaviour,
     and what the schema is told to expect. */
  it('submits no key when nothing is chosen', () => {
    const { container } = renderWithCrystal(
      <form><MultiSelect label="P" name="f" options={OPTIONS} /></form>,
    );
    expect(read(container.querySelector('form')!)).toEqual([]);
  });

  it('submits nothing when the field has no name', () => {
    const { container } = renderWithCrystal(
      <form><TagsInput label="P" defaultValue={['x']} /></form>,
    );
    expect(read(container.querySelector('form')!)).toEqual([]);
  });
});
