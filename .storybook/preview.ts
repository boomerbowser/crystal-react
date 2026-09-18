import type { Preview } from '@storybook/react-vite';
import { withCrystal, crystalGlobalTypes } from './withCrystal.js';

/* Crystal's own stylesheets, in cascade order: the reset and materials first,
   then the resolved theme, then the control primitives. A story renders against
   the same CSS an application would. */
import '@crystal/core/css';
import '@crystal/core/theme';
import '@crystal/core/controls';

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
