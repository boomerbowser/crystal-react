/* The shape of a Crystal theme.
 *
 * Every range and choice here is Crystal's, not this library's. The values are
 * validated at runtime by `@crystal/core/core/preferences`, whose clamps are
 * contract rather than defensive coding: "a product that lets a preference drift
 * outside these ranges is no longer rendering Crystal". These types exist so the
 * same mistake is caught at compile time instead.
 */

/** The six brand palettes. Status colours are independent of all of them. */
export type CrystalPalette = 'prism' | 'fuchsia' | 'cobalt' | 'ion' | 'amethyst' | 'harbor';

export type CrystalMode = 'light' | 'dark';

/**
 * What a product may ask for, which is one more thing than what resolves.
 * `system` follows `prefers-color-scheme`; the resolved theme is always `light`
 * or `dark`, because a component asking "am I dark?" needs an answer.
 */
export type CrystalModePreference = CrystalMode | 'system';

/** `comfortable` is Crystal's default; `compact` tightens spacing, never targets. */
export type CrystalDensity = 'comfortable' | 'compact';

export type CrystalDirection = 'ltr' | 'rtl';

/**
 * How much optical effect a surface may use.
 *
 * - `full` — diffusion, grain, rims and the optical layer.
 * - `opaque` — the product-level fallback: flat fills, no diffusion. A stored
 *   preference, distinct from the operating system asking for the same thing
 *   through `prefers-reduced-transparency`, which is honoured separately and
 *   automatically.
 */
export type CrystalEffects = 'full' | 'opaque';

export interface CrystalThemeValues {
  palette: CrystalPalette;
  mode: CrystalMode;
  density: CrystalDensity;
  direction: CrystalDirection;
  effects: CrystalEffects;
  /** Percentage of contextual colour in Plastic. Crystal's range is 15–90. */
  atmosphere: number;
  /** Frost's base tint percentage. Crystal's range is 35–85. */
  translucency: number;
  /** Shadow scale percentage. Crystal's range is 60–150. */
  elevation: number;
  /** Content corner radius in px. Crystal's range is 14–28. Actions stay pills. */
  radius: number;
  /** Playback multiplier, 0.25–2. Durations are divided by it and capped at 5s. */
  motionSpeed: number;
  /** When true, spatial movement is removed and state feedback is kept. */
  reduceMotion: boolean;
}

export type CrystalThemeInput = Partial<Omit<CrystalThemeValues, 'mode'>> & {
  /** `system` follows the operating system; the resolved value is never `system`. */
  mode?: CrystalModePreference;
};

export interface CrystalTheme extends CrystalThemeValues {
  /**
   * Resolve a base duration in milliseconds against the current motion speed.
   * Reduced motion resolves to zero — the state change still happens, the
   * movement does not — and the result is capped at Crystal's 5000ms ceiling so
   * slowing playback cannot strand someone inside a long transition.
   */
  resolveDuration: (baseMs: number) => number;
}
