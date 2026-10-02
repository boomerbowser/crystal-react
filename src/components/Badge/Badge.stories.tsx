import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { Button } from '../Button/Button.js';
import { Badge } from './Badge.js';

const meta = {
  title: 'Data display/Badge',
  component: Badge,
  parameters: {
    docs: {
      description: {
        component:
          'A count or label attached to a host. The visual is always `aria-hidden`, because a loose '
          + '"3" announced beside a button leaves a listener to guess what the 3 belongs to. The '
          + 'meaning travels through `description`, which is a whole sentence in a polite live '
          + 'region, or through a host that already carries it. `description` is not defaulted to '
          + 'the count, because a bare number in a live region is what the rule prevents.',
      },
    },
  },
  args: { count: 3, max: 99, description: '3 unread messages' },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Attached to a host, straddling its corner. The ring is the page's own surface,
 *  which keeps the badge readable where it overlaps the button's edge. */
export const OnAHost: Story = {
  args: { count: 12, children: <Button>Inbox</Button> },
};

/** Past the ceiling the badge stops counting and starts summarising. */
export const Overflowing: Story = {
  args: { count: 240, max: 99, description: '240 unread messages' },
};

/** The dot only signals presence and has nothing to read, so the host has to say
 *  what changed. */
export const ADot: Story = {
  args: { dot: true, description: 'Unsaved changes', children: <Button>Draft</Button> },
};

/** A zero count is hidden by default and shown on request, because "0 open
 *  issues" is sometimes what the reader needs to see. */
export const Zero: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--cr-space)', alignItems: 'center' }}>
      <Badge {...only(args)} count={0} />
      <Badge {...only(args)} count={0} showZero />
    </div>
  ),
};
