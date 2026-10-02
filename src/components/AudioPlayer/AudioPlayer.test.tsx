import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { AudioPlayer } from './AudioPlayer.js';

describe('AudioPlayer', () => {
  /* "A real audio element." It is what the operating system's media keys reach
     and what a headset's pause button pauses. */
  it('is a real audio element with the controls around it', () => {
    const { container } = renderWithCrystal(
      <AudioPlayer label="Episode 4">
        <source src="/episode-4.mp3" type="audio/mpeg" />
      </AudioPlayer>,
    );
    const audio = container.querySelector('audio');
    expect(audio).not.toBeNull();
    expect(audio).toHaveAttribute('aria-label', 'Episode 4');
    expect(audio!.querySelector('source')).toHaveAttribute('src', '/episode-4.mp3');
  });

  /* Two sets of controls for one element means two tab stops per action and two
     places a state can be shown differently. */
  it('does not draw the browser\'s own controls beside its own', () => {
    const { container } = renderWithCrystal(<AudioPlayer label="Episode 4" />);
    expect(container.querySelector('audio')).not.toHaveAttribute('controls');
    expect(screen.getByRole('button', { name: 'Play Episode 4' })).toBeInTheDocument();
  });

  it('names every control for what is playing', () => {
    renderWithCrystal(<AudioPlayer label="Episode 4" />);
    expect(screen.getByRole('slider', { name: 'Seek Episode 4' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mute Episode 4' })).toBeInTheDocument();
  });

  /* Sources, playlists and streaming are the product's half and are all done on
     the element, so it is handed to the caller. */
  it('hands the element to the caller', () => {
    /* The assertion reads what the caller holds after the render. Reading
       `ref.current` during the render that creates the ref would pass even with
       `mediaRef` ignored. */
    const ref = createRef<HTMLAudioElement>();
    const { container } = renderWithCrystal(<AudioPlayer label="Episode 4" mediaRef={ref} />);
    expect(ref.current).not.toBeNull();
    expect(ref.current).toBe(container.querySelector('audio'));
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(<AudioPlayer label="Episode 4" title="Episode 4" />);
    await expectNoAxeViolations(container);
  });

  /* The catalogue specifies a Haze card holding the transport; until 2 October
     2026 the player drew no surface and its pill sat flush with the page. */
  it('is a Haze card unless it sits on one already', () => {
    const { container, rerenderWithCrystal } = renderWithCrystal(<AudioPlayer label="Episode 4" title="Episode 4" subtitle="Harbour stories" />);
    const player = () => container.querySelector('audio')!.parentElement!;
    expect(player()).toHaveClass('cr-haze');
    expect(screen.getByText('Harbour stories')).toBeInTheDocument();
    rerenderWithCrystal(<AudioPlayer label="Episode 4" surface={false} />);
    expect(player()).not.toHaveClass('cr-haze');
  });

  it('offers speed, where audio is listened to fastest', () => {
    renderWithCrystal(<AudioPlayer label="Episode 4" />);
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
  });
});
