'use client';

/* The Crystal theme provider.
 *
 * Three jobs, and deliberately no more: hold the resolved theme, publish it to
 * CSS as custom properties on a scope element, and make it readable from hooks.
 *
 * It does not re-derive any Crystal rule. Normalisation, clamps, choices and
 * duration resolution come from `@meridian/crystal/core/preferences`, whose
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
  createContext, useContext, useMemo, useId,
  type ReactNode, type CSSProperties, type JSX,
} from 'react';
import preferences from '@meridian/crystal/core/preferences';
import crystalFlat from '@meridian/crystal/flat' with { type: 'json' };
import type {
  CrystalTheme, CrystalThemeInput, CrystalThemeValues, CrystalDirection,
} from './types.js';

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

/* Ambient is not part of Crystal's stored preferences — it is a document-level
   switch in the web preview — so it is defaulted here and carried alongside. */
const AMBIENT_DEFAULT = true;

function resolveTheme(input: CrystalThemeInput, inherited: CrystalTheme | null): CrystalTheme {
  const merged = { ...(inherited ?? {}), ...input };
  /* Crystal normalises and clamps; anything it does not recognise it replaces
     with the documented default, so an out-of-range value cannot reach CSS. */
  const normalised = core.normalisePreferences(
    merged as Record<string, unknown>,
    CRYSTAL_DEFAULTS,
  ) as unknown as CrystalThemeValues;

  const direction: CrystalDirection = input.direction ?? inherited?.direction ?? 'ltr';
  const ambient = input.ambient ?? inherited?.ambient ?? AMBIENT_DEFAULT;
  /* `effects` is a Crystal preference under the name `reduced`, which is a
     boolean. Translating here keeps the public API legible without inventing a
     second concept. */
  const effects = input.effects
    ?? inherited?.effects
    ?? ((normalised as unknown as { reduced?: boolean }).reduced ? 'opaque' : 'full');

  const values: CrystalThemeValues = { ...normalised, direction, ambient, effects };

  return {
    ...values,
    resolveDuration: (baseMs: number) => core.resolveDuration(baseMs, values.motionSpeed, values.reduceMotion),
  };
}

/** The custom properties a scope publishes. Colours come from Crystal's own
 *  stylesheet, keyed off `data-crystal-palette` and `data-crystal-mode`; what is
 *  written here is only what varies numerically. */
function scopeStyle(theme: CrystalThemeValues): CSSProperties {
  return {
    '--cr-atmosphere': `${theme.atmosphere}`,
    '--cr-translucency': `${theme.translucency}`,
    '--cr-elevation': `${theme.elevation}`,
    '--cr-radius': `${theme.radius}px`,
    '--cr-motion-speed': `${theme.motionSpeed}`,
    '--cr-motion-enabled': theme.reduceMotion ? '0' : '1',
  } as CSSProperties;
}

export interface CrystalProviderProps extends CrystalThemeInput {
  children?: ReactNode;
  /** Rendered element for the scope. Defaults to a `div`. */
  as?: 'div' | 'section' | 'main' | 'body';
  className?: string;
  style?: CSSProperties;
}

export function CrystalProvider(props: CrystalProviderProps): JSX.Element {
  const { children, as: Element = 'div', className, style, ...input } = props;
  const inherited = useContext(CrystalThemeContext);
  /* A stable id per provider, so nested scopes are distinguishable in the DOM
     and in a screenshot diff without relying on render order. */
  const scopeId = useId();

  const theme = useMemo(
    () => resolveTheme(input, inherited),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      input.palette, input.mode, input.density, input.direction, input.effects,
      input.atmosphere, input.translucency, input.elevation, input.radius,
      input.motionSpeed, input.reduceMotion, input.ambient, inherited,
    ],
  );

  return (
    <CrystalThemeContext.Provider value={theme}>
      <Element
        data-crystal-scope={scopeId}
        data-crystal-palette={theme.palette}
        data-crystal-mode={theme.mode}
        data-crystal-density={theme.density}
        data-effects={theme.effects === 'opaque' ? 'opaque' : undefined}
        data-ambient={theme.ambient ? undefined : 'off'}
        dir={theme.direction}
        className={className}
        style={{ ...scopeStyle(theme), ...style }}
      >
        {children}
      </Element>
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
