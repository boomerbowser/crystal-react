import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { Avatar } from '../Avatar/Avatar.js';
import { OverlayBadge } from './OverlayBadge.js';

const meta = {
  title: 'Data display/Overlay badge',
  component: OverlayBadge,
  parameters: {
    docs: {
      description: {
        component:
          'A mark over the corner of something else — a verification tick on an avatar, a lock '
          + 'on a document tile. Where `Badge` is a count attached to a host, this labels its '
          + 'host, which is why the accessible name lands beside the host rather than on the '
          + 'badge\'s own shape; without a `label` the mark is hidden, because a decorative mark '
          + 'over a named thing is otherwise read as a second unnamed thing. The fill is Haze on '
          + 'a pseudo-element so the glyph above it stays crisp: feathering an element that '
          + 'contains a glyph blurs the glyph, and a blurred tick over a photograph is '
          + 'indistinguishable from a rendering fault.',
      },
    },
  },
  args: {
    badge: '✓',
    label: 'Verified',
    placement: 'top-end',
    children: <Avatar name="Ada Lovelace" size="xl" />,
  },
} satisfies Meta<typeof OverlayBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** All four corners. The badge overhangs by a third of its own size, and the
 *  wrapper does not clip — "never clipped by its host". */
export const Placements: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--cr-spacing-2xl)', alignItems: 'center' }}>
      <OverlayBadge {...only(args)} placement="top-start" />
      <OverlayBadge {...only(args)} placement="top-end" />
      <OverlayBadge {...only(args)} placement="bottom-start" />
      <OverlayBadge {...only(args)} placement="bottom-end" />
    </div>
  ),
};

/** No label, so the mark is decoration beside a host that already carries the
 *  meaning. */
export const Decorative: Story = {
  render: ({ label: _named, ...args }) => <OverlayBadge {...only(args)} />,
};
