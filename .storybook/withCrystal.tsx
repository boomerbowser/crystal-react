import type { Decorator } from '@storybook/react-vite';
import { CrystalProvider } from '../src/theme/CrystalProvider.js';
import type {
  CrystalDensity, CrystalDirection, CrystalEffects, CrystalMode, CrystalPalette,
} from '../src/theme/types.js';

/* The environment, as toolbar controls.
 *
 * Every adjustable value in Crystal's own "Make it yours" panel, in the same
 * order and with the same defaults: palette, appearance, colour atmosphere,
 * Frost base tint, elevation, corner radius, density, direction, animation speed,
 * reduced motion and reduced effects — plus the ground the story stands on.
 *
 * They are environment rather than per-story args on purpose: a reviewer should
 * be able to take any story through dark mode, compact density, right-to-left,
 * reduced effects or a flat foundation without the story's author having thought
 * to offer it. Most regressions in this system have been found on an axis nobody
 * was looking at — and the flat foundation hid the material hierarchy in every
 * story in the library until Meridian said so.
 */
export const crystalGlobalTypes = {
  palette: {
    description: 'Brand palette',
    toolbar: {
      icon: 'paintbrush',
      items: ['prism', 'fuchsia', 'cobalt', 'ion', 'amethyst', 'harbor'],
      dynamicTitle: true,
    },
  },
  mode: {
    description: 'Light or dark',
    toolbar: { icon: 'mirror', items: ['light', 'dark'], dynamicTitle: true },
  },
  density: {
    description: 'Spacing density',
    toolbar: { icon: 'component', items: ['comfortable', 'compact'], dynamicTitle: true },
  },
  direction: {
    description: 'Text direction',
    toolbar: { icon: 'transfer', items: ['ltr', 'rtl'], dynamicTitle: true },
  },
  effects: {
    description: 'Optical effects',
    toolbar: { icon: 'contrast', items: ['full', 'opaque'], dynamicTitle: true },
  },
  reduceMotion: {
    description: 'Reduced motion',
    toolbar: { icon: 'play', items: ['false', 'true'], dynamicTitle: true },
  },
  /* The adjustable scheme values, and the reason they belong in the toolbar
     rather than in a story's args.
     
     Crystal's materials are defined by what is *behind* them. Frost diffuses the
     foundation; Resin transmits its colour; Haze fills over it. Shown against a
     flat canvas they all render as white, the hierarchy disappears, and every
     control looks like a plain rounded rectangle — which is exactly what
     Meridian saw when they opened this Storybook and reported that none of the
     components looked like Crystal.
     
     Colour atmosphere is the control that fixes it, and it was a provider input
     with no way to reach it. 90% is Crystal's own default and what the approved
     baseline was captured at; 15% is the floor, and taking a story down to it is
     the quickest way to see how much of a material's appearance is the
     foundation's doing. */
  atmosphere: {
    description: 'Colour atmosphere',
    toolbar: {
      icon: 'sun',
      items: [
        { value: '90', title: 'Atmosphere 90% (Crystal default)' },
        { value: '60', title: 'Atmosphere 60%' },
        { value: '35', title: 'Atmosphere 35%' },
        { value: '15', title: 'Atmosphere 15% (floor)' },
      ],
      dynamicTitle: true,
    },
  },
  translucency: {
    description: 'Frost base tint',
    toolbar: {
      icon: 'mirror',
      items: [
        { value: '35', title: 'Frost tint 35% (Crystal default)' },
        { value: '60', title: 'Frost tint 60%' },
        { value: '85', title: 'Frost tint 85%' },
      ],
      dynamicTitle: true,
    },
  },
  elevation: {
    description: 'Elevation',
    toolbar: {
      icon: 'box',
      items: [
        { value: '125', title: 'Elevation 125% (Crystal default)' },
        { value: '100', title: 'Elevation 100%' },
        { value: '60', title: 'Elevation 60% (floor)' },
        { value: '150', title: 'Elevation 150% (ceiling)' },
      ],
      dynamicTitle: true,
    },
  },
  radius: {
    description: 'Corner radius',
    toolbar: {
      icon: 'component',
      items: [
        { value: '28', title: 'Radius 28px (Crystal default)' },
        { value: '21', title: 'Radius 21px' },
        { value: '14', title: 'Radius 14px (floor)' },
      ],
      dynamicTitle: true,
    },
  },
  motionSpeed: {
    description: 'Animation speed',
    toolbar: {
      icon: 'speed',
      items: [
        { value: '1', title: 'Speed 1× (Crystal default)' },
        { value: '0.5', title: 'Speed 0.5×' },
        { value: '0.25', title: 'Speed 0.25× (floor)' },
        { value: '2', title: 'Speed 2× (ceiling)' },
      ],
      dynamicTitle: true,
    },
  },
  ground: {
    description: 'Story ground',
    toolbar: {
      icon: 'photo',
      items: [
        { value: 'plastic', title: 'Plastic foundation (Crystal default)' },
        { value: 'canvas', title: 'Flat canvas' },
      ],
      dynamicTitle: true,
    },
  },
};

/* Crystal's own defaults, as numbers rather than as strings from a toolbar. */
const NUMBER = (value: string | number | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * A story's own environment, overriding the toolbar.
 *
 * The toolbar takes *any* story through *any* axis, which is what a reviewer
 * wants. This is the other half: a story that needs to be seen, and tested,
 * against a particular environment can pin one.
 *
 *     export const OnAFlatGround: Story = {
 *       parameters: { crystal: { ground: 'canvas', atmosphere: 15 } },
 *       render: () => <Button>Nothing to diffuse</Button>,
 *     };
 *
 * Pinning is the point for two kinds of story. One is a component whose whole
 * subject is an environment — a Frost panel at 85% tint, a control at the
 * elevation floor. The other is a browser gate: `verify-materials.mjs` opens a
 * story and measures it, and a measurement is only worth anything if the
 * environment it was taken in is fixed rather than whatever the last reviewer
 * left in the toolbar.
 *
 * Anything a story does not pin still follows the toolbar, so pinning the ground
 * does not also freeze the palette.
 */
export interface CrystalStoryEnvironment {
  palette?: CrystalPalette;
  mode?: CrystalMode;
  density?: CrystalDensity;
  direction?: CrystalDirection;
  effects?: CrystalEffects;
  reduceMotion?: boolean;
  atmosphere?: number;
  translucency?: number;
  elevation?: number;
  radius?: number;
  motionSpeed?: number;
  /** `plastic` is Crystal's foundation; `canvas` is a flat ground with no atmosphere. */
  ground?: 'plastic' | 'canvas';
}

export const withCrystal: Decorator = (Story, context) => {
  const globals = context.globals as Record<string, string>;
  const pinned = (context.parameters['crystal'] ?? {}) as CrystalStoryEnvironment;
  /* The story's own value where it has one, the toolbar's otherwise. Read per
     axis rather than as a whole object, so pinning the ground does not freeze
     the palette too. */
  const pick = <K extends keyof CrystalStoryEnvironment>(key: K): CrystalStoryEnvironment[K] | string | undefined =>
    (pinned[key] ?? globals[key]);

  const palette = pick('palette');
  const mode = pick('mode');
  const density = pick('density');
  const direction = pick('direction');
  const effects = pick('effects');
  const reduceMotion = pick('reduceMotion');
  const atmosphere = pick('atmosphere');
  const translucency = pick('translucency');
  const elevation = pick('elevation');
  const radius = pick('radius');
  const motionSpeed = pick('motionSpeed');
  const ground = pick('ground');

  /* `.cr-plastic` is Crystal's own foundation class, out of the stylesheet this
     Storybook already loads — the three radial atmosphere washes over the canvas
     colour. Painting `background: var(--cr-canvas)` instead, which is what this
     did, throws all three away and leaves every material with nothing to diffuse.
     
     Crystal's playground marks its scene `class="stage cr-plastic"` for exactly
     this reason. There is no second recipe here; the class is the recipe. */
  const onPlastic = (ground ?? 'plastic') !== 'canvas';

  return (
    <CrystalProvider
      palette={(palette as CrystalPalette) ?? 'prism'}
      mode={(mode as CrystalMode) ?? 'light'}
      density={(density as CrystalDensity) ?? 'comfortable'}
      direction={(direction as CrystalDirection) ?? 'ltr'}
      effects={(effects as CrystalEffects) ?? 'full'}
      reduceMotion={reduceMotion === true || reduceMotion === 'true'}
      atmosphere={NUMBER(atmosphere, 90)}
      translucency={NUMBER(translucency, 35)}
      elevation={NUMBER(elevation, 125)}
      radius={NUMBER(radius, 28)}
      motionSpeed={NUMBER(motionSpeed, 1)}
      className={onPlastic ? 'cr-plastic' : undefined}
      style={{
        padding: 'var(--cr-space)',
        minHeight: '100vh',
        ...(onPlastic ? {} : { background: 'var(--cr-canvas)' }),
      }}
    >
      <Story />
    </CrystalProvider>
  );
};
