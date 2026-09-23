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
     * `react-docgen` rather than `react-docgen-typescript`, and the earlier
     * version of this comment had the reason wrong. It blamed the Vite plugin
     * for not supporting TypeScript 7. The plugin is not what fails:
     * `react-docgen-typescript@2.4.0` evaluates `ts.JsxEmit.React` at module
     * scope, and TypeScript 7's main entry exports only `version` and
     * `versionMajorMinor` — the compiler API moved behind `typescript/unstable/*`.
     * So it throws `Cannot read properties of undefined (reading 'React')` on
     * `require`, before any option of it is read, and nothing configured here
     * could reach it.
     *
     * Pinning TypeScript 5.x for that package alone was tried and does not work
     * either: `typescript` is a *peer* of both it and the plugin, auto-installed
     * from the root, and pnpm's `overrides` and `packageExtensions` both act on
     * dependency resolution rather than peer resolution. After each attempt the
     * store still held exactly one TypeScript, 7.0.2.
     *
     * **What that costs, measured rather than assumed.** react-docgen reads a
     * component's own interface and does not resolve what it extends. Run the
     * way `@storybook/react-vite` runs it — with `makeFsImporter()` — it returns
     * five props for `Button`: `children, variant, shape, className, style`. No
     * `onPress`, no `isDisabled`. Nearly every callback and state flag in this
     * library is inherited from a React Aria interface, so nearly every
     * component's Controls panel is missing most of its surface.
     *
     * `.storybook/react-aria.ts` is the compensation: the inherited props
     * described once, with the *compiler* enforcing which component has which,
     * since the compiler does resolve `extends`. See the note at the top of
     * that file. The documentation site generates its own props tables (§3.10)
     * and can use a real extractor whenever one runs on TypeScript 7. */
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

  /* React Stately's virtualizer layouts read `process.env` in the browser.
   *
   * Vite does not define `process` — it is a Node global and there is no Node in
   * a page — so `ListLayout.getVisibleLayoutInfos` throws `process is not
   * defined` the moment a `Virtualizer` renders. Nothing in this library used a
   * layout until `virtual-scroller` did, which is why it surfaced only now and
   * as a story failure rather than a type error.
   *
   * `process.env.NODE_ENV` is replaced with a real value so a library branching
   * on it gets the right branch, and a bare `process.env` with an empty object
   * so any other read is `undefined` rather than a crash. Vite replaces the
   * longer key first, so the two do not fight. */
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
