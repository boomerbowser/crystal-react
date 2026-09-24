import type { Meta, StoryObj } from '@storybook/react-vite';
import { ErrorScreen } from './ErrorScreen.js';
import { Button } from '../Button/Button.js';

const meta = {
  title: 'Screens/ErrorScreen',
  component: ErrorScreen,
  parameters: {
    docs: {
      description: {
        component:
          '"`role="alert"`; states what failed and what to try, **never only a code**." That '
          + 'last clause is enforced rather than described: `title` is required and `code` is '
          + 'an extra, so the arrangement showing `0x80070005` and nothing else does not '
          + 'typecheck.\n\n'
          + 'The alert is on the screen rather than on the card. `Result` sets no role — it is '
          + 'used for successes too, and a success announced as an alert is a component '
          + 'shouting about good news. A view that has replaced what the reader asked for is '
          + 'the case that earns it.',
      },
    },
  },
  args: { title: 'The report could not be built' },
} satisfies Meta<typeof ErrorScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'The source returned no rows. Nothing has been saved.',
    actions: <Button>Try again</Button>,
  },
};

export const WithAReference: Story = {
  args: {
    children: 'The source returned no rows. Nothing has been saved.',
    code: 'E_NO_ROWS',
    actions: <Button>Try again</Button>,
  },
};
