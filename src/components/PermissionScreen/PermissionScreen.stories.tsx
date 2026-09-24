import type { Meta, StoryObj } from '@storybook/react-vite';
import { PermissionScreen } from './PermissionScreen.js';

const meta = {
  title: 'Screens/PermissionScreen',
  component: PermissionScreen,
  parameters: {
    docs: {
      description: {
        component:
          '"Says which permission and why; the request is a real button." Both halves are '
          + 'required props. "You do not have access" names neither, so the reader cannot '
          + 'tell whether to ask an administrator, switch account, or stop trying — and the '
          + 'person who could grant it does not know what to grant.\n\n'
          + 'There is no `at-rest` state: a permission screen is always either denied or '
          + 'requesting, and `requesting` is a busy state of the button rather than a second '
          + 'screen.',
      },
    },
  },
  args: {
    permission: 'Billing access is required',
    children: 'Only account owners can see invoices and payment methods.',
  },
} satisfies Meta<typeof PermissionScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Denied: Story = { args: { onRequest: () => {} } };

export const Requesting: Story = { args: { onRequest: () => {}, isRequesting: true } };

export const NothingTheReaderCanDo: Story = {
  args: { children: 'Only account owners can see invoices. Ask an owner to grant it.' },
};
