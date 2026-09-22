import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { Avatar } from './Avatar.js';

const meta = {
  title: 'Data display/Avatar',
  component: Avatar,
  parameters: {
    docs: {
      description: {
        component:
          'A circular image, initials or icon. The interesting part is the fallback chain: identity '
          + 'images fail routinely, and a broken image icon where a person\'s face should be is '
          + 'worse than never having tried — so the image is watched and replaced in place. `name` '
          + 'does two jobs on purpose: it is what the initials come from, and it is the accessible '
          + 'name. An avatar showing somebody\'s initials is identifying them, so it must say who; '
          + 'one with no name is decoration beside a label that already does.',
      },
    },
  },
  args: { name: 'Ada Lovelace', size: 'md' },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The four steps, on Crystal's 4px rhythm. */
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--cr-space)', alignItems: 'center' }}>
      <Avatar {...only(args)} size="sm" />
      <Avatar {...only(args)} size="md" />
      <Avatar {...only(args)} size="lg" />
      <Avatar {...only(args)} size="xl" />
    </div>
  ),
};

/** First and last, not every part: "María del Carmen Rodríguez" is MR. It is a
 *  heuristic over a name, which no heuristic gets right everywhere, so `initials`
 *  overrides it outright rather than being coaxed. */
export const Initials: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--cr-space)', alignItems: 'center' }}>
      <Avatar {...only(args)} name="Ada Lovelace" />
      <Avatar {...only(args)} name="María del Carmen Rodríguez" />
      <Avatar {...only(args)} name="Prince" />
      <Avatar {...only(args)} name="Katherine Johnson" initials="KJ" />
    </div>
  ),
};

/** A source that will not resolve, so the fallback is what you see. This is the
 *  state that matters: it is the one users actually hit. */
export const WhenTheImageFails: Story = {
  args: { src: '/this-image-does-not-exist.png' },
};

/** No name, so it is hidden from assistive technology — decoration beside a
 *  label that already names the person. */
export const Decorative: Story = {
  render: ({ name: _named, ...args }) => (
    <span style={{ display: 'inline-flex', gap: 'var(--cr-spacing-xs)', alignItems: 'center' }}>
      <Avatar {...only(args)} initials="AL" />
      <span>Ada Lovelace</span>
    </span>
  ),
};
