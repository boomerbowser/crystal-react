import type { Meta, StoryObj } from '@storybook/react-vite';
import { MediaControls } from './MediaControls.js';

const meta = {
  title: 'Media/Media controls',
  component: MediaControls,
  parameters: {
    docs: {
      description: {
        component:
          '**Play and pause are one toggle with a pressed state**, not two buttons swapped by '
          + 'state: two buttons means the one a reader has focused disappears under them the '
          + 'moment they press it, and focus falls to the document. The name stays "Play" and '
          + 'the pressed state is what changes — "Play, pressed" is how a screen reader '
          + 'announces "playing".\n\n'
          + '**The scrubber is a slider announcing time, not a progress bar.** A progress bar '
          + 'reports; a slider is operated, which is the whole point of a scrubber. And it says '
          + 'a *time*: `1:23` is right on the screen and wrong in an announcement, where a '
          + 'screen reader reads it as "one colon twenty-three". The thumb says "1 minute 23 '
          + 'seconds of 4 minutes 56 seconds"; `src/media/time.ts` owns both notations so the '
          + 'two players cannot format a second differently.\n\n'
          + 'Buffering is announced rather than only drawn — a spinner on the bar is '
          + 'information a sighted reader gets for free and nobody else gets at all.',
      },
    },
  },
  args: {
    isPlaying: false,
    currentTime: 83,
    duration: 296,
    mediaLabel: 'Episode 4',
    onPlayPause: () => {},
    onSeek: () => {},
  },
} satisfies Meta<typeof MediaControls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Paused: Story = {};

export const Playing: Story = { args: { isPlaying: true } };

export const Buffering: Story = { args: { isPlaying: true, isBuffering: true } };

/* Before the metadata arrives there is no length. The scrubber is disabled and
   says so rather than pretending to a range nobody knows. */
export const BeforeTheLengthIsKnown: Story = { args: { currentTime: 0, duration: 0 } };

export const WithVolumeAndSkip: Story = {
  args: { isMuted: false, volume: 0.6, skipBy: 10 },
};

export const Muted: Story = { args: { isMuted: true, volume: 0 } };
