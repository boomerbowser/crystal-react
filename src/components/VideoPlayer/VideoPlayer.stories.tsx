import type { Meta, StoryObj } from '@storybook/react-vite';
import { VideoPlayer } from './VideoPlayer.js';

const meta = {
  title: 'Media/Video player',
  component: VideoPlayer,
  parameters: {
    docs: {
      description: {
        component:
          '**Captions are supported and their state is announced.** A `<track>` is not enough '
          + 'on its own — the element knows about the track and a reader has no way to turn it '
          + 'on and no way to know whether it is on. So the caption control is a toggle over '
          + "`textTracks`, its pressed state is the track's real `mode`, and the change is said "
          + 'in words.\n\n'
          + '**Keyboard shortcuts do not trap focus.** Space, the arrow keys and `M` work while '
          + 'focus is inside the player and do nothing when it is not — no document-level '
          + "listener, which is the shape that steals the space bar from the page's own "
          + 'scrolling. And a shortcut never takes a key from the control the reader is on: '
          + 'Space on the play toggle is the button\'s Space.\n\n'
          + 'The control bar appears on hover or focus and is not on a timer. Crystal\'s rule '
          + 'is that nothing moves at rest, so a bar that faded away while nobody was doing '
          + 'anything would be movement nobody started.',
      },
    },
  },
  args: { label: 'A walk through the harbour' },
} satisfies Meta<typeof VideoPlayer>;

export default meta;
type Story = StoryObj<typeof meta>;

/* A generated clip rather than a fetched one: the gates run with no network, and
   a player with no video in it is a player that proves nothing. */
const SAMPLE = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAAhtZGF0';

export const Default: Story = {
  render: (args) => (
    <VideoPlayer {...args} poster="" width={640}>
      <source src={SAMPLE} type="video/mp4" />
    </VideoPlayer>
  ),
};

export const WithCaptions: Story = {
  render: (args) => (
    <VideoPlayer {...args} width={640}>
      <source src={SAMPLE} type="video/mp4" />
      <track
        kind="captions"
        srcLang="en"
        label="English"
        src={'data:text/vtt,WEBVTT%0A%0A00:00.000 --> 00:02.000%0AThe harbour at dusk.'}
      />
    </VideoPlayer>
  ),
};
