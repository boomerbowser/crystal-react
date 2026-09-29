import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent, within } from '../../test/render.js';
import { PlaylistBlock, type PlaylistTrack } from './PlaylistBlock.js';

const tracks: PlaylistTrack[] = [
  { id: 'a', title: 'Harbour Lights', titleText: 'Harbour Lights', artist: 'The Tides', duration: '3:41' },
  { id: 'b', title: 'North Road', titleText: 'North Road', artist: 'Ada Fern', duration: '4:02' },
  { id: 'c', title: 'Slate Sky', titleText: 'Slate Sky', duration: '2:58' },
];

describe('PlaylistBlock', () => {
  it('is a named grid of tracks, each with its own named drag handle', () => {
    renderWithCrystal(<PlaylistBlock label="Up next" tracks={tracks} onReorder={() => {}} />);
    const grid = screen.getByRole('grid', { name: 'Up next' });
    expect(within(grid).getAllByRole('row')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Reorder North Road' })).toBeInTheDocument();
  });

  /* The now-playing row is `aria-current`, on the row itself, and says so in words. */
  it('marks the now-playing row as current, and says so', () => {
    renderWithCrystal(<PlaylistBlock label="Up next" tracks={tracks} nowPlaying="b" onReorder={() => {}} />);
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveAttribute('aria-current', 'true');
    expect(rows[0]).not.toHaveAttribute('aria-current');
    expect(within(rows[1]!).getByText('Now playing')).toBeInTheDocument();
  });

  it('plays a track on Enter', async () => {
    const onPlay = vi.fn();
    renderWithCrystal(<PlaylistBlock label="Up next" tracks={tracks} onReorder={() => {}} onPlay={onPlay} />);
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    expect(onPlay).toHaveBeenCalledWith('a');
  });

  it.each([
    ['at rest', {}],
    ['playing', { nowPlaying: 'a' }],
  ])('has no axe violations %s', async (_, extra) => {
    const { container } = renderWithCrystal(<PlaylistBlock label="Up next" tracks={tracks} onReorder={() => {}} {...extra} />);
    await expectNoAxeViolations(container);
  });
});
