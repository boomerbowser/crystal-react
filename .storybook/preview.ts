import type { Preview } from '@storybook/react-vite';
import { withCrystal, crystalGlobalTypes } from './withCrystal.js';
import { environmentArgs, environmentArgTypes } from './environment.js';

/* Crystal's reset, materials and scrollbars, and the resolved theme. A story
   renders against the same CSS an application would.
 *
 * There is deliberately no third import. `@crystal-ui/core/controls`, the
 * preview site's own control layer, styles bare elements:
 * `:is(button, a.cr-button)` gives every button on the page a Resin background,
 * a feathered ::before and a 48px minimum height. Loading it puts a second
 * implementation of every control underneath this library's own, which is the
 * drift CONTRACT §1 is about: a 32px chip renders 50px tall, and every story is
 * validated against styles a consumer never has.
 *
 * Crystal no longer exports it, so the import would not resolve today. The
 * reason is recorded so that nothing like it is added. */
import '@crystal-ui/core/css';
import '@crystal-ui/core/theme';

const preview: Preview = {
  /* Declared here rather than in each story file, so the environment is on
     every component's Controls panel without twenty-seven story authors having
     to offer it. That is what "available per-component to test with and
     against" means: a reviewer opening any story finds the same panel Crystal's
     own preview has.

     The decorator only honours one of these once it differs from the story's
     initial value, so their presence does not disable the toolbar. */
  args: environmentArgs,
  argTypes: environmentArgTypes,
  parameters:  {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    a11y: {
      /* Accessibility findings fail the story instead of only appearing in the
         panel. */
      test: 'error',
    },
  },
  globalTypes: crystalGlobalTypes,
  decorators: [withCrystal],
};

export default preview;
