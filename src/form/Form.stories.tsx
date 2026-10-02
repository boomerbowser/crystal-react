import type { Meta, StoryObj } from '@storybook/react-vite';
import * as v from 'valibot';
import { useState } from 'react';
import { Form } from './Form.js';
import { useCrystalForm } from './useCrystalForm.js';
import type { CrystalFormProps } from './useCrystalForm.js';
import type { StandardSchemaV1 } from './standard-schema.js';
import { TextInput } from '../components/TextInput/TextInput.js';
import { NumberInput } from '../components/NumberInput/NumberInput.js';
import { Select } from '../components/Select/Select.js';
import { Button } from '../components/Button/Button.js';
import { Group } from '../components/Stack/Stack.js';

const meta = {
  title: 'Forms/useCrystalForm',
  /* Without this, docgen has nothing to read and Storybook generates no
     controls at all. This file shows several components together. The one named
     here is its subject, and the others are the context it is normally seen in. */
  component: Form,
  args: {
    /* Placeholders. Every story in this file builds its own form with
       `useCrystalForm`, because the subject is a form's state: a schema, its
       errors and what it does on submit. These exist only so the required props
       are satisfied and docgen has a component to read, which generates the
       props table. */
    form: undefined as unknown as CrystalFormProps,
    children: null,
  },
  parameters: {
    docs: {
      description: {
        component:
          'One hook for the whole of a form: a Standard Schema over the submitted values, '
          + 'submission state as a data attribute, a mutation of any shape with `mutateAsync`, '
          + 'and a server\'s errors landing on the same field state a client rule produces. To '
          + 'the person filling in the form, a field that failed on the server and a field that '
          + 'failed locally are the same thing.\n\n'
          + 'React Hook Form is deliberately not wrapped. React Aria already owns validation '
          + 'display, `aria-describedby` wiring and submission semantics.\n\n'
          + 'Native validation stays on. The browser blocks a structurally invalid submit '
          + 'before the schema runs, so a field\'s `isRequired` does not have to be restated in '
          + 'the schema. Restating it would be the redeclaration CONTRACT §1 forbids, with '
          + 'rules instead of values.',
      },
    },
  },
} satisfies Meta<typeof Form>;

export default meta;
type Story = StoryObj<typeof meta>;

const Signup = v.object({
  email: v.pipe(v.string(), v.email('That is not an email address')),
  age: v.pipe(v.string(), v.transform(Number), v.minValue(18, 'You must be 18 or over')),
  plan: v.picklist(['free', 'pro'], 'Choose a plan'),
});

const PLANS = [
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
];

/** The whole system: schema, mutation, submission state, server errors. */
export const Signing: Story = {
  render: function Signing() {
    const [saved, setSaved] = useState<unknown>(null);

    const form = useCrystalForm({
      schema: Signup as unknown as StandardSchemaV1,
      /* The shape TanStack Query's mutation already has, and a `fetch` wrapper
         reaches in four lines. Neither is a dependency. */
      mutation: {
        mutateAsync: async (value) => {
          await new Promise((resolve) => { setTimeout(resolve, 900); });
          if ((value as { email: string }).email.endsWith('@taken.com')) {
            throw new Error('That address is already registered');
          }
          setSaved(value);
        },
      },
      /* A server's rejection, turned into the same field state a client rule
         produces. Try an address ending @taken.com. */
      onError: (error) => (
        error instanceof Error && error.message.includes('already registered')
          ? { email: [error.message] }
          : undefined
      ),
    });

    return (
      <Form form={form.formProps} formErrors={form.formErrors} style={{ maxWidth: '420px' /* crystal-allow-literal: story column */ }}>
        <TextInput label="Email" name="email" isRequired description="Try one ending @taken.com" />
        <NumberInput label="Age" name="age" isRequired />
        <Select label="Plan" name="plan" options={PLANS} isRequired />
        <Group gap="sm">
          <Button type="submit" isDisabled={form.isSubmitting}>
            {form.isSubmitting ? 'Saving…' : 'Create account'}
          </Button>
          <Button type="reset" variant="quiet">Clear</Button>
        </Group>
        {form.status === 'succeeded' && saved ? (
          <p role="status">Saved {JSON.stringify(saved)}</p>
        ) : null}
      </Form>
    );
  },
};
