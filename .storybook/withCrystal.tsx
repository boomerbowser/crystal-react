import type { Decorator } from '@storybook/react-vite';
import { CrystalProvider } from '../src/theme/CrystalProvider.js';
import type {
  CrystalDensity, CrystalDirection, CrystalEffects, CrystalMode, CrystalPalette,
} from '../src/theme/types.js';

/* The theme axes, as toolbar controls.
 *
 * These are the same axes Crystal's visual gate photographs, and they are in the
 * toolbar rather than in per-story args on purpose: a reviewer should be able to
 * take any story through dark mode, compact density, right-to-left and reduced
 * effects without the story author having thought to offer it. Most regressions
 * in this system have been found on an axis nobody was looking at.
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
};

export const withCrystal: Decorator = (Story, context) => {
  const { palette, mode, density, direction, effects, reduceMotion } = context.globals as Record<string, string>;

  return (
    <CrystalProvider
      palette={(palette as CrystalPalette) ?? 'prism'}
      mode={(mode as CrystalMode) ?? 'light'}
      density={(density as CrystalDensity) ?? 'comfortable'}
      direction={(direction as CrystalDirection) ?? 'ltr'}
      effects={(effects as CrystalEffects) ?? 'full'}
      reduceMotion={reduceMotion === 'true'}
      style={{ padding: 'var(--cr-space)' }}
    >
      <Story />
    </CrystalProvider>
  );
};
