import { describe, expect, it, vi, afterEach } from 'vitest';
import { act } from 'react';
import { render, screen } from '@testing-library/react';
import presets from '@prismata/core/core/presets';
import { PrismataProvider } from '../theme/PrismataProvider.js';
import { usePreset, type PrismataPresetName, type UsePresetOptions } from './usePreset.js';

/* `usePreset` computes nothing itself (CONTRACT §1). The numbers come from live
   custom properties, so a second implementation would drift silently instead of
   failing. The hook does own four things, and this file tests them: measuring
   the environment, clamping what it measured, handing it over, and settling the
   promise whatever happens. Testing the hook only through `Dialog` would miss a
   geometry change that does not move a dialog. */

function Subject({ preset, options }: {
  preset: PrismataPresetName;
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
    render(<PrismataProvider><Subject preset="frost" /></PrismataProvider>);
    const subject = screen.getByTestId('subject');

    await act(async () => { screen.getByText('play').click(); });
    expect(subject.dataset['prMotionName']).toBe('frost');

    await vi.waitFor(() => expect(subject.dataset['prMotionState']).toBe('finished'), { timeout: 4000 });
  });

  /* Reduced motion removes the movement, never the state change. The promise
     still settles, so an exit animation that waits on it before unmounting does
     not leave the dialog on screen for ever. */
  it('settles instantly under reduced motion without animating', async () => {
    const spy = vi.spyOn(presets, 'presetKeyframes');
    render(
      <PrismataProvider reduceMotion><Subject preset="resin" /></PrismataProvider>,
    );
    await act(async () => { screen.getByText('play').click(); });

    expect(screen.getByTestId('subject').dataset['prMotionState']).toBe('instant');
    expect(spy).not.toHaveBeenCalled();
  });

  /* Haze and Stone have no component movement: their signature is paint. The
     promise has to settle for them too. */
  it('settles instantly for a material whose signature is paint', async () => {
    render(<PrismataProvider><Subject preset="haze" /></PrismataProvider>);
    await act(async () => { screen.getByText('play').click(); });
    expect(screen.getByTestId('subject').dataset['prMotionState']).toBe('instant');
  });

  /* The ceiling stops a product that sets a travel token to an absurd value from
     throwing a panel across the viewport. The hook does the clamping, not the
     core module, and it applies to depth as well as travel. */
  it('clamps measured travel to Prismata’s ceiling before handing it over', async () => {
    const spy = vi.spyOn(presets, 'presetKeyframes');
    /* 30 instead of Prismata's own 50, because depth's fallback is 50. A ceiling
       equal to the fallback would let a hook that never clamped pass this test. */
    travel('--pr-motion-max-travel', '30');
    travel(`--pr-travel-${presets.travelRole('frost')}`, '4000');
    travel('--pr-travel-depth', '9000');

    render(<PrismataProvider><Subject preset="frost" /></PrismataProvider>);
    await act(async () => { screen.getByText('play').click(); });

    expect(spy).toHaveBeenCalled();
    const [, given] = spy.mock.calls[0]!;
    expect(given.travel).toBe(30);
    expect(given.depth).toBe(30);
  });

  it('falls back to Prismata’s own defaults when a token is missing', async () => {
    const spy = vi.spyOn(presets, 'presetKeyframes');
    render(<PrismataProvider><Subject preset="frost" /></PrismataProvider>);
    await act(async () => { screen.getByText('play').click(); });

    const [, given] = spy.mock.calls[0]!;
    expect(Number.isFinite(given.travel)).toBe(true);
    expect(given.travel).toBeGreaterThan(0);
  });

  /* A dismissal fades for something anchored to the page and falls for something
     floating above it. Only the caller knows which its component is, so the
     option has to reach the computation. */
  it('passes the caller’s anchoring through', async () => {
    const spy = vi.spyOn(presets, 'presetKeyframes');
    render(
      <PrismataProvider><Subject preset="dismiss" options={{ anchored: true }} /></PrismataProvider>,
    );
    await act(async () => { screen.getByText('play').click(); });
    expect(spy.mock.calls[0]![1].anchored).toBe(true);
  });
});
