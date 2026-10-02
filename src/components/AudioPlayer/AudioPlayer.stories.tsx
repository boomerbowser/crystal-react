import type { Meta, StoryObj } from '@storybook/react-vite';
import { AudioPlayer } from './AudioPlayer.js';
import { episodeAudio } from '../../../.storybook/fixtures/index.js';

const meta = {
  title: 'Media/Audio player',
  component: AudioPlayer,
  parameters: {
    docs: {
      description: {
        component:
          'A real `<audio>` element. It is what plays, '
          + "what the operating system's media keys reach, and what a headset's pause button "
          + 'pauses. Everything drawn here reads its state from that element instead of '
          + 'keeping a copy. A player that tracks its own `isPlaying` goes wrong as soon as '
          + 'anything else touches the media.\n\n'
          + 'It is handed to the caller through `mediaRef`, because sources, playlists and '
          + "streaming are the product's half and all of them are done on the element.\n\n"
          + 'The browser\'s own `controls` are off. Two sets of controls for one element means two '
          + 'tab stops per action and two places a state can be shown differently.\n\n'
          + 'It is a Haze card with the card padding, holding the title and the Resin transport, '
          + 'and offers playback speed in its settings menu.',
      },
    },
  },
  args: { label: 'Episode 4 — The long way round' },
} satisfies Meta<typeof AudioPlayer>;

export default meta;
type Story = StoryObj<typeof meta>;

/* A real file, generated locally (`.storybook/fixtures`), so the transport has a
   duration to show and the scrubber something to move. */
const withAudio = (args: Parameters<typeof AudioPlayer>[0]) => (
  <AudioPlayer {...args}><source src={episodeAudio} type="audio/mp4" /></AudioPlayer>
);

export const Default: Story = { render: withAudio };

export const WithATitle: Story = {
  args: { title: 'Episode 4 — The long way round', subtitle: 'Harbour stories · 8 seconds' },
  render: withAudio,
};

export const WithSkipControls: Story = { args: { skipBy: 15 }, render: withAudio };

/* The card is off when the player sits on a reading surface that is already
   Haze, so it is not Haze on Haze. */
export const WithoutTheCard: Story = {
  args: { title: 'Episode 4 — The long way round', surface: false },
  render: withAudio,
};
