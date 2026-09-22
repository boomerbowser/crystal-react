import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { AuthoredBubble } from './AuthoredBubble.js';

const meta = {
  title: 'Data display/Authored bubble',
  component: AuthoredBubble,
  parameters: {
    docs: {
      description: {
        component:
          'A reading surface with one intentionally tightened corner, on the side the message '
          + 'came from. The silhouette is part of Crystal\'s identity and carries through from '
          + 'the approved baseline — and it is also exactly why the catalogue says "author and '
          + 'time are text, not implied by side alone": a silhouette is a shortcut for people '
          + 'who can see it, so `author` is required rather than optional.\n\n'
          + 'The cut is written with logical radius properties — `border-start-start-radius` is '
          + 'the top-left corner in a left-to-right locale and the top-right in a right-to-left '
          + 'one — so the mirroring the catalogue asks for is expressed once instead of twice. '
          + 'Own messages take `--cr-haze-own-fill`, the one Haze fill in Crystal that carries a '
          + 'palette colour and stays soft: a thread is a wall of these, and the solid action '
          + 'colour behind every second message would make it unreadable.',
      },
    },
  },
  args: { author: 'Ada Lovelace', time: '09:42', children: 'The Analytical Engine has no pretensions whatever to originate anything.' },
} satisfies Meta<typeof AuthoredBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The reader's own message: the other corner, and the content-own pair. */
export const Own: Story = {
  args: { author: 'You', time: '09:43', own: true, children: 'It can do whatever we know how to order it to perform.' },
};

/** A thread. In a run from one author the cut marks where the run *starts* —
 *  repeating it on every bubble turns a signal into a texture. */
export const AThread: Story = {
  render: (args) => (
    <div role="log" aria-label="Conversation" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cr-spacing-xs)', maxInlineSize: '46ch' }}>
      <AuthoredBubble {...only(args)} author="Ada Lovelace" time="09:42">
        The Analytical Engine has no pretensions whatever to originate anything.
      </AuthoredBubble>
      <AuthoredBubble {...only(args)} author="Ada Lovelace" time="09:42" grouped>
        It can do whatever we know how to order it to perform.
      </AuthoredBubble>
      <AuthoredBubble {...only(args)} author="You" time="09:44" own>
        Then the ordering is the whole of the work.
      </AuthoredBubble>
    </div>
  ),
};

/** Delivery states are said in words, never in opacity: a faded message over a
 *  coloured atmosphere is a legibility problem rather than a status. */
export const Delivery: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cr-spacing-xs)', maxInlineSize: '46ch' }}>
      <AuthoredBubble {...only(args)} author="You" time="09:45" own delivery="pending" deliveryLabel="Sending…">
        On its way.
      </AuthoredBubble>
      <AuthoredBubble {...only(args)} author="You" time="09:45" own delivery="failed" deliveryLabel="Not delivered. Try again.">
        This one did not arrive.
      </AuthoredBubble>
    </div>
  ),
};
