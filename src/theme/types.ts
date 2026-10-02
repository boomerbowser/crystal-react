/* The shape of a Crystal theme.
 *
 * Every range and choice here is Crystal's. The values are validated at
 * runtime by `@crystal-ui/core/core/preferences`, whose clamps are contract:
 * "a product that lets a preference drift outside these ranges is no longer
 * rendering Crystal". These types catch the same mistake at compile time.
 */

/** The six brand palettes. Status colours are independent of all of them. */
export type CrystalPalette = 'prism' | 'fuchsia' | 'cobalt' | 'ion' | 'amethyst' | 'harbor';

export type CrystalMode = 'light' | 'dark';

/**
 * What a product may ask for: the two resolved modes and `system`.
 * `system` follows `prefers-color-scheme`; the resolved theme is always `light`
 * or `dark`, because a component asking "am I dark?" needs an answer.
 */
export type CrystalModePreference = CrystalMode | 'system';

/** `comfortable` is Crystal's default; `compact` tightens spacing, never targets. */
export type CrystalDensity = 'comfortable' | 'compact';

export type CrystalDirection = 'ltr' | 'rtl';

/**
 * The reading face. `manrope` is Crystal's own; `system` hands typography to the
 * operating system's UI face, which is what a reader who has configured one
 * expects and what some embedded contexts require.
 *
 * Crystal supports this: `preferences.js` clamps `font` to these two and the
 * resolver branches `--cr-font` on it. The provider has to forward it, or every
 * product renders Manrope whatever it asks for.
 */
export type CrystalTypeface = 'manrope' | 'system';

/**
 * How much optical effect a surface may use.
 *
 * - `full`: diffusion, grain, rims and the optical layer.
 * - `opaque`: the product-level fallback, with flat fills and no diffusion. A
 *   stored preference, distinct from the operating system asking for the same
 *   thing through `prefers-reduced-transparency`, which is honoured separately
 *   and automatically.
 */
export type CrystalEffects = 'full' | 'opaque';

export interface CrystalThemeValues {
  palette: CrystalPalette;
  mode: CrystalMode;
  density: CrystalDensity;
  direction: CrystalDirection;
  effects: CrystalEffects;
  /** Percentage of contextual colour in Plastic. Crystal's range is 15 to 90. */
  atmosphere: number;
  /** Frost's base tint percentage. Crystal's range is 35 to 85. */
  translucency: number;
  /** Shadow scale percentage. Crystal's range is 60 to 150. */
  elevation: number;
  /** Content corner radius in px. Crystal's range is 14 to 28. Actions stay pills. */
  radius: number;
  /** Playback multiplier, 0.25 to 2. Durations are divided by it and capped at 5s. */
  motionSpeed: number;
  /** When true, spatial movement is removed and state feedback is kept. */
  reduceMotion: boolean;
  /** Crystal's own face, or the operating system's. */
  font: CrystalTypeface;
}

export type CrystalThemeInput = Partial<Omit<CrystalThemeValues, 'mode'>> & {
  /** `system` follows the operating system; the resolved value is never `system`. */
  mode?: CrystalModePreference;
};

export interface CrystalTheme extends CrystalThemeValues {
  /**
   * Resolve a base duration in milliseconds against the current motion speed.
   * Reduced motion resolves to zero: the state change still happens and the
   * movement does not. The result is capped at Crystal's 5000ms ceiling so
   * slowing playback cannot strand someone inside a long transition.
   */
  resolveDuration: (baseMs: number) => number;
}
