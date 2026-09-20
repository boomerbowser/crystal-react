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

  /* No `optimizeDeps.force`, and the reason it is gone is the reason it existed.
   *
   * `@crystal-ui/core` used to be `file:../crystal-design-system/core` — the
   * design system itself, edited in the same sitting as this library. Vite's
   * dependency optimiser caches a pre-bundled copy, so a change to Crystal's
   * resolver did not reach the served page until somebody cleared the cache.
   * From the inside that is indistinguishable from a defect: it cost three
   * investigations in one day, once far enough to start a wrong diagnosis of
   * the theme provider, and once for Meridian to report that Crystal's
   * specifications were missing from every component. Forcing a re-bundle on
   * every start removed the class, at a few seconds of startup each time.
   *
   * The dependency is `^2.0.0` from npm now. A published version is immutable,
   * so a cached pre-bundle of it cannot go stale — there is no edit for it to
   * miss. `pnpm install` changes the resolved version and Vite re-optimises
   * when the lockfile moves. The workaround had exactly one cause and it is
   * gone, so keeping it would only be paying the startup cost for a hazard
   * that no longer exists. That is R-14 closed by its cure rather than by its
   * workaround.
   *
   * If Crystal is ever linked locally again — `pnpm link` for a change being
   * developed across both repositories — the hazard returns with it, and
   * `--force` on the Storybook command is the per-session answer. */
};

export default config;
