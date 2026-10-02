import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { Avatar } from '../Avatar/Avatar.js';
import { AvatarGroup } from './AvatarGroup.js';

const PEOPLE = [
  'Ada Lovelace', 'Grace Hopper', 'Katherine Johnson',
  'Annie Easley', 'Dorothy Vaughan', 'Mary Jackson',
];

const members = PEOPLE.map((name) => <Avatar key={name} name={name} />);

const meta = {
  title: 'Data display/Avatar group',
  component: AvatarGroup,
  parameters: {
    docs: {
      description: {
        component:
          'Overlapping avatars with an overflow count. The group is one named list, so a screen '
          + 'reader reaches it as "Project members, list, 6 items" and can then walk the people in '
          + 'it. The catalogue asks the group to have a name, and the people in it keep theirs. '
          + 'The overflow chip shows "+3" and announces "3 more", because read literally, "+3" is a '
          + 'plus sign and a number. The stacking order counts down, so the first avatar is in '
          + 'front and each ring cuts the neighbour it covers.',
      },
    },
  },
  args: { label: 'Project members', size: 'md', children: members },
} satisfies Meta<typeof AvatarGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Past `max`, the rest becomes a chip that matches the avatars beside it. */
export const Overflowing: Story = {
  args: { max: 3 },
};

/** One row, one size. An overlap reads as a row only when the circles are the
 *  same size, so the group's size wins over any a child was given. */
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--cr-space)', flexDirection: 'column' }}>
      <AvatarGroup {...only(args)} size="sm" max={4} />
      <AvatarGroup {...only(args)} size="md" max={4} />
      <AvatarGroup {...only(args)} size="lg" max={4} />
    </div>
  ),
};
