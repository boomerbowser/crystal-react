import type { Meta, StoryObj } from '@storybook/react-vite';
import { NotFoundScreen } from './NotFoundScreen.js';
import { Button } from '../Button/Button.js';

const meta = {
  title: 'Screens/NotFoundScreen',
  component: NotFoundScreen,
  parameters: {
    docs: {
      description: {
        component:
          '"States what was not found and offers a route onward." `actions` is required, '
          + 'because the second half is the one products skip: a 404 that says "not found" '
          + 'and stops has told the reader what they already knew and left them nowhere. The '
          + 'browser\'s back button is not a route the product offered — it is the one the '
          + 'reader had anyway.\n\n'
          + 'Not an alert. Nothing failed; a missing thing is a fact about the address.',
      },
    },
  },
  args: {
    title: 'That report does not exist',
    actions: <Button>All reports</Button>,
  },
} satisfies Meta<typeof NotFoundScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: 'It may have been deleted, or the link may be wrong.' },
};
