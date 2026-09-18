import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CrystalProvider, useCrystalTheme } from './CrystalProvider.js';
import { useColorScheme, useMotionSpeed } from './hooks.js';
import { crystalTokens } from './tokens.generated.js';
import crystalFlat from '@crystal/core/flat' with { type: 'json' };

/* Read from Crystal's own token file rather than typed in. A test asserting a
   literal hex passes forever after the palette changes underneath it — which is
   the drift these assertions exist to catch. */
const harbourDark = (crystalFlat as {
  palettes: Record<string, { modes: Record<string, Record<string, string>> }>;
}).palettes['harbor']!.modes['dark']!;

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
  /* Opt-in, deliberately: an unset provider follows Crystal's own default token
     rather than the operating system, because making it follow the OS would
     change the default appearance of every existing consumer. */
  it('follows Crystal\'s default mode until asked for the system one', () => {
    let seen: string | undefined;
    function DefaultProbe(): null { seen = useCrystalTheme().mode; return null; }
    render(<CrystalProvider><DefaultProbe /></CrystalProvider>);
    expect(seen).toBe(crystalTokens['default.mode'] ?? 'light');
  });

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

  /* The defect this test exists for: the provider published only the numeric
     preferences and assumed colours arrived from `crystal-theme.css` keyed off
     `data-crystal-palette` and `data-crystal-mode`. That stylesheet defines
     neither selector — it is one palette at `:root` — so a scope asking for
     Harbor in dark mode rendered Prism in light, and every palette and mode
     control in Storybook changed an attribute and nothing else. */
  it('publishes the resolved palette, not only the numbers', () => {
    const { container } = render(
      <CrystalProvider palette="harbor" mode="dark"><span>x</span></CrystalProvider>,
    );
    const scope = container.firstElementChild as HTMLElement;
    /* Harbor dark, from Crystal's own token file. A provider that published
       nothing would leave these empty; one that published Prism would differ. */
    expect(scope.style.getPropertyValue('--cr-canvas')).toBe(harbourDark['canvas']);
    expect(scope.style.getPropertyValue('--cr-text')).toBe(harbourDark['text']);
  });

  /* Two scopes, two palettes, at the same time — which is the claim the provider
     has made since it was written and could not keep. */
  it('lets a scope differ from the one around it', () => {
    const { container } = render(
      <CrystalProvider palette="prism" mode="light">
        <span data-testid="outer">x</span>
        <CrystalProvider palette="harbor" mode="dark"><span data-testid="inner">y</span></CrystalProvider>
      </CrystalProvider>,
    );
    const outer = container.firstElementChild as HTMLElement;
    const inner = screen.getByTestId('inner').closest('[data-crystal-scope]') as HTMLElement;
    expect(outer.style.getPropertyValue('--cr-canvas'))
      .not.toBe(inner.style.getPropertyValue('--cr-canvas'));
  });

  /* React Aria portals a popover to `document.body`, which is outside the scope
     element — so none of its custom properties reach the overlay. Every menu,
     listbox and dialog resolved `:root` instead: a Harbor dark page opened a
     Prism light menu, and `backdrop-filter: blur(var(--cr-frost-blur))` was
     invalid at computed-value time because the variable did not exist there, so
     Frost lost its diffusion entirely. The story is what showed it — the page
     was legible straight through an open calendar. */
  it('gives overlays a themed container rather than a bare body', async () => {
    render(
      <CrystalProvider palette="harbor" mode="dark"><span>x</span></CrystalProvider>,
    );

    const container = await waitFor(() => {
      const found = document.querySelector<HTMLElement>('[data-crystal-overlays]');
      expect(found).not.toBeNull();
      return found!;
    });

    /* A sibling of the scope, not a child: a child would inherit correctly and
       be clipped by any ancestor with `overflow: hidden`, which is the thing
       portalling exists to avoid. */
    expect(container.parentElement).toBe(document.body);
    expect(container.dataset['crystalPalette']).toBe('harbor');
    expect(container.dataset['crystalMode']).toBe('dark');
    expect(container.style.getPropertyValue('--cr-canvas')).toBe(harbourDark['canvas']);
    /* The one that broke the material: without it the blur is invalid at
       computed-value time and Frost renders with no diffusion at all. */
    expect(container.style.getPropertyValue('--cr-frost-blur')).toBeTruthy();
  });
});
