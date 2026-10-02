import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { VideoPlayer } from './VideoPlayer.js';
import { harbourVideo, harbourCaptionsEnglish, harbourCaptionsFrench } from '../../../.storybook/fixtures/index.js';

const meta = {
  title: 'Media/Video player',
  component: VideoPlayer,
  parameters: {
    docs: {
      description: {
        component:
          'Captions are supported and their state is announced. A `<track>` is not enough '
          + 'on its own, because a reader has no way to turn it on and no way to know whether '
          + 'it is on. The caption control is a toggle over '
          + "`textTracks`, its pressed state is the track's real `mode`, and the change is said "
          + 'in words.\n\n'
          + 'Keyboard shortcuts do not trap focus. Space, the arrow keys and `M` work while '
          + 'focus is inside the player and do nothing when it is not. There is no '
          + "document-level listener, which would steal the space bar from the page's own "
          + 'scrolling. A shortcut never takes a key from the control the reader is on: '
          + 'Space on the play toggle is the button\'s Space.\n\n'
          + 'The control bar appears on hover, on focus and while paused, and is not on a timer. '
          + 'Crystal\'s rule is that nothing moves at rest, so a bar that faded away while nobody '
          + 'was doing anything would be movement nobody started.\n\n'
          + 'The settings menu holds speed, subtitles, the audio track and quality. Each is a '
          + 'group of radio items; the chosen one is shown by weight, never a check mark, and '
          + 'every change is said. A group the browser cannot act on is left out. Captions are '
          + 'drawn by Crystal on Stone, above the transport, so the bar never covers them.',
      },
    },
  },
  args: { label: 'A walk through the harbour' },
} satisfies Meta<typeof VideoPlayer>;

export default meta;
type Story = StoryObj<typeof meta>;

/* A real clip, generated locally (`.storybook/fixtures`), because the gates run
   with no network and a player with no picture in it proves nothing. Until
   2 October 2026 this was an MP4 header with no frames, so no story had ever
   shown the stage with a picture, a cue or a duration. */

export const Default: Story = {
  render: (args) => (
    <VideoPlayer {...args}>
      <source src={harbourVideo} type="video/mp4" />
    </VideoPlayer>
  ),
};

export const WithCaptions: Story = {
  render: (args) => (
    <VideoPlayer {...args}>
      <source src={harbourVideo} type="video/mp4" />
      <track kind="captions" srcLang="en" label="English" src={harbourCaptionsEnglish} />
      <track kind="subtitles" srcLang="fr" label="Français" src={harbourCaptionsFrench} />
    </VideoPlayer>
  ),
};

/* The settings menu with every group a browser can offer: speed, the two
   subtitle languages, and the product's renditions. The audio group appears
   only in an engine with `audioTracks` (Safari), because the clip carries two
   audio tracks and only there can the player switch between them. */
export const WithSettings: Story = {
  args: {
    qualities: [
      { id: 'auto', label: 'Auto (720p)' },
      { id: '1080', label: '1080p' },
      { id: '720', label: '720p' },
      { id: '480', label: '480p' },
    ],
    quality: 'auto',
  },
  render: function Render(args) {
    const [quality, setQuality] = useState<string | null>(args.quality ?? null);
    return (
      <VideoPlayer {...args} quality={quality} onQualityChange={setQuality}>
        <source src={harbourVideo} type="video/mp4" />
        <track kind="captions" srcLang="en" label="English" src={harbourCaptionsEnglish} default />
        <track kind="subtitles" srcLang="fr" label="Français" src={harbourCaptionsFrench} />
      </VideoPlayer>
    );
  },
};

/* The stage's shape is the product's. Square and portrait for social clips, 4:3
   for archive footage, with `cover` filling the stage instead of letterboxing. */
export const AspectRatios: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, alignItems: 'start' }}> {/* crystal-allow-literal: the story's own grid, four players side by side */}
      {(['16 / 9', '4 / 3', '1 / 1', '9 / 16'] as const).map((ratio) => (
        <VideoPlayer key={ratio} {...args} label={`${args.label}, ${ratio}`} aspectRatio={ratio} fit={ratio === '9 / 16' ? 'cover' : 'contain'}>
          <source src={harbourVideo} type="video/mp4" />
        </VideoPlayer>
      ))}
    </div>
  ),
};
