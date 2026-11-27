'use client';

/* The Prismata theme provider.
 *
 * It has three jobs and takes on no others: hold the resolved theme, publish it
 * to CSS as custom properties on a scope element, and make it readable from
 * hooks.
 *
 * It does not re-derive any Prismata rule. Normalisation, clamps, choices and
 * duration resolution come from `@prismata/core/core/preferences`, whose
 * ranges are contract. CONTRACT §1 says to reuse the resolver's arithmetic
 * rather than reimplement it, "because two implementations of the same formula
 * will diverge".
 *
 * Scoping is by element. A nested provider writes its custom properties onto
 * its own wrapper, so a dark island inside a light page needs no second root
 * and no portal workaround. That also makes the provider safe to render more
 * than once, which Storybook and visual tests both do.
 */
import {
  createContext, useContext, useEffect, useMemo, useId, useRef, useState,
  type ReactNode, type CSSProperties, type JSX,
} from 'react';
import { I18nProvider } from 'react-aria-components';
import { UNSAFE_PortalProvider } from 'react-aria';
import preferences from '@prismata/core/core/preferences';
import modality from '@prismata/core/core/modality';
import resolver from '@prismata/core/resolver';
import prismataFlat from '@prismata/core/flat' with { type: 'json' };
import type {
  PrismataTheme, PrismataThemeInput, PrismataThemeValues, PrismataDirection, PrismataMode,
} from './types.js';
import { usePreferredMode, usePrefersReducedTransparency, useForcedColors, usePrefersReducedMotion } from './usePreferredScheme.js';

const core = preferences;

/* Prismata's own defaults and palette list, used directly so that no second copy
   exists. Passing `palettes` makes an unknown palette name fall back to the
   default instead of being written into the DOM as given. */
const PRISMATA_DEFAULTS = {
  ...(prismataFlat as { default: Record<string, unknown>; palettes: Record<string, unknown> }).default,
  palettes: (prismataFlat as { palettes: Record<string, unknown> }).palettes,
};

/** Prismata's own ranges and choices, re-exported so consumers need not guess. */
export const prismataRanges = core.RANGES;
export const prismataChoices = core.CHOICES;

const PrismataThemeContext = createContext<PrismataTheme | null>(null);

function resolveTheme(
  input: PrismataThemeInput,
  inherited: PrismataTheme | null,
  system: { mode: PrismataMode; reducedTransparency: boolean; forcedColors: boolean; reducedMotion: boolean },
): PrismataTheme {
  /* `system` is a preference, never a resolved value. A component asking "am I
     dark?" needs an answer, so `system` is resolved to a mode here and only
     here.
   *
   * It is opt-in by decision. Making an unset provider follow the operating
   * system would change the default appearance of every existing consumer, and
   * Prismata's own `default.mode` token says `light`. The catalogue agrees: it
   * says the theme provider "respects the system preference *when set to
   * system*". */
  const requestedMode = input.mode;
  const mode: PrismataMode | undefined = requestedMode === 'system' ? system.mode
    : requestedMode;
  const merged = { ...(inherited ?? {}), ...input, ...(mode ? { mode } : {}) };
  /* Prismata normalises and clamps; anything it does not recognise it replaces
     with the documented default, so an out-of-range value cannot reach CSS. */
  const normalised = core.normalisePreferences(
    merged as Record<string, unknown>,
    PRISMATA_DEFAULTS,
  ) as unknown as PrismataThemeValues;

  const direction: PrismataDirection = input.direction ?? inherited?.direction ?? 'ltr';
  /* `effects` is a Prismata preference under the name `reduced`, which is a
     boolean. Translating here keeps the public API legible without inventing a
     second concept. */
  /* A request from the operating system for less transparency is separate from
     a product preference for it, and it wins the same way, so a product that
     never set the preference still honours it. The system's answer is checked
     first, so an explicit `effects` prop cannot ask for more than the system
     allows. Forced colours wins over both: the operating system is painting,
     and every translucent surface is already being replaced. */
  const effects = system.reducedTransparency || system.forcedColors
    ? 'opaque' as const
    : input.effects
      ?? inherited?.effects
      ?? ((normalised as unknown as { reduced?: boolean }).reduced ? 'opaque' : 'full');

  /* The same rule for movement. Every recipe this library plays runs in script,
     and script does not see a media query unless it asks. Without this, with the
     operating system set to reduce motion, a button's press plays in full while
     the CSS-driven indicators beside it stand still. Prismata's accessibility
     chapter says reduced motion is honoured by every recipe, so the system's
     answer wins here as it does for reduced transparency: a product preference
     can ask for less movement than the system, never for more. */
  const reduceMotion = system.reducedMotion || normalised.reduceMotion;

  const values: PrismataThemeValues = { ...normalised, reduceMotion, direction, effects };

  return {
    ...values,
    resolveDuration: (baseMs: number) => core.resolveDuration(baseMs, values.motionSpeed, values.reduceMotion),
  };
}

/** The custom properties a scope publishes.
 *
 * All of them, colours included, are resolved by Prismata's own resolver and
 * written onto the scope. `prismata-theme.css` cannot supply the colours: it is
 * a single palette at `:root` and defines no selector for
 * `data-prismata-palette` or `data-prismata-mode`. A scope that published only
 * the numeric preferences and asked for Harbor in dark mode would silently
 * render Prism in light, and a palette or mode control would change an
 * attribute and nothing else.
 *
 * `resolve` is Prismata's arithmetic, imported as CONTRACT §1 asks. The resolver
 * is importable for that reason. */
function scopeStyle(theme: PrismataThemeValues): CSSProperties {
  const resolved = resolver.resolve(
    {
      palette: theme.palette,
      mode: theme.mode,
      atmosphere: theme.atmosphere,
      translucency: theme.translucency,
      elevation: theme.elevation,
      radius: theme.radius,
      density: theme.density,
      /* Must be forwarded. Prismata's resolver branches `--pr-font` on this and
         `preferences.js` clamps it to `manrope` or `system`. If it is left out,
         a product that asks for the system face is given Manrope, with no error
         and nothing to see in a test. */
      font: theme.font,
      reduced: theme.effects === 'opaque',
      reduceMotion: theme.reduceMotion,
      motionSpeed: theme.motionSpeed,
    },
    theme.mode,
  );

  return {
    ...resolved,
    '--pr-atmosphere': `${theme.atmosphere}`,
    '--pr-translucency': `${theme.translucency}`,
    '--pr-elevation': `${theme.elevation}`,
    '--pr-radius': `${theme.radius}px`,
    '--pr-motion-speed': `${theme.motionSpeed}`,
    '--pr-motion-enabled': theme.reduceMotion ? '0' : '1',
    /* Native controls and the browser's own scrollbars read `color-scheme`, not
       Prismata's tokens. Without it a dark Prismata scope still gets a light form
       control and a light default scrollbar. */
    colorScheme: theme.mode,
    /* `color` and the family are inherited properties, and publishing the tokens
       does not set them, so a scope's descendants would take whatever ink the
       document above had. On an overlay, a Harbor dark calendar would draw
       Prism light's near-black text on its own dark surface. A scope paints its
       own ink for the same reason it declares its own colour-scheme. */
    color: 'var(--pr-text)',
    fontFamily: 'var(--pr-font)',
  } as CSSProperties;
}

export interface PrismataProviderProps extends PrismataThemeInput {
  /**
   * BCP-47 locale for React Aria's formatting and collation: dates, numbers,
   * calendars, sorting. Given one, its direction wins over `direction`, because a
   * locale is a stronger statement than a layout flag.
   *
   * Without one the locale is derived from `direction`, so a product that only
   * ever said "this page is right-to-left" gets React Aria laying out
   * right-to-left as well as the CSS.
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
 * outside the scope element, so none of the scope's custom properties reach it
 * and an overlay there resolves `:root`. A Harbor dark page would open a Prism
 * light menu, and `backdrop-filter: blur(var(--pr-frost-blur))` would be invalid
 * at computed-value time because the variable does not exist there, so the Frost
 * material would lose its diffusion entirely and show the page straight through.
 *
 * Overlays therefore go to a sibling of the scope: a container appended to
 * `body` carrying the same attributes and the same resolved properties. A child
 * of the scope would inherit correctly but be clipped by any ancestor with
 * `overflow: hidden`, which is what portalling exists to avoid.
 */
function useThemedPortal(
  attributes: Record<string, string | undefined>,
  style: CSSProperties,
): HTMLElement | null {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  /* What this container was last given, so a property that disappears between
     palettes is taken off rather than left behind. Harbor dark declares
     `contentOwnSurface` and Prism does not; without this, switching from one to
     the other keeps Harbor's value on the overlay container for ever. */
  const written = useRef<string[]>([]);

  /* Created once per provider instance and removed when that instance goes, so
     the count of containers is the count of live scopes. By decision it does not
     depend on the theme: re-theming rewrites this element, because replacing it
     would tear down every open overlay inside it. */
  /* Focus rings only when they are needed: Prismata draws none while the
     document's modality is `pointer` (core 2.9.0). Every provider watches; the
     attribute is the document's, so a portalled overlay reads it too, and a
     second watcher writes the same value. */
  useEffect(() => (typeof document === 'undefined' ? undefined : modality.watch(document)), []);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const element = document.createElement('div');
    element.dataset['prismataOverlays'] = 'true';
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

    const next: string[] = [];
    for (const [name, value] of Object.entries(style)) {
      const property = name.startsWith('--')
        ? name
        : name.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
      container.style.setProperty(property, String(value));
      next.push(property);
    }
    for (const property of written.current) {
      if (!next.includes(property)) container.style.removeProperty(property);
    }
    written.current = next;
  }, [container, attributes, style]);

  return container;
}

export function PrismataProvider(props: PrismataProviderProps): JSX.Element {
  const { children, as: Element = 'div', className, style, locale, ...input } = props;
  const inherited = useContext(PrismataThemeContext);
  /* A stable id per provider, so nested scopes are distinguishable in the DOM
     and in a screenshot diff without relying on render order. */
  const scopeId = useId();

  const systemMode = usePreferredMode();
  const reducedTransparency = usePrefersReducedTransparency();
  const forcedColors = useForcedColors();
  const reducedMotion = usePrefersReducedMotion();

  const theme = useMemo(
    () => resolveTheme(input, inherited, {
      mode: systemMode, reducedTransparency, forcedColors, reducedMotion,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      input.palette, input.mode, input.density, input.direction, input.effects,
      input.atmosphere, input.translucency, input.elevation, input.radius,
      input.motionSpeed, input.reduceMotion, inherited,
      systemMode, reducedTransparency, forcedColors, reducedMotion,
    ],
  );

  const resolved = scopeStyle(theme);
  const scopeAttributes = useMemo(() => ({
    'data-prismata-scope': scopeId,
    'data-prismata-palette': theme.palette,
    'data-prismata-mode': theme.mode,
    'data-prismata-density': theme.density,
    'data-effects': theme.effects === 'opaque' ? 'opaque' : undefined,
    dir: theme.direction,
  }), [scopeId, theme.palette, theme.mode, theme.density, theme.effects, theme.direction]);

  const overlayContainer = useThemedPortal(scopeAttributes, resolved);

  return (
    <PrismataThemeContext.Provider value={theme}>
      {/* React Aria needs the direction too, or its own components lay out
          left-to-right inside a right-to-left scope. A JavaScript layout
          calculation does not read a `dir` attribute. */}
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
    </PrismataThemeContext.Provider>
  );
}

/**
 * Read the resolved theme.
 *
 * Throws when there is no provider. Returning a default would let a component
 * render silently with un-themed values, which produces "it looks nothing like
 * the design system" bug reports.
 */
export function usePrismataTheme(): PrismataTheme {
  const theme = useContext(PrismataThemeContext);
  if (!theme) {
    throw new Error(
      'usePrismataTheme must be used inside <PrismataProvider>. '
      + 'Wrap your application once at the root, or wrap the subtree that needs its own scope.',
    );
  }
  return theme;
}

/** The theme if there is one, `null` if not, for code that must work either way. */
export function useOptionalPrismataTheme(): PrismataTheme | null {
  return useContext(PrismataThemeContext);
}
