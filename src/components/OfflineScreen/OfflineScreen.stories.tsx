import type { Meta, StoryObj } from '@storybook/react-vite';
import { OfflineScreen } from './OfflineScreen.js';

const meta = {
  title: 'Screens/OfflineScreen',
  component: OfflineScreen,
  parameters: {
    docs: {
      description: {
        component:
          '"Announced politely; retry is a real button." Being polite is what separates it from '
          + '`ErrorScreen`: losing connectivity is not an error the reader caused and often '
          + 'does not last, so it is not urgent enough to interrupt whatever a screen reader '
          + 'is saying. The two have the same shape and differ in one attribute.\n\n'
          + '"With what still works" is the half products tend to skip. An offline screen that only '
          + 'says "you are offline" replaces a working view with a dead one.',
      },
    },
  },
  args: { children: 'Your drafts are saved on this device and will sync when you reconnect.' },
} satisfies Meta<typeof OfflineScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { onRetry: () => {} } };

export const Reconnecting: Story = { args: { onRetry: () => {}, isReconnecting: true } };
