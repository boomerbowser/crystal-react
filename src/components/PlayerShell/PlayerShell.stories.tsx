import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { PlayerShell } from './PlayerShell.js';
import type { PlaylistTrack } from '../PlaylistBlock/PlaylistBlock.js';

/* A tiny inline file, as VideoPlayer's stories use. These stories show the
   transport, the full screen, the queue and the metadata, so the picture does
   not matter. */
const SAMPLE = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAAhtZGF0';

const tracks: PlaylistTrack[] = [
  { id: 'e1', title: 'Episode 1 · The first night', titleText: 'Episode 1, The first night', duration: '42:10' },
  { id: 'e2', title: 'Episode 2 · Low water', titleText: 'Episode 2, Low water', duration: '39:55' },
  { id: 'e3', title: 'Episode 3 · The pilot boat', titleText: 'Episode 3, The pilot boat', duration: '44:02' },
];

const meta = {
  title: 'Blocks/PlayerShell',
  component: PlayerShell,
  parameters: {
    docs: {
      description: {
        component:
          '"Real media elements; captions and their state announced; transport reachable by keyboard."\n\n'
          + 'The shell is `VideoPlayer` or `AudioPlayer`, a native element under Crystal\'s Resin transport '
          + 'with the caption toggle and keyboard shortcuts that answer only while focus is inside. It adds '
          + 'full screen on the shell\'s stage so the transport comes too, metadata on Haze, and '
          + '`PlaylistBlock` as the queue.',
      },
    },
  },
  args: {
    label: 'Harbour, episode 1',
    metadata: { title: 'Harbour, episode 1', subtitle: 'Season 1 · 42 minutes', description: 'The first night on the water, and the pilot who will not come ashore.' },
  },
  decorators: [(Story) => <div style={{ maxInlineSize: 720 }}><Story /></div>],
  render: function Shell(args) {
    const [order, setOrder] = useState(tracks);
    const [playing, setPlaying] = useState('e1');
    return (
      <PlayerShell
        {...args}
        queue={{
          label: 'Up next',
          tracks: order,
          nowPlaying: playing,
          onReorder: (ids) => { setOrder(ids.map((id) => tracks.find((one) => one.id === id)!)); },
          onPlay: setPlaying,
        }}
      >
        <source src={SAMPLE} type="video/mp4" />
        <track kind="captions" srcLang="en" label="English" src={'data:text/vtt,WEBVTT%0A%0A00:00.000 --> 00:02.000%0AThe harbour at dusk.'} />
      </PlayerShell>
    );
  },
} satisfies Meta<typeof PlayerShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Video: Story = {};
export const Audio: Story = { args: { kind: 'audio' } };
