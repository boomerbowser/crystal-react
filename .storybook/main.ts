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
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
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
};

export default config;
