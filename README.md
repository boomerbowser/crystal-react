# Crystal React

Crystal Design System for React. Published as `@crystal-ui/react`.

This repository is deliberately separate from the design system. Crystal is the
base; this implements Crystal for React. It does not fork the token or material
definitions — see `libraries/CONTRACT.md` in the design system.

## Status

Early. The foundation is in place; the catalogue is not. Progress is recorded in
`libraries/parity.json` in the design system, which lists **174 components** and
is the single source of truth for what exists. Nothing here should be described
as available until that file says `implemented`.

The plan is [`docs/implementation-plan.md`](docs/implementation-plan.md) — requirements traced
to the sections that answer them, the architecture, all 174 components by slice, and the gates.

## How it consumes Crystal

`@crystal-ui/core` is not published yet, so it is linked from a sibling
checkout:

```
../crystal-design-system/design-system
```

If that path does not exist, `pnpm run tokens` fails loudly rather than falling
back to stale values. Clone both repositories side by side.

Values enter the library in exactly one place — `scripts/build-tokens.mjs`,
which reads Crystal's generated export and writes `src/styles/_tokens.scss` and
`src/theme/tokens.generated.ts`. Both are gitignored, because a committed
generated file is one somebody will eventually edit. `pnpm run lint:tokens`
fails the build on a hard-coded colour or length anywhere else.

## Decisions

**React Aria Components**, not Radix. Measured against this catalogue rather than
in the abstract: Radix ships no date picker, calendar, combobox, table, tree,
colour picker, number field, tag group or drag-and-drop, and building those by
hand would breach CONTRACT §3. React Aria also exposes state as `data-*`
attributes, which is what lets the styling be plain SCSS.

**SCSS, not CSS-in-JS.** Runtime theming is custom properties; compile-time
values are SCSS variables. Nothing needs a style runtime.

**Crystal owns the physics; React owns the binding.** The engines, springs,
recipes and state derivation are imported from `@crystal-ui/core`. What this
library implements is the lifecycle — refs, effects and cleanup — which is
genuinely different on a platform with components.

## Scripts

| | |
| --- | --- |
| `pnpm tokens` | regenerate the token surfaces from Crystal |
| `pnpm lint:tokens` | fail on any hard-coded design value |
| `pnpm typecheck` | TypeScript, strict |
| `pnpm test` | Vitest |
