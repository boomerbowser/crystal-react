'use client';

/* The Crystal theme provider.
 *
 * Three jobs, and deliberately no more: hold the resolved theme, publish it to
 * CSS as custom properties on a scope element, and make it readable from hooks.
 *
 * It does not re-derive any Crystal rule. Normalisation, clamps, choices and
 * duration resolution come from `@crystal/core/core/preferences`, whose
 * ranges are contract — CONTRACT §1 says to reuse the resolver's arithmetic
 * rather than reimplement it, "because two implementations of the same formula
 * will diverge".
 *
 * Scoping is by element, not by document. A nested provider writes its custom
 * properties onto its own wrapper, so a dark island inside a light page needs no
 * second root and no portal gymnastics. That also makes the provider safe to
 * render more than once, which Storybook and visual tests both do.
 */
import {
  createContext, useContext, useEffect, useMemo, useId, useState,
  type ReactNode, type CSSProperties, type JSX,
} from 'react';
import { I18nProvider } from 'react-aria-components';
import { UNSAFE_PortalProvider } from 'react-aria';
import preferences from '@crystal/core/core/preferences';
import resolver from '@crystal/core/resolver';
import crystalFlat from '@crystal/core/flat' with { type: 'json' };
import type {
  CrystalTheme, CrystalThemeInput, CrystalThemeValues, CrystalDirection, CrystalMode,
} from './types.js';
import { usePreferredMode, usePrefersReducedTransparency, useForcedColors } from './usePreferredScheme.js';

const core = preferences;

/* Crystal's own defaults and palette list, not a second copy of them. Passing
   `palettes` is what makes an unknown palette name fall back to the default
   rather than being written into the DOM as-is. */
const CRYSTAL_DEFAULTS = {
  ...(crystalFlat as { default: Record<string, unknown>; palettes: Record<string, unknown> }).default,
  palettes: (crystalFlat as { palettes: Record<string, unknown> }).palettes,
};

/** Crystal's own ranges and choices, re-exported so consumers need not guess. */
export const crystalRanges = core.RANGES;
export const crystalChoices = core.CHOICES;

const CrystalThemeContext = createContext<CrystalTheme | null>(null);

function resolveTheme(
  input: CrystalThemeInput,
  inherited: CrystalTheme | null,
  system: { mode: CrystalMode; reducedTransparency: boolean; forcedColors: boolean },
): CrystalTheme {
  /* `system` is a preference, never a resolved value: a component asking "am I
     dark?" needs an answer, so it is turned into one here and nowhere else.
   *
   * It is opt-in, deliberately. Making an unset provider follow the operating
   * system would change the default appearance of every existing consumer, and
   * Crystal's own `default.mode` token says `light`. The catalogue agrees — it
   * says the theme provider "respects the system preference *when set to
   * system*". */
  const requestedMode = input.mode;
  const mode: CrystalMode | undefined = requestedMode === 'system' ? system.mode
    : requestedMode;
  const merged = { ...(inherited ?? {}), ...input, ...(mode ? { mode } : {}) };
  /* Crystal normalises and clamps; anything it does not recognise it replaces
     with the documented default, so an out-of-range value cannot reach CSS. */
  const normalised = core.normalisePreferences(
    merged as Record<string, unknown>,
    CRYSTAL_DEFAULTS,
  ) as unknown as CrystalThemeValues;

  const direction: CrystalDirection = input.direction ?? inherited?.direction ?? 'ltr';
  /* `effects` is a Crystal preference under the name `reduced`, which is a
     boolean. Translating here keeps the public API legible without inventing a
     second concept. */
  /* The operating system asking for less transparency is not the same thing as a
     product preference for it, but it must win the same way: a product that has
     never thought about the setting still honours it. An explicit `effects` prop
     is the one thing that may ask for more than the system does — and it cannot,
     because the system's answer is checked first. Forced colours is beyond both:
     the operating system is painting, and every translucent surface is already
     being replaced. */
  const effects = system.reducedTransparency || system.forcedColors
    ? 'opaque' as const
    : input.effects
      ?? inherited?.effects
      ?? ((normalised as unknown as { reduced?: boolean }).reduced ? 'opaque' : 'full');

  const values: CrystalThemeValues = { ...normalised, direction, effects };

  return {
    ...values,
    resolveDuration: (baseMs: number) => core.resolveDuration(baseMs, values.motionSpeed, values.reduceMotion),
  };
}

/** The custom properties a scope publishes.
 *
 * All of them, resolved by Crystal's own resolver rather than left to a
 * stylesheet. This used to publish only the numeric preferences, on the
 * assumption that colours arrived from `crystal-theme.css` keyed off
 * `data-crystal-palette` and `data-crystal-mode` — and that stylesheet defines
 * neither selector. It is a single palette at `:root`, so a scope asking for
 * Harbor in dark mode silently rendered Prism in light: the provider's own claim
 * that a dark island needs no second root was false, and every palette and mode
 * control in Storybook changed an attribute and nothing else.
 *
 * `resolve` is Crystal's arithmetic, imported rather than reimplemented, which is
 * what CONTRACT §1 asks for and the reason the resolver became importable. */
function scopeStyle(theme: CrystalThemeValues): CSSProperties {
  const resolved = resolver.resolve(
    {
      palette: theme.palette,
      mode: theme.mode,
      atmosphere: theme.atmosphere,
      translucency: theme.translucency,
      elevation: theme.elevation,
      radius: theme.radius,
      density: theme.density,
      reduced: theme.effects === 'opaque',
      reduceMotion: theme.reduceMotion,
      motionSpeed: theme.motionSpeed,
    },
    theme.mode,
  );

  return {
    ...resolved,
    '--cr-atmosphere': `${theme.atmosphere}`,
    '--cr-translucency': `${theme.translucency}`,
    '--cr-elevation': `${theme.elevation}`,
    '--cr-radius': `${theme.radius}px`,
    '--cr-motion-speed': `${theme.motionSpeed}`,
    '--cr-motion-enabled': theme.reduceMotion ? '0' : '1',
    /* Native controls and the browser's own scrollbars read `color-scheme`, not
       Crystal's tokens. Without it a dark Crystal scope still gets a light form
       control and a light default scrollbar, which is the seam that gives a dark
       theme away. */
    colorScheme: theme.mode,
    /* `color` and the family are inherited properties, and publishing the tokens
       does not set them — a scope's descendants would take whatever ink the
       document above had. That showed up first on an overlay: a Harbor dark
       calendar drew Prism light's near-black text on its own dark surface. A
       scope paints its own ink for the same reason it declares its own
       colour-scheme. */
    color: 'var(--cr-text)',
    fontFamily: 'var(--cr-font)',
  } as CSSProperties;
}

export interface CrystalProviderProps extends CrystalThemeInput {
  /**
   * BCP-47 locale for React Aria's formatting and collation — dates, numbers,
   * calendars, sorting. Given one, its direction wins over `direction`, because a
   * locale is a stronger statement than a layout flag.
   *
   * Without one the locale is derived from `direction`, so a product that only
   * ever said "this page is right-to-left" still gets React Aria laying out
   * right-to-left rather than only the CSS.
   */
  locale?: string;
  children?: ReactNode;
  /** Rendered element for the scope. Defaults to a `div`. */
  as?: 'div' | 'section' | 'main' | 'body';
  className?: string;
  style?: CSSProperties;
}

/* Where overlays go.
 *
 * React Aria portals a popover, a modal or a tooltip to `document.body`, which is
 * outside the scope element — so none of the scope's custom properties reach it
 * and every overlay resolved `:root` instead. A Harbor dark page opened a Prism
 * light menu, and `backdrop-filter: blur(var(--cr-frost-blur))` was invalid at
 * computed-value time because the variable did not exist there, so the Frost
 * material lost its diffusion entirely and the page showed straight through.
 *
 * The fix is a sibling of the scope rather than a child of it: a container
 * appended to `body` carrying the same attributes and the same resolved
 * properties. A child would inherit correctly and be clipped by any ancestor with
 * `overflow: hidden`, which is what portalling exists to avoid.
 */
function useThemedPortal(
  attributes: Record<string, string | undefined>,
  style: CSSProperties,
): HTMLElement | null {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const element = document.createElement('div');
    element.dataset['crystalOverlays'] = 'true';
    document.body.append(element);
    setContainer(element);
    return () => { element.remove(); };
  }, []);

  useEffect(() => {
    if (!container) return;
    for (const [name, value] of Object.entries(attributes)) {
      if (value === undefined) container.removeAttribute(name);
      else container.setAttribute(name, value);
    }
    for (const [name, value] of Object.entries(style)) {
      if (name.startsWith('--')) container.style.setProperty(name, String(value));
      else container.style.setProperty(
        name.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`),
        String(value),
      );
    }
  }, [container, attributes, style]);

  return container;
}

export function CrystalProvider(props: CrystalProviderProps): JSX.Element {
  const { children, as: Element = 'div', className, style, locale, ...input } = props;
  const inherited = useContext(CrystalThemeContext);
  /* A stable id per provider, so nested scopes are distinguishable in the DOM
     and in a screenshot diff without relying on render order. */
  const scopeId = useId();

  const systemMode = usePreferredMode();
  const reducedTransparency = usePrefersReducedTransparency();
  const forcedColors = useForcedColors();

  const theme = useMemo(
    () => resolveTheme(input, inherited, {
      mode: systemMode, reducedTransparency, forcedColors,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      input.palette, input.mode, input.density, input.direction, input.effects,
      input.atmosphere, input.translucency, input.elevation, input.radius,
      input.motionSpeed, input.reduceMotion, inherited,
      systemMode, reducedTransparency, forcedColors,
    ],
  );

  const resolved = scopeStyle(theme);
  const scopeAttributes = useMemo(() => ({
    'data-crystal-scope': scopeId,
    'data-crystal-palette': theme.palette,
    'data-crystal-mode': theme.mode,
    'data-crystal-density': theme.density,
    'data-effects': theme.effects === 'opaque' ? 'opaque' : undefined,
    dir: theme.direction,
  }), [scopeId, theme.palette, theme.mode, theme.density, theme.effects, theme.direction]);

  const overlayContainer = useThemedPortal(scopeAttributes, resolved);

  return (
    <CrystalThemeContext.Provider value={theme}>
      {/* React Aria needs the direction too, or its own components lay out
          left-to-right inside a right-to-left scope — a `dir` attribute is not
          something a JavaScript layout calculation reads. */}
      <I18nProvider locale={locale ?? (theme.direction === 'rtl' ? 'ar' : 'en')}>
      {/* Overlays go to a themed sibling of the scope rather than to a bare
          `body`, so a popover carries the palette, the mode and the material of
          the scope that opened it. */}
      <UNSAFE_PortalProvider getContainer={() => overlayContainer}>
      <Element
        {...scopeAttributes}
        className={className}
        style={{ ...resolved, ...style }}
      >
        {children}
      </Element>
      </UNSAFE_PortalProvider>
      </I18nProvider>
    </CrystalThemeContext.Provider>
  );
}

/**
 * Read the resolved theme.
 *
 * Throws rather than returning a default, because a component silently rendering
 * with un-themed values is the failure mode that produces "it looks nothing like
 * the design system" bug reports.
 */
export function useCrystalTheme(): CrystalTheme {
  const theme = useContext(CrystalThemeContext);
  if (!theme) {
    throw new Error(
      'useCrystalTheme must be used inside <CrystalProvider>. '
      + 'Wrap your application once at the root, or wrap the subtree that needs its own scope.',
    );
  }
  return theme;
}

/** The theme if there is one, `null` if not — for code that must work either way. */
export function useOptionalCrystalTheme(): CrystalTheme | null {
  return useContext(CrystalThemeContext);
}
