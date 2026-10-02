import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { MediaControls } from './MediaControls.js';

const base = {
  isPlaying: false,
  onPlayPause: () => {},
  currentTime: 83,
  duration: 296,
  onSeek: () => {},
};

describe('MediaControls', () => {
  /* "Play and pause are one toggle with a pressed state." Two buttons swapped by
     state means the one a reader has focused disappears under them the moment
     they press it, and focus falls to the document. */
  it('is one play toggle rather than two buttons', async () => {
    const onPlayPause = vi.fn();
    const { rerender } = renderWithCrystal(
      <MediaControls {...base} onPlayPause={onPlayPause} />,
    );
    const toggle = screen.getByRole('button', { name: 'Play' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(toggle);
    expect(onPlayPause).toHaveBeenCalledOnce();

    rerender(<MediaControls {...base} isPlaying onPlayPause={onPlayPause} />);
    /* The same button, still called Play, now pressed. */
    expect(screen.getAllByRole('button', { name: 'Play' })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Play' })).toHaveAttribute('aria-pressed', 'true');
  });

  /* "The scrubber is a slider announcing time, not a progress bar." */
  it('scrubs with a slider, not a progress bar', () => {
    renderWithCrystal(<MediaControls {...base} />);
    expect(screen.getByRole('slider', { name: 'Seek' })).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  /* It announces a time in words. A screen reader does not read `1:23` as a
     time. */
  it('says the position in words', () => {
    renderWithCrystal(<MediaControls {...base} />);
    expect(screen.getByRole('slider', { name: 'Seek' }))
      .toHaveAttribute('aria-valuetext', '1 minute 23 seconds of 4 minutes 56 seconds');
  });

  it('shows the position and the length on the screen', () => {
    renderWithCrystal(<MediaControls {...base} />);
    expect(screen.getByText('1:23')).toBeInTheDocument();
    expect(screen.getByText('4:56')).toBeInTheDocument();
  });

  /* A scrubber with a range of nought cannot be operated, and the component
     must not claim a length nobody knows yet. */
  it('disables the scrubber until the length is known', () => {
    renderWithCrystal(<MediaControls {...base} duration={0} />);
    expect(screen.getByRole('slider', { name: 'Seek' })).toBeDisabled();
    expect(screen.getByText('--:--')).toBeInTheDocument();
  });

  /* Buffering differs from paused, because the reader did not ask for it, and
     a spinner reaches only sighted readers. */
  it('says it is buffering rather than only drawing it', () => {
    renderWithCrystal(<MediaControls {...base} isBuffering />);
    expect(screen.getByRole('status')).toHaveTextContent('Buffering at 1 minute 23 seconds');
  });

  it('names its controls for what is playing when it is told', () => {
    renderWithCrystal(<MediaControls {...base} mediaLabel="Episode 4" />);
    expect(screen.getByRole('button', { name: 'Play Episode 4' })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Seek Episode 4' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <MediaControls {...base} isMuted={false} onMuteToggle={() => {}} volume={0.5} onVolumeChange={() => {}} />,
    );
    await expectNoAxeViolations(container);
  });
});
