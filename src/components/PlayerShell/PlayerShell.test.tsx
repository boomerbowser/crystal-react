import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { act, renderWithCrystal, screen, userEvent, within } from '../../test/render.js';
import { PlayerShell, type PlayerShellProps } from './PlayerShell.js';

const queue: PlayerShellProps['queue'] = {
  label: 'Up next',
  tracks: [
    { id: 'a', title: 'Opening', titleText: 'Opening', duration: '3:41' },
    { id: 'b', title: 'Harbour lights', titleText: 'Harbour lights', duration: '4:02' },
  ],
  nowPlaying: 'a',
  onReorder: () => {},
};

const props: PlayerShellProps = {
  label: 'Harbour, episode 1',
  metadata: { title: 'Harbour, episode 1', subtitle: 'Season 1', description: 'The first night on the water.' },
  queue,
  children: <track kind="captions" src="data:text/vtt,WEBVTT" srcLang="en" label="English" />,
};

/* jsdom has no Fullscreen API. This one goes full screen on whatever asks and
   says so, as a browser does. */
let fullscreenElement: Element | null = null;
beforeEach(() => {
  Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: true });
  Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => fullscreenElement });
  HTMLElement.prototype.requestFullscreen = vi.fn(function (this: HTMLElement) {
    fullscreenElement = this;
    document.dispatchEvent(new Event('fullscreenchange'));
    return Promise.resolve();
  });
  document.exitFullscreen = vi.fn(() => {
    fullscreenElement = null;
    document.dispatchEvent(new Event('fullscreenchange'));
    return Promise.resolve();
  });
});
afterEach(() => {
  fullscreenElement = null;
  Reflect.deleteProperty(document, 'fullscreenEnabled');
  Reflect.deleteProperty(document, 'fullscreenElement');
});

describe('PlayerShell', () => {
  /* Real media elements. */
  it('is a real media element, named for what is playing, handed back to the product', () => {
    const mediaRef = { current: null as HTMLMediaElement | null };
    const { container } = renderWithCrystal(<PlayerShell {...props} mediaRef={mediaRef} />);
    const video = container.querySelector('video');
    expect(video).toHaveAttribute('aria-label', 'Harbour, episode 1');
    expect(mediaRef.current).toBe(video);
  });

  it('plays audio in an audio element, without a full-screen control', () => {
    const { container } = renderWithCrystal(<PlayerShell {...props} kind="audio" />);
    expect(container.querySelector('audio')).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Full screen' })).toBeNull();
  });

  /* Transport reachable by keyboard. */
  it('puts every control of the transport in the tab order', async () => {
    renderWithCrystal(<PlayerShell {...props} />);
    const reached: string[] = [];
    for (let i = 0; i < 12; i += 1) {
      await userEvent.tab();
      const at = document.activeElement;
      reached.push(at?.getAttribute('aria-label') ?? at?.textContent ?? '');
    }
    expect(reached).toEqual(expect.arrayContaining(['Full screen']));
    expect(reached.some((name) => /play/i.test(name))).toBe(true);
  });

  it('starts idle', () => {
    const { container } = renderWithCrystal(<PlayerShell {...props} />);
    expect(container.querySelector('[data-cr-state]')).toHaveAttribute('data-cr-state', 'idle');
  });

  /* Full screen keeps Crystal's transport, and entering and leaving are said. */
  it('goes full screen on its stage, with the transport, and says so', async () => {
    const { container } = renderWithCrystal(<PlayerShell {...props} />);
    const toggle = screen.getByRole('button', { name: 'Full screen' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(toggle);
    expect(fullscreenElement).not.toBe(container.querySelector('video'));
    expect(fullscreenElement?.contains(container.querySelector('video'))).toBe(true);
    expect(fullscreenElement?.contains(toggle)).toBe(true);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByRole('status').some((one) => one.textContent === 'Full screen on')).toBe(true);
    expect(container.querySelector('[data-cr-state]')).toHaveAttribute('data-cr-state', 'full-screen');
  });

  it('knows when full screen was left without its toggle, as Escape does', async () => {
    renderWithCrystal(<PlayerShell {...props} />);
    await userEvent.click(screen.getByRole('button', { name: 'Full screen' }));
    act(() => {
      fullscreenElement = null;
      document.dispatchEvent(new Event('fullscreenchange'));
    });
    expect(screen.getByRole('button', { name: 'Full screen' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getAllByRole('status').some((one) => one.textContent === 'Full screen off')).toBe(true);
  });

  it('offers no full screen where the document may not have it', () => {
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: false });
    renderWithCrystal(<PlayerShell {...props} />);
    expect(screen.queryByRole('button', { name: 'Full screen' })).toBeNull();
  });

  it('names the metadata by its heading, and gives the queue its now-playing row', () => {
    renderWithCrystal(<PlayerShell {...props} />);
    expect(screen.getByRole('region', { name: 'Harbour, episode 1' })).toHaveTextContent('The first night on the water.');
    const upNext = screen.getByRole('grid', { name: 'Up next' });
    expect(within(upNext).getAllByRole('row')[0]).toHaveAttribute('aria-current', 'true');
  });

  it.each([['video', 'video'], ['audio', 'audio']] as const)('has no axe violations %s', async (_, kind) => {
    const { container } = renderWithCrystal(<PlayerShell {...props} kind={kind} />);
    await expectNoAxeViolations(container);
  });

  it('has no axe violations full screen', async () => {
    const { container } = renderWithCrystal(<PlayerShell {...props} />);
    await userEvent.click(screen.getByRole('button', { name: 'Full screen' }));
    await expectNoAxeViolations(container);
  });
});
