import type { Meta, StoryObj } from '@storybook/react-vite';
import { AudioPlayer } from './AudioPlayer.js';

const meta = {
  title: 'Media/Audio player',
  component: AudioPlayer,
  parameters: {
    docs: {
      description: {
        component:
          '**A real `<audio>` element**, and not as an implementation detail: it is what plays, '
          + "what the operating system's media keys reach, what a headset's pause button "
          + 'pauses. Everything drawn here reads its state from that element rather than '
          + 'keeping a copy — a player that tracked its own `isPlaying` is wrong the first time '
          + 'anything else touches the media, and plenty does.\n\n'
          + 'It is handed to the caller through `mediaRef`, because sources, playlists and '
          + "streaming are the product's half and all of them are done on the element.\n\n"
          + 'The browser\'s own `controls` are off: two sets of controls for one element is two '
          + 'tab stops per action and two places a state can be shown differently.',
      },
    },
  },
  args: { label: 'Episode 4 — The long way round' },
} satisfies Meta<typeof AudioPlayer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithATitle: Story = {
  args: { title: 'Episode 4 — The long way round' },
};

export const WithSkipControls: Story = { args: { skipBy: 15 } };
