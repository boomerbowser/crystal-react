import type { Preview } from '@storybook/react-vite';
import { withCrystal, crystalGlobalTypes } from './withCrystal.js';

/* Crystal's reset, materials and scrollbars, and the resolved theme. A story
   renders against the same CSS an application would.
 *
 * There is deliberately no third import. This once loaded
 * `@crystal/core/controls`, the preview site's own control layer, which styles
 * bare elements — `:is(button, a.cr-button)` gives every button on the page a
 * Resin background, a feathered ::before and a 48px minimum height. That put a
 * second implementation of every control underneath this library's own, which is
 * the drift CONTRACT §1 is about: a 32px chip rendered 50px tall, and every story
 * was being validated against styles a consumer would never have had.
 *
 * Crystal no longer exports it, so the import would not resolve today. The
 * comment stays because the reason is worth more than the specifier. */
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
