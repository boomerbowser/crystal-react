import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import * as v from 'valibot';
import { renderWithCrystal, screen, waitFor } from '../test/render.js';
import { TextInput } from '../components/TextInput/TextInput.js';
import { Button } from '../components/Button/Button.js';
import { Form } from './Form.js';
import { useCrystalForm, type UseCrystalFormOptions } from './useCrystalForm.js';
import { valuesFromForm } from './standard-schema.js';
import type { StandardSchemaV1 } from './standard-schema.js';

/* Tested against Valibot rather than a hand-rolled `~standard` object. A fake
   proves the hook can read a shape it was written against; a real validator
   proves the integration, which is the only thing Standard Schema is for.
   Valibot is a devDependency here and not a dependency of the library. */

const Signup = v.object({
  email: v.pipe(v.string(), v.email('That is not an email address')),
  age: v.pipe(v.string(), v.transform(Number), v.minValue(18, 'Must be 18 or over')),
});

function Subject({ options, formErrors = true }: {
  options: UseCrystalFormOptions<StandardSchemaV1>;
  formErrors?: boolean;
}): React.JSX.Element {
  const form = useCrystalForm(options);
  return (
    <Form form={form.formProps} formErrors={formErrors ? form.formErrors : []}>
      <TextInput label="Email" name="email" />
      <TextInput label="Age" name="age" />
      <Button type="submit">Save</Button>
      <p data-testid="status">{form.status}</p>
      <p data-testid="count">{form.submitCount}</p>
    </Form>
  );
}

const fill = async (email: string, age: string) => {
  await userEvent.type(screen.getByRole('textbox', { name: 'Email' }), email);
  await userEvent.type(screen.getByRole('textbox', { name: 'Age' }), age);
};

describe('useCrystalForm', () => {
  it('puts a schema issue on the field it names', async () => {
    renderWithCrystal(<Subject options={{ schema: Signup as never }} />);
    await fill('nope', '30');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.getByText('That is not an email address')).toBeInTheDocument();
    });
    expect(screen.getByTestId('status').textContent).toBe('failed');
    /* And the field itself is marked, not just the text placed near it. */
    expect(screen.getByRole('textbox', { name: 'Email' }).getAttribute('aria-invalid')).toBe('true');
  });

  /* A rule that belongs to the form and to no field. Putting it under one of the
     fields would say something false about that field. */
  it('keeps a pathless issue as a form error', async () => {
    const EitherOr = v.pipe(
      v.object({ email: v.string(), age: v.string() }),
      v.check((value) => value.email !== '' || value.age !== '', 'Give an email or an age'),
    );
    renderWithCrystal(<Subject options={{ schema: EitherOr as never }} />);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('Give an email or an age');
    });
  });

  it('runs the mutation and then the submit handler with the parsed value', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    const onSubmit = vi.fn();
    renderWithCrystal(
      <Subject options={{ schema: Signup as never, mutation: { mutateAsync }, onSubmit }} />,
    );
    await fill('a@b.com', '30');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('succeeded'));
    /* The schema's output, not the form's strings: age arrives as a number. */
    expect(mutateAsync).toHaveBeenCalledWith({ email: 'a@b.com', age: 30 });
    expect(onSubmit).toHaveBeenCalledWith({ email: 'a@b.com', age: 30 });
  });

  /* Pressing Enter in a text field submits whatever the button is doing, so a
     disabled button is not a guard. The guard is a ref, because a second submit
     can arrive in the same tick as the first and state would still read idle. */
  it('submits once when submitted twice at once', async () => {
    let release: (() => void) | undefined;
    const mutateAsync = vi.fn(() => new Promise<void>((resolve) => { release = resolve; }));
    const { container } = renderWithCrystal(
      <Subject options={{ schema: Signup as never, mutation: { mutateAsync } }} />,
    );
    await fill('a@b.com', '30');
    const form = container.querySelector('form')!;

    form.requestSubmit();
    form.requestSubmit();
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));

    release?.();
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('1'));
  });

  /* A server's rejection has to land on the same field state a client rule
     produces, or a field looks different depending on how it failed. */
  it('lands a server error on the field it names', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('Conflict'));
    renderWithCrystal(
      <Subject options={{
        schema: Signup as never,
        mutation: { mutateAsync },
        onError: () => ({ email: ['Already registered'] }),
      }} />,
    );
    await fill('a@b.com', '30');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(screen.getByText('Already registered')).toBeInTheDocument());
    expect(screen.getByRole('textbox', { name: 'Email' }).getAttribute('aria-invalid')).toBe('true');
  });

  /* React Aria holds `validationErrors` until the prop changes, and a field
     editing itself does not clear one. Without this, a rejected email stays
     marked wrong while the person retypes it. */
  it('clears a server error as soon as that field is edited', async () => {
    renderWithCrystal(
      <Subject options={{
        schema: Signup as never,
        mutation: { mutateAsync: vi.fn().mockRejectedValue(new Error('Conflict')) },
        onError: () => ({ email: ['Already registered'] }),
      }} />,
    );
    await fill('a@b.com', '30');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByText('Already registered')).toBeInTheDocument());

    await userEvent.type(screen.getByRole('textbox', { name: 'Email' }), 'x');
    await waitFor(() => expect(screen.queryByText('Already registered')).toBeNull());
  });

  /* A failure nobody claimed is still a failure. A submit that does nothing and
     says nothing is a button that appears broken. */
  it('says something when a failure names no field', async () => {
    renderWithCrystal(
      <Subject options={{
        schema: Signup as never,
        mutation: { mutateAsync: vi.fn().mockRejectedValue(new Error('The server is unreachable')) },
      }} />,
    );
    await fill('a@b.com', '30');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('The server is unreachable');
    });
  });

  it('publishes the submission state as an attribute the stylesheet can read', async () => {
    let release: (() => void) | undefined;
    const { container } = renderWithCrystal(
      <Subject options={{
        schema: Signup as never,
        mutation: { mutateAsync: () => new Promise<void>((resolve) => { release = resolve; }) },
      }} />,
    );
    const form = container.querySelector('form')!;
    expect(form.getAttribute('data-cr-submission')).toBe('idle');

    await fill('a@b.com', '30');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(form.getAttribute('data-cr-submission')).toBe('submitting'));

    release?.();
    await waitFor(() => expect(form.getAttribute('data-cr-submission')).toBe('succeeded'));
  });
});

/* The rule, pinned rather than assumed: FormData gives strings and Files, a
   repeated name becomes an array, and an unchecked checkbox is absent rather
   than false. Coercion is the schema's job, and a hook that guessed at it would
   be guessing at a type the schema already states. */
describe('valuesFromForm', () => {
  it('reports what the browser reports, and nothing more', () => {
    const form = document.createElement('form');
    form.innerHTML = `
      <input name="name" value="Ada" />
      <input name="tags" value="one" />
      <input name="tags" value="two" />
      <input type="checkbox" name="agreed" checked />
      <input type="checkbox" name="subscribed" />
      <input name="count" value="3" />
    `;
    document.body.append(form);

    const values = valuesFromForm(form);
    expect(values['name']).toBe('Ada');
    expect(values['tags']).toEqual(['one', 'two']);
    expect(values['agreed']).toBe('on');
    expect('subscribed' in values).toBe(false);
    expect(values['count']).toBe('3');

    form.remove();
  });
});
