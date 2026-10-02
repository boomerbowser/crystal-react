import type { Meta, StoryObj } from '@storybook/react-vite';
import { Banner } from './Banner.js';
import { Button } from '../Button/Button.js';

const meta = {
  title: 'Feedback/Banner',
  component: Banner,
  parameters: {
    docs: {
      description: {
        component:
          'Full-bleed within its region: the region\'s width and the region\'s corners. A '
          + 'banner with a content radius floating inside its container looks like a card, and a '
          + 'card is not pinned.\n\n'
          + '`role="status"` for information, `role="alert"` for urgency, which is opted into '
          + 'and not implied by the colour.\n\n'
          + '"Dismissal returns focus sensibly." The control being pressed is the control '
          + 'being removed, so without a `returnFocusTo` focus falls to the document body and a '
          + 'keyboard reader starts again from the top of the page. The component cannot guess '
          + 'the destination, so that prop lets the caller name it.',
      },
    },
  },
  args: { children: 'Scheduled maintenance tonight at 21:00 UTC.' },
} satisfies Meta<typeof Banner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {};

export const Attention: Story = { args: { status: 'attention' } };

export const Urgent: Story = {
  args: { status: 'danger', urgent: true, children: 'Maintenance has started. Saving is disabled.' },
};

export const WithAnAction: Story = { args: { action: <Button>Read more</Button> } };

export const Dismissible: Story = { args: { onDismiss: () => {} } };
