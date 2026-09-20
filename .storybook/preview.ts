import type { Preview } from '@storybook/react-vite';
import { withCrystal, crystalGlobalTypes } from './withCrystal.js';
import { environmentArgs, environmentArgTypes } from './environment.js';

/* Crystal's reset, materials and scrollbars, and the resolved theme. A story
   renders against the same CSS an application would.
 *
 * There is deliberately no third import. This once loaded
 * `@crystal-ui/core/controls`, the preview site's own control layer, which styles
 * bare elements — `:is(button, a.cr-button)` gives every button on the page a
 * Resin background, a feathered ::before and a 48px minimum height. That put a
 * second implementation of every control underneath this library's own, which is
 * the drift CONTRACT §1 is about: a 32px chip rendered 50px tall, and every story
 * was being validated against styles a consumer would never have had.
 *
 * Crystal no longer exports it, so the import would not resolve today. The
 * comment stays because the reason is worth more than the specifier. */
import '@crystal-ui/core/css';
import '@crystal-ui/core/theme';

const preview: Preview = {
  /* Declared here rather than in each story file, so the environment is on
     *every* component's Controls panel without twenty-seven authors having
     remembered to offer it. That is what "available per-component to test with
     and against" has to mean in practice: a reviewer opening any story finds the
     same panel Crystal's own preview has.

     The decorator only honours one of these once it differs from the story's
     initial value, so their presence does not disable the toolbar. */
  args: environmentArgs,
  argTypes: environmentArgTypes,
  parameters:  {
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
