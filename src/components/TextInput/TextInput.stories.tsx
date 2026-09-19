import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextInput } from './TextInput.js';

const meta = {
  title: 'Inputs/TextInput',
  component: TextInput,
  /* The callbacks as actions, so the Actions panel shows what fired and with
     what. They are declared by hand because this Storybook uses `react-docgen`
     rather than `react-docgen-typescript` — see `.storybook/main.ts` — and
     react-docgen reads a component's own interface without resolving what it
     extends. Every callback here is inherited from a React Aria interface, so
     docgen cannot see one of them. Each was checked against the compiler
     before being written down. */
  argTypes: {
    onChange: { action: 'onChange', table: { category: 'Events' } },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A Haze well inside a Resin shell. Validation motion binds to state rather than to a '
          + 'blur handler, so a field that failed on the server animates exactly like one that '
          + 'failed locally — and a field that mounts already invalid does not animate at all, '
          + 'because motion marks the moment a state is entered.',
      },
    },
  },
  args: { label: 'Product name' },
} satisfies Meta<typeof TextInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithDescription: Story = {
  args: { description: 'As it appears on the invoice.' },
};

/** Supplying a message IS the invalid state: two ways to say the same thing
 *  would eventually disagree. */
export const Invalid: Story = {
  args: { errorMessage: 'Enter a product name.' },
};

export const Disabled: Story = {
  args: { isDisabled: true, value: 'Studio' },
};

export const Required: Story = {
  args: { isRequired: true, description: 'Required.' },
};
