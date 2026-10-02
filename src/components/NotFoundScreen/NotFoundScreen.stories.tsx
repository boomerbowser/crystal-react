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
          + 'because products tend to skip the second half. A 404 that says "not found" '
          + 'and stops leaves the reader with nowhere to go. The browser\'s back button is '
          + 'not a route the product offered.\n\n'
          + 'It is not an alert, because nothing failed. A missing thing is a fact about the address.',
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
