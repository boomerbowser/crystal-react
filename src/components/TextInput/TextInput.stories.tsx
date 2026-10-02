import type { Meta, StoryObj } from '@storybook/react-vite';
import { ariaArgTypes } from '../../../.storybook/react-aria.js';
import type { TextInputProps } from './TextInput.js';
import { TextInput } from './TextInput.js';

const meta = {
  title: 'Inputs/TextInput',
  component: TextInput,
  /* The callbacks as actions, so the Actions panel shows what fired and with
     what. They are declared by hand because this Storybook uses `react-docgen`
     instead of `react-docgen-typescript` (see `.storybook/main.ts`), and
     react-docgen reads a component's own interface without resolving what it
     extends. Every callback here is inherited from a React Aria interface, so
     docgen sees none of them. Each was checked against the compiler. */
  argTypes: {
    ...ariaArgTypes<TextInputProps>({
      autoFocus: false,
      description: true,
      errorMessage: true,
      isDisabled: true,
      isInvalid: true,
      isReadOnly: true,
      isRequired: true,
      label: true,
      onChange: true,
      onFocusChange: false,
      placeholder: true,
    }),
  },
  parameters: {
    docs: {
      description: {
        component:
          'A Haze well inside a Resin shell. Validation motion binds to state instead of a '
          + 'blur handler, so a field that failed on the server animates exactly like one that '
          + 'failed locally. A field that mounts already invalid does not animate at all, '
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

/** Supplying a message is the invalid state. Two separate ways to say it could
 *  disagree. */
export const Invalid: Story = {
  args: { errorMessage: 'Enter a product name.' },
};

export const Disabled: Story = {
  args: { isDisabled: true, value: 'Studio' },
};

export const Required: Story = {
  args: { isRequired: true, description: 'Required.' },
};
