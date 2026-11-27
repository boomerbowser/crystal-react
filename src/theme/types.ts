/* The shape of a Prismata theme.
 *
 * Every range and choice here is Prismata's. The values are validated at
 * runtime by `@prismata/core/core/preferences`, whose clamps are contract:
 * "a product that lets a preference drift outside these ranges is no longer
 * rendering Prismata". These types catch the same mistake at compile time.
 */

/** The six brand palettes. Status colours are independent of all of them. */
export type PrismataPalette = 'prism' | 'fuchsia' | 'cobalt' | 'ion' | 'amethyst' | 'harbor';

export type PrismataMode = 'light' | 'dark';

/**
 * What a product may ask for: the two resolved modes and `system`.
 * `system` follows `prefers-color-scheme`; the resolved theme is always `light`
 * or `dark`, because a component asking "am I dark?" needs an answer.
 */
export type PrismataModePreference = PrismataMode | 'system';

/** `comfortable` is Prismata's default; `compact` tightens spacing, never targets. */
export type PrismataDensity = 'comfortable' | 'compact';

export type PrismataDirection = 'ltr' | 'rtl';

/**
 * The reading face. `manrope` is Prismata's own; `system` hands typography to the
 * operating system's UI face, which is what a reader who has configured one
 * expects and what some embedded contexts require.
 *
 * Prismata supports this: `preferences.js` clamps `font` to these two and the
 * resolver branches `--pr-font` on it. The provider has to forward it, or every
 * product renders Manrope whatever it asks for.
 */
export type PrismataTypeface = 'manrope' | 'system';

/**
 * How much optical effect a surface may use.
 *
 * - `full`: diffusion, grain, rims and the optical layer.
 * - `opaque`: the product-level fallback, with flat fills and no diffusion. A
 *   stored preference, distinct from the operating system asking for the same
 *   thing through `prefers-reduced-transparency`, which is honoured separately
 *   and automatically.
 */
export type PrismataEffects = 'full' | 'opaque';

export interface PrismataThemeValues {
  palette: PrismataPalette;
  mode: PrismataMode;
  density: PrismataDensity;
  direction: PrismataDirection;
  effects: PrismataEffects;
  /** Percentage of contextual colour in Plastic. Prismata's range is 15 to 90. */
  atmosphere: number;
  /** Frost's base tint percentage. Prismata's range is 35 to 85. */
  translucency: number;
  /** Shadow scale percentage. Prismata's range is 60 to 150. */
  elevation: number;
  /** Content corner radius in px. Prismata's range is 14 to 28. Actions stay pills. */
  radius: number;
  /** Playback multiplier, 0.25 to 2. Durations are divided by it and capped at 5s. */
  motionSpeed: number;
  /** When true, spatial movement is removed and state feedback is kept. */
  reduceMotion: boolean;
  /** Prismata's own face, or the operating system's. */
  font: PrismataTypeface;
}

export type PrismataThemeInput = Partial<Omit<PrismataThemeValues, 'mode'>> & {
  /** `system` follows the operating system; the resolved value is never `system`. */
  mode?: PrismataModePreference;
};

export interface PrismataTheme extends PrismataThemeValues {
  /**
   * Resolve a base duration in milliseconds against the current motion speed.
   * Reduced motion resolves to zero: the state change still happens and the
   * movement does not. The result is capped at Prismata's 5000ms ceiling so
   * slowing playback cannot strand someone inside a long transition.
   */
  resolveDuration: (baseMs: number) => number;
}
