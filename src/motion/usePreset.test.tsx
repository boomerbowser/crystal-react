import { describe, expect, it, vi, afterEach } from 'vitest';
import { act } from 'react';
import { render, screen } from '@testing-library/react';
import presets from '@crystal/core/core/presets';
import { CrystalProvider } from '../theme/CrystalProvider.js';
import { usePreset, type CrystalPresetName, type UsePresetOptions } from './usePreset.js';

/* `usePreset` computes nothing itself — CONTRACT §1, and the numbers here come
   from live custom properties, so a second implementation would drift silently
   rather than fail. What it *does* own is measuring the environment, clamping
   what it measured, handing it over, and settling the promise whatever happens.
   Those four are what this file tests, and the hook was previously exercised
   only through `Dialog`: a change to the geometry that happened not to move a
   dialog passed everything. */

function Subject({ preset, options }: {
  preset: CrystalPresetName;
  options?: UsePresetOptions;
}): React.JSX.Element {
  const [scope, play] = usePreset(options ?? {});
  return (
    <div ref={scope as never} data-testid="subject">
      <button type="button" onClick={() => { void play(preset); }}>play</button>
    </div>
  );
}

const travel = (property: string, value: string) =>
  document.documentElement.style.setProperty(property, value);

afterEach(() => {
  document.documentElement.removeAttribute('style');
  vi.restoreAllMocks();
});

describe('usePreset', () => {
  it('names the movement it is playing and reports when it has finished', async () => {
    render(<CrystalProvider><Subject preset="frost" /></CrystalProvider>);
    const subject = screen.getByTestId('subject');

    await act(async () => { screen.getByText('play').click(); });
    expect(subject.dataset['crMotionName']).toBe('frost');

    await vi.waitFor(() => expect(subject.dataset['crMotionState']).toBe('finished'), { timeout: 4000 });
  });

  /* Reduced motion removes the movement, never the state change — and the
     promise still settles, so an exit animation that waits on it before
     unmounting is not left hanging with the dialog on screen for ever. */
  it('settles instantly under reduced motion without animating', async () => {
    const spy = vi.spyOn(presets, 'presetKeyframes');
    render(
      <CrystalProvider reduceMotion><Subject preset="resin" /></CrystalProvider>,
    );
    await act(async () => { screen.getByText('play').click(); });

    expect(screen.getByTestId('subject').dataset['crMotionState']).toBe('instant');
    expect(spy).not.toHaveBeenCalled();
  });

  /* Haze and Stone have no component movement: their signature is paint. The
     promise has to settle for them too. */
  it('settles instantly for a material whose signature is paint', async () => {
    render(<CrystalProvider><Subject preset="haze" /></CrystalProvider>);
    await act(async () => { screen.getByText('play').click(); });
    expect(screen.getByTestId('subject').dataset['crMotionState']).toBe('instant');
  });

  /* The ceiling exists so that a product setting a travel token to something
     absurd cannot throw a panel across the viewport. Clamping is this file's
     job, not the core module's, and it is applied to depth as well as travel. */
  it('clamps measured travel to Crystal’s ceiling before handing it over', async () => {
    const spy = vi.spyOn(presets, 'presetKeyframes');
    /* 30 rather than Crystal's own 50, because depth's fallback *is* 50: a
       ceiling that happened to equal the fallback would let a hook that never
       clamped at all pass this test. */
    travel('--cr-motion-max-travel', '30');
    travel(`--cr-travel-${presets.travelRole('frost')}`, '4000');
    travel('--cr-travel-depth', '9000');

    render(<CrystalProvider><Subject preset="frost" /></CrystalProvider>);
    await act(async () => { screen.getByText('play').click(); });

    expect(spy).toHaveBeenCalled();
    const [, given] = spy.mock.calls[0]!;
    expect(given.travel).toBe(30);
    expect(given.depth).toBe(30);
  });

  it('falls back to Crystal’s own defaults when a token is missing', async () => {
    const spy = vi.spyOn(presets, 'presetKeyframes');
    render(<CrystalProvider><Subject preset="frost" /></CrystalProvider>);
    await act(async () => { screen.getByText('play').click(); });

    const [, given] = spy.mock.calls[0]!;
    expect(Number.isFinite(given.travel)).toBe(true);
    expect(given.travel).toBeGreaterThan(0);
  });

  /* A dismissal that fades rather than falls is the difference between something
     anchored to the page and something floating above it, and it is the caller's
     statement about its own component — so it has to reach the computation. */
  it('passes the caller’s anchoring through', async () => {
    const spy = vi.spyOn(presets, 'presetKeyframes');
    render(
      <CrystalProvider><Subject preset="dismiss" options={{ anchored: true }} /></CrystalProvider>,
    );
    await act(async () => { screen.getByText('play').click(); });
    expect(spy.mock.calls[0]![1].anchored).toBe(true);
  });
});
