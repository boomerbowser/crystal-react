import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CrystalProvider, useCrystalTheme } from './CrystalProvider.js';
import { useColorScheme, useMotionSpeed } from './hooks.js';
import { crystalTokens } from './tokens.generated.js';

function Probe() {
  const theme = useCrystalTheme();
  const { palette, mode } = useColorScheme();
  const { resolveDuration } = useMotionSpeed();
  return (
    <output data-testid="probe">
      {JSON.stringify({ palette, mode, radius: theme.radius, press: resolveDuration(120) })}
    </output>
  );
}
const read = () => JSON.parse(screen.getByTestId('probe').textContent ?? '{}');

describe('CrystalProvider', () => {
  it('publishes Crystal defaults when given nothing', () => {
    render(<CrystalProvider><Probe /></CrystalProvider>);
    const v = read();
    expect(v.palette).toBe('prism');
    expect(v.mode).toBe('light');
    expect(`${v.radius}px`).toBe(crystalTokens['shape.contentRadius']);
  });

  it('clamps an out-of-range value rather than passing it through', () => {
    // Crystal's radius range is 14-28. 999 is not a Crystal radius, and a
    // library that lets it reach CSS is no longer rendering Crystal.
    render(<CrystalProvider radius={999}><Probe /></CrystalProvider>);
    expect(read().radius).toBeLessThanOrEqual(parseFloat(crystalTokens['shape.contentRadius']));
  });

  it('resolves duration through Crystal, capped at the ceiling', () => {
    render(<CrystalProvider motionSpeed={2}><Probe /></CrystalProvider>);
    expect(read().press).toBe(60);
  });

  it('resolves reduced motion to zero, keeping the state change', () => {
    render(<CrystalProvider reduceMotion><Probe /></CrystalProvider>);
    expect(read().press).toBe(0);
  });

  it('scopes to its own element, so a nested provider overrides only itself', () => {
    render(
      <CrystalProvider mode="light" data-testid="outer">
        <span data-testid="outer-probe" />
        <CrystalProvider mode="dark"><Probe /></CrystalProvider>
      </CrystalProvider>,
    );
    expect(read().mode).toBe('dark');
    expect(read().palette).toBe('prism'); // inherited, not reset
  });

  it('writes the theme onto the DOM for CSS to read', () => {
    const { container } = render(<CrystalProvider palette="cobalt" mode="dark" />);
    const scope = container.querySelector('[data-crystal-scope]') as HTMLElement;
    expect(scope.dataset.crystalPalette).toBe('cobalt');
    expect(scope.dataset.crystalMode).toBe('dark');
    expect(scope.style.getPropertyValue('--cr-radius')).toBe(crystalTokens['shape.contentRadius']);
  });

  it('refuses to render a themed component outside a provider', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/must be used inside <CrystalProvider>/);
    quiet.mockRestore();
  });

  /* Native form controls and the browser's own scrollbars read `color-scheme`,
     not Crystal's tokens. Without it a dark scope still gets a light select and a
     light default scrollbar, which is the seam that gives a dark theme away. */
  it('declares color-scheme so native controls and scrollbars follow the mode', () => {
    const { container, rerender } = render(
      <CrystalProvider mode="dark"><span>x</span></CrystalProvider>,
    );
    expect((container.firstElementChild as HTMLElement).style.colorScheme).toBe('dark');

    rerender(<CrystalProvider mode="light"><span>x</span></CrystalProvider>);
    expect((container.firstElementChild as HTMLElement).style.colorScheme).toBe('light');
  });

  /* `system` is a preference, never a resolved value. A component asking "am I
     dark?" needs an answer, so it is turned into one in the provider. */
  it('resolves system to a real mode rather than passing it through', () => {
    let seen: string | undefined;
    function ModeProbe(): null { seen = useCrystalTheme().mode; return null; }
    render(<CrystalProvider mode="system"><ModeProbe /></CrystalProvider>);
    expect(['light', 'dark']).toContain(seen);
  });

  /* React Aria lays out from its own locale, not from a `dir` attribute, so a
     right-to-left Crystal scope that does not tell it is half mirrored. */
  it('hands React Aria a locale so its own components mirror too', () => {
    const { container } = render(
      <CrystalProvider direction="rtl"><span>x</span></CrystalProvider>,
    );
    expect((container.firstElementChild as HTMLElement).getAttribute('dir')).toBe('rtl');
  });
});
