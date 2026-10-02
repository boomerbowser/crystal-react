import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import userEvent from '@testing-library/user-event';
import { fireEvent } from '@testing-library/react';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { VideoPlayer } from './VideoPlayer.js';

describe('VideoPlayer', () => {
  it('is a real video element with the transport over it', () => {
    const { container } = renderWithCrystal(
      <VideoPlayer label="The tour">
        <source src="/tour.mp4" type="video/mp4" />
      </VideoPlayer>,
    );
    const video = container.querySelector('video');
    expect(video).not.toBeNull();
    expect(video).not.toHaveAttribute('controls');
    expect(screen.getByRole('button', { name: 'Play The tour' })).toBeInTheDocument();
  });

  /* "Captions are supported and their state is announced." A `<track>` alone is
     not support, because a reader has no way to turn it on or to know if it is
     on. This test checks the case jsdom can reach: a player with nothing to
     caption offers no control for it. */
  it('offers no caption toggle when there is nothing to caption', () => {
    renderWithCrystal(<VideoPlayer label="The tour" />);
    expect(screen.queryByRole('button', { name: 'Captions' })).toBeNull();
  });

  /* The other half (the toggle appears when a track exists, carries the track's
     real mode, and announces the change) is in `verify:behaviour`. jsdom parses
     `<track>` and populates no `textTracks` for it, so the state this component
     reads does not exist there, and a stub would only test the stub. */

  /* "Keyboard shortcuts do not trap focus." The shortcut must never take a key
     from the control the reader is on. Tested on the scrubber and `m`: a slider
     ignores `m`, so if the player answered it anyway the video would mute while
     the reader was seeking.

     Space on the play toggle cannot test the guard. React Aria's button does not
     let the press bubble as a second toggle, so that test passes with the guard
     deleted. */
  it('leaves a control its own keys', () => {
    const { container } = renderWithCrystal(<VideoPlayer label="The tour" />);
    const video = container.querySelector('video')!;

    /* `fireEvent`, not `userEvent`. Typing a printable character at a focused
       `<input type="range">` does not dispatch the keydown under test, so a
       `userEvent` version passes whatever the component does. */
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Seek The tour' }), { key: 'm' });
    expect(video.muted).toBe(false);
  });

  /* The shortcut works from inside the player and outside a control. Without
     this, a player with no shortcuts at all would pass the check above. */
  it('answers the shortcut when the press is the player\'s to answer', () => {
    const { container } = renderWithCrystal(<VideoPlayer label="The tour" />);
    const video = container.querySelector('video')!;
    fireEvent.keyDown(video, { key: 'm' });
    expect(video.muted).toBe(true);
  });

  it('has no document-level listener to steal the page\'s keys', async () => {
    const user = userEvent.setup();
    const { container } = renderWithCrystal(
      <>
        <button type="button">Outside</button>
        <VideoPlayer label="The tour" />
      </>,
    );
    const video = container.querySelector('video')!;
    let played = 0;
    video.play = () => { played += 1; return Promise.resolve(); };

    screen.getByRole('button', { name: 'Outside' }).focus();
    await user.keyboard(' ');
    expect(played).toBe(0);
  });

  /* Sources, tracks, streaming and playlists all happen on the element, which is
     the product's to use, so it is handed over instead of hidden. */
  it('hands the element to the caller', () => {
    const ref = createRef<HTMLVideoElement>();
    const { container } = renderWithCrystal(
      <VideoPlayer label="The tour" mediaRef={ref}>
        <source src="/tour.mp4" type="video/mp4" />
      </VideoPlayer>,
    );
    expect(ref.current).not.toBeNull();
    expect(ref.current).toBe(container.querySelector('video'));
  });

  /* The stage keeps a shape before the first frame decodes, so the page does
     not jump, and the shape is the product's. */
  it('holds the stage at the aspect ratio and fit it is given', () => {
    const { container, rerenderWithCrystal } = renderWithCrystal(<VideoPlayer label="The tour" />);
    const stage = () => container.querySelector('video')!.parentElement!;
    expect(stage().style.getPropertyValue('--cr-media-aspect')).toBe('16 / 9');
    expect(stage().style.getPropertyValue('--cr-media-fit')).toBe('contain');
    rerenderWithCrystal(<VideoPlayer label="The tour" aspectRatio="9 / 16" fit="cover" />);
    expect(stage().style.getPropertyValue('--cr-media-aspect')).toBe('9 / 16');
    expect(stage().style.getPropertyValue('--cr-media-fit')).toBe('cover');
  });

  /* Speed is a choice of one, so it is radio items; the chosen one is weight,
     never a check; the element's own rate is what changes; and it is said. */
  it('changes the element\'s speed from the settings menu, and says so', async () => {
    const user = userEvent.setup();
    const { container } = renderWithCrystal(<VideoPlayer label="The tour" />);
    const video = container.querySelector('video')!;
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    const normal = await screen.findByRole('menuitemradio', { name: 'Normal' });
    expect(normal).toHaveAttribute('aria-checked', 'true');
    expect(normal.querySelector('svg')).toBeNull();
    await user.click(screen.getByRole('menuitemradio', { name: '1.5 times' }));
    expect(video.playbackRate).toBe(1.5);
    fireEvent(video, new Event('ratechange'));
    expect(screen.getAllByRole('status').some((one) => one.textContent === 'Speed 1.5 times')).toBe(true);
  });

  it('answers Shift+> and Shift+< with the next and previous speed', () => {
    const { container } = renderWithCrystal(<VideoPlayer label="The tour" />);
    const video = container.querySelector('video')!;
    fireEvent.keyDown(video, { key: '>' });
    expect(video.playbackRate).toBe(1.25);
    fireEvent(video, new Event('ratechange'));
    fireEvent.keyDown(video, { key: '<' });
    expect(video.playbackRate).toBe(1);
  });

  /* R-M12. The reader's caption style is theirs, so it is kept for this
     browser and the next player starts from it. */
  it('draws captions in the caption style the reader saved', () => {
    localStorage.setItem('crystal-caption-style', JSON.stringify({ size: 'larger', backing: 'solid' }));
    try {
      const { container } = renderWithCrystal(<VideoPlayer label="Harbour" />);
      const cues = container.querySelector('[class*="captions"]');
      expect(cues).toHaveAttribute('data-size', 'larger');
      expect(cues).toHaveAttribute('data-backing', 'solid');
    } finally {
      localStorage.removeItem('crystal-caption-style');
    }
  });

  it('ignores a saved caption style it does not recognise', () => {
    localStorage.setItem('crystal-caption-style', '{"size":"huge","backing":"neon"}');
    try {
      const { container } = renderWithCrystal(<VideoPlayer label="Harbour" />);
      const cues = container.querySelector('[class*="captions"]');
      expect(cues).toHaveAttribute('data-size', 'normal');
      expect(cues).toHaveAttribute('data-backing', 'feathered');
    } finally {
      localStorage.removeItem('crystal-caption-style');
    }
  });

  it('leaves speed out when the product passes no speeds', () => {
    renderWithCrystal(<VideoPlayer label="The tour" playbackRates={[]} />);
    expect(screen.queryByRole('button', { name: 'Settings' })).toBeNull();
  });

  /* Quality is the product's to switch: the player shows the renditions it is
     given and reports the choice, and switches nothing itself. */
  it('offers the product\'s renditions and reports the choice', async () => {
    const user = userEvent.setup();
    const chosen: string[] = [];
    renderWithCrystal(
      <VideoPlayer
        label="The tour"
        playbackRates={[]}
        qualities={[{ id: 'auto', label: 'Auto' }, { id: '1080', label: '1080p' }]}
        quality="auto"
        onQualityChange={(id) => chosen.push(id)}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await user.click(await screen.findByRole('menuitemradio', { name: '1080p' }));
    expect(chosen).toEqual(['1080']);
  });

  /* jsdom has no picture in picture, so the control is not offered. A button
     that does nothing when pressed is worse than none. */
  it('offers picture in picture only where the browser can do it', () => {
    renderWithCrystal(<VideoPlayer label="The tour" />);
    expect(screen.queryByRole('button', { name: 'Picture in picture' })).toBeNull();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <VideoPlayer label="The tour">
        <track kind="captions" srcLang="en" label="English" src="/tour.vtt" />
      </VideoPlayer>,
    );
    await expectNoAxeViolations(container);
  });
});
