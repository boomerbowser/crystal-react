import type { Meta, StoryObj } from '@storybook/react-vite';
import { OfflineScreen } from './OfflineScreen.js';

const meta = {
  title: 'Screens/OfflineScreen',
  component: OfflineScreen,
  parameters: {
    docs: {
      description: {
        component:
          '"Announced politely; retry is a real button." Politely is the difference from '
          + '`ErrorScreen`: losing connectivity is not an error the reader caused and often '
          + 'does not last, so interrupting whatever a screen reader was saying is the '
          + 'component being more urgent than the news. The same shape, one word apart.\n\n'
          + '"With what still works" is the half products skip — an offline screen that only '
          + 'says "you are offline" has replaced a working view with a dead one.',
      },
    },
  },
  args: { children: 'Your drafts are saved on this device and will sync when you reconnect.' },
} satisfies Meta<typeof OfflineScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { onRetry: () => {} } };

export const Reconnecting: Story = { args: { onRetry: () => {}, isReconnecting: true } };
