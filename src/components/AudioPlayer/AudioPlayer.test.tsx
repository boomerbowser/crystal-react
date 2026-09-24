import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { AudioPlayer } from './AudioPlayer.js';

describe('AudioPlayer', () => {
  /* "A real audio element." Not a detail behind the component: it is what the
     operating system's media keys reach and what a headset's pause button
     pauses. */
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

  /* Two sets of controls for one element is two tab stops per action and two
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

  /* The element is the product's half — sources, playlists, streaming are all
     done on it — so it is handed over rather than hidden. */
  it('hands the element to the caller', () => {
    /* The first version of this test read `ref.current` during the render that
       creates the ref and asserted it was null, which is true of any component
       and of no component — it would have passed with `mediaRef` ignored
       entirely. What the claim is about is what the caller holds *after* the
       render. */
    const ref = createRef<HTMLAudioElement>();
    const { container } = renderWithCrystal(<AudioPlayer label="Episode 4" mediaRef={ref} />);
    expect(ref.current).not.toBeNull();
    expect(ref.current).toBe(container.querySelector('audio'));
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(<AudioPlayer label="Episode 4" title="Episode 4" />);
    await expectNoAxeViolations(container);
  });
});
