import type { StorybookConfig } from '@storybook/react-vite';

/* Storybook is the review surface for the theme axes.
 *
 * The design system's own visual gate photographs six palettes, both modes, both
 * densities, full and reduced effects and both text directions. A story that can
 * only be seen in one of those proves little, so the toolbar carries the same
 * axes; see preview.ts.
 */
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs', '@storybook/addon-vitest'],
  framework: { name: '@storybook/react-vite', options: {} },
  typescript: {
    /* Props tables come from the source, never hand-written, for the reason
       CONTRACT §1 gives about values.
     *
     * `react-docgen` rather than `react-docgen-typescript`. The failure is in
     * `react-docgen-typescript@2.4.0` itself: it evaluates
     * `ts.JsxEmit.React` at module scope, and TypeScript 7's main entry exports
     * only `version` and `versionMajorMinor`, because the compiler API moved
     * behind `typescript/unstable/*`. So it throws
     * `Cannot read properties of undefined (reading 'React')` on `require`,
     * before any option of it is read, and nothing configured here can reach
     * it.
     *
     * Pinning TypeScript 5.x for that package alone does not work either:
     * `typescript` is a peer of both it and the plugin, auto-installed from the
     * root, and pnpm's `overrides` and `packageExtensions` both act on
     * dependency resolution rather than peer resolution. The store holds
     * exactly one TypeScript, 7.0.2.
     *
     * What that costs: react-docgen reads a component's own interface and does
     * not resolve what it extends. Run the way `@storybook/react-vite` runs it,
     * with `makeFsImporter()`, it returns five props for `Button`: `children,
     * variant, shape, className, style`. No `onPress`, no `isDisabled`. Nearly
     * every callback and state flag in this library is inherited from a React
     * Aria interface, so nearly every component's Controls panel is missing
     * most of its surface.
     *
     * `.storybook/react-aria.ts` is the compensation: the inherited props
     * described once, with the compiler enforcing which component has which,
     * since the compiler does resolve `extends`. See the note at the top of
     * that file. The documentation site generates its own props tables (§3.10)
     * and can use a real extractor whenever one runs on TypeScript 7. */
    reactDocgen: 'react-docgen',
  },

  /* No `optimizeDeps.force` (R-14).
   *
   * The dependency is `^2.0.0` from npm. A published version is immutable, so
   * Vite's cached pre-bundle of it cannot go stale: `pnpm install` changes the
   * resolved version and Vite re-optimises when the lockfile moves. Forcing a
   * re-bundle on every start would cost a few seconds of startup each time
   * and buy nothing.
   *
   * If Crystal is ever linked locally again (`pnpm link` for a change being
   * developed across both repositories), Vite's dependency optimiser caches a
   * pre-bundled copy, and a change to Crystal's resolver does not reach the
   * served page until the cache is cleared. Pass `--force` on the Storybook
   * command for that session. */

  /* React Stately's virtualizer layouts read `process.env` in the browser.
   *
   * Vite does not define `process`, a Node global, so
   * `ListLayout.getVisibleLayoutInfos` throws `process is not defined` the
   * moment a `Virtualizer` renders. It is a story failure rather than a type
   * error, and `virtual-scroller` is the first component here to use a layout.
   *
   * `process.env.NODE_ENV` is replaced with a real value so a library branching
   * on it gets the right branch, and a bare `process.env` with an empty object
   * so any other read is `undefined` rather than a crash. Vite replaces the
   * longer key first, so the two do not conflict. */
  viteFinal: async (viteConfig) => ({
    ...viteConfig,
    define: {
      ...viteConfig.define,
      'process.env.NODE_ENV': JSON.stringify(process.env['NODE_ENV'] ?? 'production'),
      'process.env': '{}',
    },
  }),
};

export default config;
