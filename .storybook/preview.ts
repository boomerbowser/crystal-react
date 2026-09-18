import type { Preview } from '@storybook/react-vite';
import { withCrystal, crystalGlobalTypes } from './withCrystal.js';

/* Crystal's reset, materials and scrollbars, and the resolved theme. A story
   renders against the same CSS an application would.
 *
 * `@crystal/core/controls` is deliberately NOT loaded. It is the preview site's
 * own control layer and it styles bare elements — `:is(button, a.cr-button)`
 * gives every button on the page a Resin background, a feathered ::before and a
 * 48px minimum height. Loading it here put a second implementation of every
 * control underneath this library's own, which is the drift CONTRACT §1 is
 * about: a 32px chip rendered 50px tall, and every story was being validated
 * against styles a consumer of this package would never have. */
import '@crystal/core/css';
import '@crystal/core/theme';

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    a11y: {
      /* Accessibility findings fail rather than inform. A panel nobody opens is
         a check nobody runs. */
      test: 'error',
    },
  },
  globalTypes: crystalGlobalTypes,
  decorators: [withCrystal],
};

export default preview;
