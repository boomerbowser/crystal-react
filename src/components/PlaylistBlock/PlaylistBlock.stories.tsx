import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { PlaylistBlock, type PlaylistTrack } from './PlaylistBlock.js';

const tracks: PlaylistTrack[] = [
  { id: 'a', title: 'Harbour Lights', titleText: 'Harbour Lights', artist: 'The Tides', duration: '3:41' },
  { id: 'b', title: 'North Road', titleText: 'North Road', artist: 'Ada Fern', duration: '4:02' },
  { id: 'c', title: 'Slate Sky', titleText: 'Slate Sky', artist: 'Bo Lindqvist', duration: '2:58' },
  { id: 'd', title: 'Low Tide', titleText: 'Low Tide', artist: 'The Tides', duration: '5:10' },
];

const meta = {
  title: 'Blocks/PlaylistBlock',
  component: PlaylistBlock,
  parameters: {
    docs: {
      description: {
        component:
          '"Reorder works by keyboard; the now-playing row is aria-current."\n\nReact Aria’s GridList '
          + 'with drag and drop: from a row’s handle, Enter picks the track up, the arrows move it '
          + 'between announced drop positions, and Enter puts it down. The new order goes to the '
          + 'product as ids. The row playing now is `aria-current` and says so in words. A carried '
          + 'track lifts and settles; the rows it displaces play `reorder`.',
      },
    },
  },
  args: { label: 'Up next', tracks, nowPlaying: 'b', onReorder: fn(), onPlay: fn() },
} satisfies Meta<typeof PlaylistBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playing: Story = {};
/** Nothing playing: no row is current. */
export const AtRest: Story = {
  render: function AtRestStory({ nowPlaying: _, ...args }) { return <PlaylistBlock {...args} />; },
};

/** Reordering for real, by pointer or by keyboard from a row's handle. */
export const Reordering: Story = {
  render: function ReorderingStory(args) {
    const [order, setOrder] = useState<readonly string[]>(tracks.map((track) => track.id));
    const [playing, setPlaying] = useState('b');
    return (
      <div style={{ maxInlineSize: 520 }}>
        <PlaylistBlock
          {...args}
          tracks={order.map((id) => tracks.find((track) => track.id === id)!)}
          nowPlaying={playing}
          onReorder={setOrder}
          onPlay={setPlaying}
        />
      </div>
    );
  },
};
