import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextInput } from './TextInput.js';

const meta = {
  title: 'Inputs/TextInput',
  component: TextInput,
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
