import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { MediaSettings } from './MediaSettings.js';

const tracks = [
  { id: 'text-0', label: 'English', language: 'en', kind: 'captions' },
  { id: 'text-1', label: 'Français', language: 'fr', kind: 'subtitles' },
];

describe('MediaSettings', () => {
  /* A control that opens an empty menu is a control that does nothing. */
  it('renders nothing when there is nothing to choose', () => {
    const { container } = renderWithCrystal(
      <MediaSettings playbackRates={[1]} onPlaybackRateChange={() => undefined} audioTracks={[tracks[0]!]} onAudioTrackChange={() => undefined} />,
    );
    expect(container.querySelector('button')).toBeNull();
  });

  /* One choice is a flat group of radio items. */
  it('shows a single choice as a flat group of radio items', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<MediaSettings playbackRates={[1, 2]} playbackRate={1} onPlaybackRateChange={() => undefined} />);
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    expect(await screen.findAllByRole('menuitemradio')).toHaveLength(2);
    expect(screen.queryByRole('menuitem')).toBeNull();
  });

  /* Several choices are a submenu each, whose row names the current value, so
     the menu stays short over a short picture. */
  it('shows several choices as one submenu each, naming the current value', async () => {
    const user = userEvent.setup();
    renderWithCrystal(
      <MediaSettings
        playbackRates={[1, 2]}
        playbackRate={2}
        onPlaybackRateChange={() => undefined}
        textTracks={tracks}
        activeTextTrack="text-1"
        onTextTrackChange={() => undefined}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    const rows = await screen.findAllByRole('menuitem');
    expect(rows.map((row) => row.textContent)).toEqual(['Speed, 2 times2×', 'Subtitles, FrançaisFrançais']);
    expect(screen.getByRole('menuitem', { name: 'Speed, 2 times' })).toBeInTheDocument();
    expect(rows.every((row) => row.getAttribute('aria-haspopup') === 'menu')).toBe(true);
  });

  /* The choice is reported and said, including turning subtitles off, which
     is a choice of its own and not an absence of one. */
  it('reports a subtitle choice, off included, and says it', async () => {
    const user = userEvent.setup();
    const picked: (string | null)[] = [];
    const said: string[] = [];
    renderWithCrystal(
      <MediaSettings
        textTracks={tracks}
        activeTextTrack="text-0"
        onTextTrackChange={(id) => picked.push(id)}
        onAnnounce={(sentence) => said.push(sentence)}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    const english = await screen.findByRole('menuitemradio', { name: 'English' });
    expect(english).toHaveAttribute('aria-checked', 'true');
    await user.click(screen.getByRole('menuitemradio', { name: 'Off' }));
    expect(picked).toEqual([null]);
    expect(said).toEqual(['Subtitles Off']);
  });

  /* R-M12. The caption style is a submenu of two radio groups, offered only
     when the player draws its own captions; a choice is reported and said. */
  it('offers a caption style submenu with a size and a backing, and says the choice', async () => {
    const user = userEvent.setup();
    const styles: unknown[] = [];
    const said: string[] = [];
    renderWithCrystal(
      <MediaSettings
        textTracks={tracks}
        activeTextTrack="text-0"
        onTextTrackChange={() => undefined}
        captionStyle={{ size: 'normal', backing: 'feathered' }}
        onCaptionStyleChange={(style) => styles.push(style)}
        onAnnounce={(sentence) => said.push(sentence)}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Caption style, Normal, Feathered' }));
    expect(await screen.findByRole('menuitemradio', { name: 'Normal' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('menuitemradio', { name: 'Feathered' })).toHaveAttribute('aria-checked', 'true');
    await user.click(screen.getByRole('menuitemradio', { name: 'Larger' }));
    expect(styles).toEqual([{ size: 'larger', backing: 'feathered' }]);
    expect(said).toEqual(['Caption size Larger']);
  });

  it('does not offer a caption style without a handler for it', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<MediaSettings textTracks={tracks} activeTextTrack="text-0" onTextTrackChange={() => undefined} playbackRates={[1, 2]} onPlaybackRateChange={() => undefined} />);
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await screen.findAllByRole('menuitem');
    expect(screen.queryByRole('menuitem', { name: /^Caption style/ })).toBeNull();
  });

  it('has no axe violations when open', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<MediaSettings playbackRates={[1, 2]} playbackRate={1} onPlaybackRateChange={() => undefined} />);
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await screen.findAllByRole('menuitemradio');
    await expectNoAxeViolations(document.body);
  });
});
