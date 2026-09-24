import { describe, expect, it } from 'vitest';
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
     not support: a reader has no way to turn it on and no way to know if it is
     on. What is checkable here is the other side of it — a player with nothing
     to caption offers no control for it. */
  it('offers no caption toggle when there is nothing to caption', () => {
    renderWithCrystal(<VideoPlayer label="The tour" />);
    expect(screen.queryByRole('button', { name: 'Captions' })).toBeNull();
  });

  /* The other half — that the toggle appears when a track exists, carries the
     track's real mode, and announces the change — is in `verify:behaviour`.
     jsdom parses `<track>` and populates no `textTracks` for it, so the state
     this component reads does not exist there; asserting it against a stub
     would be asserting the stub. */

  /* "Keyboard shortcuts do not trap focus." The shortcut must never take a key
     from the control the reader is actually on. Tested on the scrubber and `m`:
     a slider ignores `m`, so if the player answered it anyway the video would
     mute while the reader was seeking.

     An earlier version of this pressed Space on the play toggle and counted the
     plays. It passed with the guard deleted — React Aria's button does not let
     the press bubble as a second toggle — so it was checking nothing. */
  it('leaves a control its own keys', () => {
    const { container } = renderWithCrystal(<VideoPlayer label="The tour" />);
    const video = container.querySelector('video')!;

    /* `fireEvent`, not `userEvent`: typing a printable character at a focused
       `<input type="range">` does not dispatch the keydown this is about, so a
       `userEvent` version of this test passes whatever the component does. */
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Seek The tour' }), { key: 'm' });
    expect(video.muted).toBe(false);
  });

  /* And it does work, from inside the player and outside a control — otherwise
     the check above would be satisfied by a player with no shortcuts at all. */
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

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <VideoPlayer label="The tour">
        <track kind="captions" srcLang="en" label="English" src="/tour.vtt" />
      </VideoPlayer>,
    );
    await expectNoAxeViolations(container);
  });
});
