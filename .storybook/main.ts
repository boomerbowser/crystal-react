import type { StorybookConfig } from '@storybook/react-vite';

/* Storybook is the review surface for the theme axes.
 *
 * The design system's own visual gate photographs six palettes, both modes, both
 * densities, full and reduced effects and both text directions. A story that can
 * only be seen in one of those is a story that proves very little, so the toolbar
 * carries the same axes — see preview.ts.
 */
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs', '@storybook/addon-vitest'],
  framework: { name: '@storybook/react-vite', options: {} },
  typescript: {
    /* Props tables come from the source, never hand-written — the same argument
       CONTRACT §1 makes about values.
     *
     * `react-docgen` rather than `react-docgen-typescript`: the latter builds a
     * TypeScript program through a plugin that does not yet support TypeScript 7,
     * and fails the build outright. react-docgen reads the same interfaces and
     * their doc comments without a program. The documentation site generates its
     * own props tables (§3.10) and can use the richer extractor once the plugin
     * catches up. */
    reactDocgen: 'react-docgen',
  },

  /* Re-bundle Crystal on every start.
   *
   * `@crystal-ui/core` is `file:../crystal-design-system/design-system/core` — the design
   * system itself, edited in the same sitting as this library. Vite's dependency
   * optimiser caches a pre-bundled copy of it, so a change to Crystal's resolver
   * does not reach the served page until somebody clears the cache. From the
   * inside that is indistinguishable from a defect: it cost three investigations
   * in one day, once far enough to start a wrong diagnosis of the theme provider,
   * and once for Meridian to report that Crystal's specifications were missing
   * from every component.
   *
   * Excluding it from optimisation was the first attempt and it does not work:
   * `core/preferences.js` and the resolver are CommonJS, so the browser gets a
   * module with no default export and every story fails to render. They have to
   * be pre-bundled; what they must not be is pre-bundled *once*.
   *
   * `force` costs a few seconds of startup and removes the whole class. */
  viteFinal: async (config) => ({
    ...config,
    optimizeDeps: { ...config.optimizeDeps, force: true },
  }),
};

export default config;
