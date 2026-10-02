# Crystal React

React components for the [Crystal](https://github.com/boomerbowser/crystal) design
system. The package name is `@crystal-ui/react`.

Crystal React implements Crystal for React. It takes every token, material and
motion recipe from `@crystal-ui/core` and defines none of its own. The
requirements it is held to are in `libraries/CONTRACT.md` in the design system
repository.

## Status

Version `0.1.0-alpha.1`. The package is marked private and has not been published
to npm.

282 of the 284 components in Crystal's catalogue are implemented. The other two,
`terminal` and `border-beam`, are recorded as not applicable, with the reasons in
the catalogue. Per-component status is in the generated
`component-manifest.json`, and the design system records it in
`libraries/status/web.json`.

The documentation website, slice Q of the plan, is not built yet. Storybook is the
review surface until it is.

The plan is [`docs/implementation-plan.md`](docs/implementation-plan.md). Open
issues are in [`docs/open-issues.md`](docs/open-issues.md).

## Using it

Import Crystal's stylesheets once, before this library's, and wrap the
application or any subtree in `CrystalProvider`.

```tsx
import '@crystal-ui/core/theme';
import '@crystal-ui/core/css';
import '@crystal-ui/react/styles.css';
import { CrystalProvider, Button } from '@crystal-ui/react';

<CrystalProvider palette="prism" mode="light">
  <Button variant="primary">Save</Button>
</CrystalProvider>
```

The provider scopes the theme to its own element, so a dark region inside a light
page needs no second root. `useCrystalTheme` throws outside a provider.

Crystal paints every `<button>` by element, so the core stylesheets are required.
Without them a button renders with the browser's default appearance.

## How it consumes Crystal

`@crystal-ui/core` is a dependency, installed from npm at `^2.3.0`.

Design values enter the library in one place. `scripts/build-tokens.mjs` reads
Crystal's generated export and writes `src/styles/_tokens.scss` and
`src/theme/tokens.generated.ts`. Both files are gitignored. `pnpm lint:tokens`
fails on a hard-coded colour or length anywhere else in the source.

## Decisions

**React Aria Components.** Radix ships no date picker, calendar, combobox, table,
tree, colour picker, number field, tag group or drag and drop, and the contract
says to wrap a maintained primitive instead of building one. React Aria also
exposes state as `data-*` attributes, which lets the styling be plain SCSS.

**SCSS.** Runtime theming uses custom properties and compile-time values are SCSS
variables, so the library needs no style runtime.

**Motion.** The engines, springs, recipes and state derivation come from
`@crystal-ui/core`. This library implements the React lifecycle around them:
refs, effects and cleanup.

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm tokens` | Regenerates the token files from Crystal. |
| `pnpm build` | Builds the package, the type declarations and the component manifest. |
| `pnpm typecheck` | Runs TypeScript in strict mode. |
| `pnpm test` | Runs the unit tests with Vitest. |
| `pnpm test:jest` | Runs the Jest compatibility suite. |
| `pnpm lint:tokens` | Fails on a hard-coded design value. |
| `pnpm storybook` | Starts Storybook on port 6006. |
| `pnpm verify` | Runs the token lint, the type check, the story checks, both test suites and the build. |
| `pnpm verify:targets` | Measures target sizes in a browser. |
| `pnpm verify:behaviour` | Checks keyboard and motion behaviour in a browser. |
| `pnpm verify:theme` | Checks the theme as rendered. |
| `pnpm verify:materials` | Compares the rendered materials with Crystal's. |
| `pnpm verify:appearance` | Checks rendered states that a DOM without layout cannot see. |
