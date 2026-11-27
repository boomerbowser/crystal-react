import type { Decorator } from '@storybook/react-vite';
import { PrismataProvider } from '../src/theme/PrismataProvider.js';
import type {
  PrismataDensity, PrismataDirection, PrismataEffects, PrismataModePreference,
  PrismataPalette, PrismataTypeface,
} from '../src/theme/types.js';

/* The environment, as toolbar controls.
 *
 * Every adjustable value in Prismata's own "Make it yours" panel, in the same
 * order and with the same defaults: palette, appearance, colour atmosphere,
 * Frost base tint, elevation, corner radius, density, direction, animation speed,
 * reduced motion and reduced effects, plus the ground the story stands on.
 *
 * They are environment rather than per-story args so that a reviewer can take
 * any story through dark mode, compact density, right-to-left, reduced effects
 * or a flat foundation without the story's author having offered it. Most
 * regressions in this system have been found on an axis nobody was looking at.
 */
export const prismataGlobalTypes = {
  palette: {
    description: 'Brand palette',
    toolbar: {
      icon: 'paintbrush',
      items: ['prism', 'fuchsia', 'cobalt', 'ion', 'amethyst', 'harbor'],
      dynamicTitle: true,
    },
  },
  mode: {
    /* `system` is Prismata's Auto, the appearance setting most readers use, so
       the toolbar offers it for review. */
    description: 'Light, dark or auto',
    toolbar: { icon: 'mirror', items: ['light', 'dark', 'system'], dynamicTitle: true },
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
     
     Prismata's materials are defined by what is behind them. Frost diffuses the
     foundation, Resin transmits its colour and Haze fills over it. Against a
     flat canvas they all render as white, the hierarchy disappears, and every
     control looks like a plain rounded rectangle.
     
     Colour atmosphere sets how much colour that foundation carries. 90% is
     Prismata's own default and the value the approved baseline was captured at.
     15% is the floor; taking a story down to it shows how much of a material's
     appearance comes from the foundation. */
  atmosphere: {
    description: 'Colour atmosphere',
    toolbar: {
      icon: 'sun',
      items: [
        { value: '90', title: 'Atmosphere 90% (Prismata default)' },
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
        { value: '35', title: 'Frost tint 35% (Prismata default)' },
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
        { value: '125', title: 'Elevation 125% (Prismata default)' },
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
        { value: '28', title: 'Radius 28px (Prismata default)' },
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
        { value: '1', title: 'Speed 1× (Prismata default)' },
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
        { value: 'plastic', title: 'Plastic foundation (Prismata default)' },
        { value: 'canvas', title: 'Flat canvas' },
      ],
      dynamicTitle: true,
    },
  },
};

/* Prismata's own defaults, as numbers rather than as strings from a toolbar. */
const NUMBER = (value: string | number | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * A story's own environment, overriding the toolbar.
 *
 * The toolbar takes any story through any axis. A story that needs to be seen,
 * and tested, against a particular environment can pin one here.
 *
 *     export const OnAFlatGround: Story = {
 *       parameters: { prismata: { ground: 'canvas', atmosphere: 15 } },
 *       render: () => <Button>Nothing to diffuse</Button>,
 *     };
 *
 * Two kinds of story pin. One is a component whose subject is an environment,
 * such as a Frost panel at 85% tint or a control at the elevation floor. The
 * other is a browser gate: `verify-materials.mjs` opens a story and measures
 * it, and the measurement needs a fixed environment, not whatever the last
 * reviewer left in the toolbar.
 *
 * Anything a story does not pin still follows the toolbar, so pinning the ground
 * does not also freeze the palette.
 */
export interface PrismataStoryEnvironment {
  palette?: PrismataPalette;
  mode?: PrismataModePreference;
  density?: PrismataDensity;
  direction?: PrismataDirection;
  effects?: PrismataEffects;
  reduceMotion?: boolean;
  atmosphere?: number;
  translucency?: number;
  elevation?: number;
  radius?: number;
  motionSpeed?: number;
  font?: PrismataTypeface;
  /** The viewer's preference, which overrides `effects` exactly as the real one does. */
  reduceTransparency?: boolean;
  /** `plastic` is Prismata's foundation; `canvas` is a flat ground with no atmosphere. */
  ground?: 'plastic' | 'canvas';
}

export const withPrismata: Decorator = (Story, context) => {
  const globals = context.globals as Record<string, string>;
  const pinned = (context.parameters['prismata'] ?? {}) as PrismataStoryEnvironment;
  const args = context.args as Record<string, unknown>;
  const initial = context.initialArgs as Record<string, unknown>;

  /* Four sources, in this order:
   *
   *   1. What the story pinned. A reviewer must not be able to undo it, because
   *      a browser gate measures some of these stories and needs a fixed
   *      environment.
   *   2. An environment arg the reviewer has moved.
   *   3. The toolbar.
   *   4. Prismata's default.
   *
   * Step two compares against `initialArgs` instead of reading `args`. Every
   * story carries the full environment as args so the Controls panel has
   * sliders to show, so `args.atmosphere` is always set. Reading it directly
   * would make the args always win and the toolbar would stop working.
   * Comparing with the story's initial value distinguishes "the reviewer
   * dragged this" from "this is just the default sitting there". */
  const moved = (key: string): unknown =>
    (key in args && args[key] !== initial[key] ? args[key] : undefined);

  const pick = <K extends keyof PrismataStoryEnvironment>(key: K): PrismataStoryEnvironment[K] | string | undefined =>
    (pinned[key] ?? (moved(key) as PrismataStoryEnvironment[K]) ?? globals[key]);

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
  const font = pick('font');
  /* A viewer's preference beats a product's, which is how the real one behaves:
     the provider checks `prefers-reduced-transparency` before it looks at
     `effects`, so a product cannot ask for more diffusion than the reader
     allowed. Simulated here by resolving to the same place. */
  const reduceTransparency = pick('reduceTransparency');
  const wantsOpaque = reduceTransparency === true || reduceTransparency === 'true';

  /* `.pr-plastic` is Prismata's own foundation class, from the stylesheet this
     Storybook already loads: the three radial atmosphere washes over the canvas
     colour. Painting `background: var(--pr-canvas)` instead throws all three
     away and leaves every material with nothing to diffuse.
     
     Prismata's playground marks its scene `class="stage pr-plastic"` for the same
     reason. The class is the recipe, and nothing here restates it. */
  const onPlastic = (ground ?? 'plastic') !== 'canvas';

  return (
    <PrismataProvider
      palette={(palette as PrismataPalette) ?? 'prism'}
      mode={(mode as PrismataModePreference) ?? 'light'}
      density={(density as PrismataDensity) ?? 'comfortable'}
      direction={(direction as PrismataDirection) ?? 'ltr'}
      effects={wantsOpaque ? 'opaque' : ((effects as PrismataEffects) ?? 'full')}
      font={(font as PrismataTypeface) ?? 'manrope'}
      reduceMotion={reduceMotion === true || reduceMotion === 'true'}
      atmosphere={NUMBER(atmosphere, 90)}
      translucency={NUMBER(translucency, 35)}
      elevation={NUMBER(elevation, 125)}
      radius={NUMBER(radius, 28)}
      motionSpeed={NUMBER(motionSpeed, 1)}
      className={onPlastic ? 'pr-plastic' : undefined}
      style={{
        padding: 'var(--pr-space)',
        minHeight: '100vh',
        ...(onPlastic ? {} : { background: 'var(--pr-canvas)' }),
      }}
    >
      <Story />
    </PrismataProvider>
  );
};
