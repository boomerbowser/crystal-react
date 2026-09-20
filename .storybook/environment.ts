/* Crystal's "Make it yours" panel, as Storybook Controls.
 *
 * Meridian's instruction, twice: the environment options must be "available
 * per-component to test with and against", and then, with a screenshot of the
 * Tab Strip story reading *"This story has no controls"* — "this is where and
 * what we were talking about in terms of how Crystal's controls should be
 * translated to Storybook". The destination is the Controls panel.
 *
 * ## Why args rather than the toolbar
 *
 * The toolbar was the first attempt and it cannot express this panel.
 * `globalTypes` supports only a list of discrete `items`: there is no slider, no
 * swatch row and no checkbox in it. Crystal's panel is continuous — atmosphere
 * is any value from 15 to 90, not one of four — so the toolbar turned five
 * sliders into five dropdowns of three or four stops each, and a reviewer could
 * not reach 73%.
 *
 * Args render real controls, and they are per-component by construction, which
 * is what was asked for. The toolbar stays, because the two do different jobs:
 * the toolbar sweeps *one axis across many stories*, args drive *many axes on
 * one story*.
 *
 * ## Every range here comes from Crystal
 *
 * `crystalRanges` and `crystalChoices` are Crystal's own `RANGES` and `CHOICES`,
 * re-exported by this library's provider and originally from
 * `@crystal-ui/core/core/preferences`, where the clamps are contract: "a product
 * that lets a preference drift outside these ranges is no longer rendering
 * Crystal". Typing `min: 15` here would be a second copy of a number Crystal
 * owns, which is the CONTRACT §1 defect this whole library exists to avoid — and
 * it would silently stop matching the day Crystal moved a floor.
 */
import { crystalRanges, crystalChoices } from '../src/theme/CrystalProvider.js';
import crystalFlat from '@crystal-ui/core/flat' with { type: 'json' };

const PALETTES = Object.keys((crystalFlat as { palettes: Record<string, unknown> }).palettes);

const range = (
  key: keyof typeof crystalRanges,
  label: string,
  help: string,
  step = 1,
) => {
  const [min, max] = crystalRanges[key] as unknown as [number, number];
  return {
    name: label,
    description: help,
    control: { type: 'range' as const, min, max, step },
    table: { category: 'Environment', defaultValue: { summary: String(CRYSTAL_DEFAULT[key]) } },
  };
};

/* Crystal's own defaults, read from the token export rather than restated. The
   approved visual baseline was captured at exactly these values, so a slider
   that starts anywhere else quietly makes every story a variant. */
const CRYSTAL_DEFAULT = (crystalFlat as { default: Record<string, string | number | boolean> }).default;

export const environmentArgTypes = {
  palette: {
    name: 'Product palette',
    description: 'The six brand palettes. Status colours are independent of all of them.',
    control: { type: 'inline-radio' as const },
    options: PALETTES,
    table: { category: 'Environment' },
  },
  mode: {
    name: 'Appearance',
    description: '`system` follows the operating system, which is the Auto in Crystal’s own panel.',
    control: { type: 'inline-radio' as const },
    options: crystalChoices.mode,
    table: { category: 'Environment' },
  },
  atmosphere: range('atmosphere', 'Colour atmosphere',
    'How much contextual colour Plastic carries. Crystal’s materials are defined by what is behind them: at the floor, Frost has nothing to diffuse and every surface reads as a plain white rectangle.'),
  translucency: range('translucency', 'Frost base tint', 'Frost’s base tint before the atmosphere is added.'),
  elevation: range('elevation', 'Elevation', 'Scales the shadow, including Resin’s optical rims.'),
  radius: range('radius', 'Corner radius', 'The content radius. Action controls stay pills at every value.'),
  density: {
    name: 'Content density',
    description: 'Tightens spacing. It never tightens a hit target.',
    control: { type: 'inline-radio' as const },
    options: crystalChoices.density,
    table: { category: 'Environment' },
  },
  font: {
    name: 'Typeface',
    description: 'Crystal’s own face, or the operating system’s UI face.',
    control: { type: 'inline-radio' as const },
    options: crystalChoices.font,
    table: { category: 'Environment' },
  },
  motionSpeed: range('motionSpeed', 'Animation speed',
    'Divides every duration. Nothing moves at rest in Crystal, so this is only visible once something is started.', 0.05),
  reduceMotion: {
    name: 'Reduce motion',
    description: 'Removes spatial movement and keeps state feedback. Not the same as stopping animation.',
    control: { type: 'boolean' as const },
    table: { category: 'Environment' },
  },
  /* Two separate axes that the toolbar conflated into one, and the distinction
     is not pedantic: they have different owners and a product can only set one
     of them.

     `effects: opaque` is a *product* preference — this application has decided
     not to use diffusion. `prefers-reduced-transparency` is a *viewer*
     preference, read from the operating system, and it wins over whatever the
     product asked for. Offering only the first and labelling it the second means
     a reviewer cannot see what a viewer who set the system preference actually
     gets.

     What this control can and cannot do is worth being exact about. It drives
     the provider, so everything resolved in JavaScript is real. It cannot
     satisfy the `@media (prefers-reduced-transparency: reduce)` blocks in the
     stylesheets, because a decorator cannot make a media query true. Those are
     covered by `scripts/verify-behaviour.mjs`, which emulates the feature in a
     real browser — the only place that branch can honestly be tested. */
  effects: {
    name: 'Optical effects (product)',
    description: '`opaque` is the product’s own fallback: flat fills, no diffusion.',
    control: { type: 'inline-radio' as const },
    options: ['full', 'opaque'],
    table: { category: 'Environment' },
  },
  reduceTransparency: {
    name: 'Reduce transparency (viewer)',
    description: 'Simulates the operating-system preference, which overrides the product’s choice the way the real one does — it forces opaque effects whatever `effects` says. The stylesheets’ own `@media (prefers-reduced-transparency: reduce)` branch cannot be made true from a decorator; that half is emulated in a real browser by `verify-behaviour`.',
    control: { type: 'boolean' as const },
    table: { category: 'Environment' },
  },
  direction: {
    name: 'Text direction',
    control: { type: 'inline-radio' as const },
    options: ['ltr', 'rtl'],
    table: { category: 'Environment' },
  },
  ground: {
    name: 'Story ground',
    description: '`plastic` is Crystal’s foundation. `canvas` is a flat ground, which is what this Storybook used to show against — and why Meridian reported that none of the components looked like Crystal.',
    control: { type: 'inline-radio' as const },
    options: ['plastic', 'canvas'],
    table: { category: 'Environment' },
  },
};

/** Crystal's defaults, which is what the approved baseline was captured at. */
export const environmentArgs = {
  palette: CRYSTAL_DEFAULT['palette'] as string,
  mode: CRYSTAL_DEFAULT['mode'] as string,
  atmosphere: CRYSTAL_DEFAULT['atmosphere'] as number,
  translucency: CRYSTAL_DEFAULT['translucency'] as number,
  elevation: CRYSTAL_DEFAULT['elevation'] as number,
  radius: CRYSTAL_DEFAULT['radius'] as number,
  density: CRYSTAL_DEFAULT['density'] as string,
  font: CRYSTAL_DEFAULT['font'] as string,
  motionSpeed: CRYSTAL_DEFAULT['motionSpeed'] as number,
  reduceMotion: CRYSTAL_DEFAULT['reduceMotion'] as boolean,
  effects: 'full',
  reduceTransparency: false,
  direction: 'ltr',
  ground: 'plastic',
};

/** The keys the decorator consumes, so a render can strip them from its props. */
export const ENVIRONMENT_KEYS = Object.keys(environmentArgs) as (keyof typeof environmentArgs)[];

/**
 * A story's own args, with the shared environment removed.
 *
 * Every story carries the fourteen environment args so the Controls panel has
 * something to show. Storybook's default render spreads args straight onto the
 * component, so without this a `Button` would be handed `atmosphere={90}` and
 * React Aria would forward it to the DOM — "React does not recognize the
 * `motionSpeed` prop on a DOM element", once per control, in every story.
 *
 *     render: (args) => <Tabs {...only(args)} />
 *
 * Explicit at each call rather than hidden in a decorator, because a decorator
 * cannot change what a story's own render receives, and pretending otherwise is
 * how the props would leak back in the first time somebody wrote a new story.
 */
export function only<T extends object>(args: T): T {
  const out = { ...args } as Record<string, unknown>;
  for (const key of ENVIRONMENT_KEYS) delete out[key];
  return out as T;
}
