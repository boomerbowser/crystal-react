# Crystal React — implementation plan

`@crystal/react`. A comprehensive React component library implementing the full Crystal
catalogue at parity with Mantine, MUI (including the X add-ons), Ant Design and PrimeReact.

This is the working plan. It is kept current: when a decision changes, this document
changes with it, and `libraries/parity.json` in the design system is the progress record.

---

## 1. Requirements, and where each is answered

Meridian's brief, traced to the section that satisfies it. Nothing here is aspirational —
where something is not yet built, it says so.

| Requirement | Answered by | Status |
| --- | --- | --- |
| React Aria as the unstyled primitive | §2.1 | decided |
| Parity with PrimeReact, Mantine, MUI + MUI X, Ant Design, including add-ons | §4 | scoped: 174 components |
| Crystal's animations at every appropriate step | §3.4 | designed |
| Theme provider, theme object, colour scheme and typography context, hooks | §3.3 | built |
| 100% functional, correct TypeScript | §3.2 | enforced |
| Next.js, TanStack Start, React Router, Gatsby, Redwood | §3.6 | designed, gated |
| Vitest, Jest, Storybook, LLMs | §3.7 | Vitest built; rest designed |
| SCSS/PostCSS under the hood, not CSS-in-JS | §2.2, §3.1 | built |
| Dynamic and responsive; improve the animations | §3.4, §3.5 | designed |
| Forms: components, state, validation, submission, mutations | §3.8 | designed |
| Named Crystal React, published as `@crystal/react` | §3.9 | set |

---

## 2. Decisions

### 2.1 React Aria Components, not Radix

Settled by coverage of *this* catalogue rather than in the abstract. Every capability below
was probed against the live npm registry:

| Capability the catalogue requires | React Aria | Radix |
| --- | --- | --- |
| Date picker, range, calendar | `react-aria-components` | no package |
| Time field, digital clock | yes | no package |
| Combobox / autocomplete | yes | no package |
| Table with sort, selection, resize | yes | no package |
| Tree view | yes | no package |
| Colour picker, area, slider, swatch | yes | no package |
| Number field | yes | no package |
| Tag group | yes | no package |
| Drag and drop | `@react-aria/dnd` | no package |
| Internationalised dates | `@internationalized/date` | none |

Radix is excellent at what it covers and is the better-known choice, but it covers roughly
the overlay-and-form third of this catalogue. Building the rest by hand would breach
CONTRACT §3 — *"Do not rebuild complex behaviour to obtain a surface style; wrap a
maintained primitive and dress it."*

Three secondary reasons, each sufficient on its own:

- State is exposed as `data-*` attributes (`data-pressed`, `data-focus-visible`,
  `data-selected`), so Crystal's materials are expressible in plain CSS. That makes the
  stated preference for SCSS over Emotion free rather than a compromise.
- SSR-safe by design, which §3.6 requires.
- Real internationalisation, which Crystal's right-to-left axis already tests for.

### 2.2 SCSS and PostCSS, not CSS-in-JS

Meridian's stated preference, and the architecture supports it without compromise because
React Aria publishes state as attributes. There is no style runtime, no serialisation cost,
and no per-render class generation.

**On LESS.** The brief named SASS, LESS and PostCSS. The library's own source is SCSS —
mixing two preprocessors inside one codebase buys nothing and doubles the toolchain. What
*consumers* use is a separate question, and all three are supported for them: every value
is published as a CSS custom property, so a LESS, SASS or PostCSS consumer overrides Crystal
without needing Crystal's own preprocessor. §3.1 states the surface.

### 2.3 Crystal owns the physics, React owns the binding

`assets/motion.js` is an IIFE that installs document-wide listeners; a React library must
not do that. But `src/engines.js` is already ESM with named exports and `assets/core/*.js`
are pure functions. React imports those and binds through refs and effects.

This satisfies CONTRACT §1 and §6: arithmetic, springs, recipes and state derivation stay
Crystal's. What React implements is lifecycle — which is genuinely different on a platform
with components, and is what §2 means by "platform-appropriate techniques".

### 2.4 No ambient motion

Crystal 2.0 ships none. It was specified, built, measured and withdrawn (R17–R22), and
Crystal React must not reintroduce it. Materials are at rest when nothing is happening to
them. Two findings carry forward for whenever it returns, recorded in CONTRACT §8: a rest
state fails by being *too strong* or *too weak*, so it needs a measured floor as well as a
ceiling; and its cost was structural rather than tuning.

### 2.5 `@crystal/core` is the base package

The design system publishes as `@crystal/core`; this library is `@crystal/react`. Both sit
under the `@crystal` scope. Crystal React consumes `@crystal/core` and never vendors it —
it is `external` in the bundle, so a consumer resolves one copy of the token set.

Until `@crystal/core` is published, it is linked from a sibling checkout
(`../crystal-design-system/design-system`). If that path is missing, the token build fails
loudly rather than falling back to stale values.

---

## 3. Architecture

### 3.1 Styling

Three layers, in cascade order:

1. **`@crystal/core` stylesheets** — the reset, the material primitives and the resolved
   theme custom properties. Imported once by the consumer.
2. **Component SCSS** — one `.module.scss` per component, selecting on React Aria's
   `data-*` attributes. Compiled through PostCSS with Autoprefixer.
3. **Consumer overrides** — custom properties, scoped to a `CrystalProvider` subtree or to
   a single component through `style`.

**Values enter in exactly one place.** `scripts/build-tokens.mjs` reads Crystal's resolved
export and writes `src/styles/_tokens.scss` and `src/theme/tokens.generated.ts`. Both are
gitignored, because a committed generated file is one somebody eventually edits.
`scripts/lint-tokens.mjs` fails the build on a hard-coded colour or length anywhere else —
it caught one in its own first test run.

**What is a SCSS variable and what is a custom property** is not arbitrary. A value that
can change at runtime with the theme — palette colour, radius, elevation, motion speed — is
a custom property. A value that cannot — a blur radius inside a `filter` shorthand, a
breakpoint in a media query — is a SCSS variable.

### 3.2 TypeScript

`strict`, plus `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`,
`noImplicitOverride`, `verbatimModuleSyntax`, `noUnusedLocals` and `noUnusedParameters`.
No `any` in a public type. Every component exports its own props interface, extending the
matching React Aria props so consumers keep the full underlying surface.

Declarations are emitted separately (`tsc --emitDeclarationOnly`) rather than by the
bundler, so the published types are the ones the source actually checks.

### 3.3 Theme — built

- `CrystalProvider` wraps `@crystal/core/core/preferences`. Normalisation, clamps, choices
  and duration resolution are Crystal's; the provider re-derives nothing. Crystal's own
  defaults and palette list are passed in rather than copied.
- **Scoping is per element, not per document.** A nested provider writes custom properties
  onto its own wrapper, so a dark island inside a light page needs no second root. That
  also makes the provider safe to render more than once, which Storybook and visual tests
  both do.
- Hooks: `useCrystalTheme`, `useColorScheme`, `useDensity`, `useDirection`,
  `useReducedEffects`, `useMotionSpeed`. Each is a narrow read, so a component that cares
  only about direction need not re-render when the palette changes.
- `useCrystalTheme` **throws** outside a provider rather than returning a default. A
  component silently rendering un-themed is the failure mode that produces "it looks
  nothing like the design system" reports.
- **Typography context** is still to build: `useTypography` returning the resolved family,
  reading size and leading, plus a `Text`/`Title` scale bound to it (§ slice F).

### 3.4 Motion

Bound to **state, not events** — `checked`, `aria-expanded`, `aria-invalid`, `open`, a
committed range value — so keyboard and assistive technology get what a pointer user gets.
This mirrors `motion-interactions.js` upstream, implemented as hooks.

- `useMotion(ref, recipe, options)` — plays a Crystal recipe through Crystal's engine,
  cancels on unmount, supports `{ once }` coalescing so a continuous control does not
  restart its recipe on every event.
- `useStateMotion(ref, { checked, expanded, invalid, open })` — the declarative binding
  most components use.
- `useOpticalLayer(ref)` — attaches the shader for the duration of an interaction and
  **fully detaches after it**. A layer that outlives its motion is precisely how the
  preview grew a ghost box.

Reduced motion resolves durations to zero: the state change still happens, the movement
does not.

**Where the animations improve on the web preview**, as asked:

- Property vocabulary restricted to `transform` and `opacity`. The preview's optical layers
  animate `box-shadow` (18 keyframes), `border-radius` (19) and `background-position` (9),
  none of which can be composited — each forces a repaint every frame. Shadow and rim
  changes become opacity cross-fades between pre-rendered layers.
- No React state during an animation. Motion is driven imperatively through refs, so a
  60fps animation causes zero re-renders.
- Interruption is first-class: a recipe replaced mid-flight starts from the current value
  rather than snapping.

### 3.5 Responsiveness

Container queries where a component's layout depends on its own width rather than the
viewport's — which is most of them in a component library. Breakpoint SCSS variables come
from tokens. Density (`comfortable` / `compact`) tightens spacing and never targets: 44px
minimum survives every density and every breakpoint.

### 3.6 Framework compatibility

- `"use client"` on every module with state, effects or context. Pure presentational and
  type-only modules stay server-compatible.
- No `window`, `document` or `matchMedia` at module scope. Anything environmental is read
  in an effect or behind `useSyntheticEnvironment`-style guards.
- `<ColorSchemeScript />` for the pre-paint theme class, so there is no flash and no
  hydration mismatch.
- ESM and CJS both published, with `preserveModules` so a consumer importing `Button` does
  not pull the date picker's internationalisation tables.
- **Gated**: a smoke app per framework — Next.js (App and Pages router), TanStack Start,
  React Router, Gatsby, Redwood — each rendering a themed component server-side and
  hydrating without warnings.

### 3.7 Testing, stories, and machine readability

- **Vitest** + Testing Library + `vitest-axe`, with a shared `renderWithCrystal` helper.
  Built; 7 tests currently cover the provider.
- **Jest** compatibility is a shipped requirement, not an assumption: a transform note plus
  one suite proven to run under Jest, so the claim is checkable.
- **Storybook 9** with a toolbar covering all six palettes, both modes, both densities, both
  directions and reduced effects — the same axes the design system's visual gate uses.
- **LLM integration**: `llms.txt` at the package root, and a generated
  `component-manifest.json` carrying props, states, tokens and recipes per component, so an
  assistant can use the library without reading the source. Generated from the catalogue
  and the types, never hand-written.

### 3.8 Forms

- `useCrystalForm` over React Aria's own form integration. React Hook Form is deliberately
  **not** wrapped: RAC already owns validation display, `aria-describedby` wiring and
  submission semantics, and a second form library fighting it is a known source of bugs.
- **Validation** through [Standard Schema](https://standardschema.dev) (`~standard`), so
  Zod, Valibot and ArkType all work untouched and none is a dependency.
- **Submission state** — idle, submitting, succeeded, failed — is surfaced as data
  attributes so the SCSS can dress it, and drives Crystal's `field-invalid` / `field-valid`
  recipes.
- **Mutations** through an adapter that accepts any `mutate` function with a
  `{ mutateAsync, isPending, error }` shape. TanStack Query fits it exactly and is *not* a
  dependency; a plain `fetch` wrapper fits it too.
- Server-side and asynchronous errors map onto the same field state as client validation,
  so a field looks the same however it failed.

### 3.9 Packaging

`@crystal/react`, ESM + CJS + types, `sideEffects` declaring the SCSS. Changesets for
versioning. Peer range React 18.2 and 19.

---

## 4. Scope — 174 components

The catalogue lives in `design-system/tokens/catalogue/`; `libraries/parity.json` is
generated from it and is the progress record. **172 to build**; two are recorded
`not-applicable` with reasons.

The gap against the four benchmarks was computed, not estimated: every benchmark package
was installed and its component directories enumerated. Curating that list was most of the
work — MUI composes from anatomy parts (`CardHeader`, `TableCell`, `StepLabel`,
`ChartsAxis`) and date-library adapters (`AdapterDayjs`, `AdapterLuxon`), which are parts
and plumbing rather than components Crystal would name. 55 additions took the catalogue
from 119 to 174, the largest single gap being that Crystal named **no charting surface at
all** while all four benchmarks ship one.

| Category | Count |
| --- | --- |
| utility | 16 |
| layout | 14 |
| typography | 7 |
| actions | 9 |
| inputs | 44 |
| navigation | 15 |
| overlays | 10 |
| data-display | 31 |
| charts | 14 |
| feedback | 14 |

---

## 5. Slices

Each slice: implement, story, test, axe check, visual evidence, `parity.json` status,
report. Order follows dependency, not the catalogue's own order. A component is not done
until `parity.json` says `implemented`.

### C — Foundation (in progress)

Repo, build, tokens, theme, motion, testing, Storybook, `llms.txt`.

- [x] Repository, separate from the design system, remote `boomerbowser/crystal-react`
- [x] `package.json` as `@crystal/react`; Vite library build; ESM + CJS; `preserveModules`
- [x] TypeScript strict with the stricter flags; declarations emitted by `tsc`
- [x] `scripts/build-tokens.mjs` — the single point where values enter
- [x] `scripts/lint-tokens.mjs` — fails on a hard-coded colour or length
- [x] `CrystalProvider`, the theme object, six hooks, per-element scoping, 7 tests
- [ ] Typography context and the type scale
- [ ] `useMotion`, `useStateMotion`, `useOpticalLayer`
- [ ] `renderWithCrystal`, axe integration, Jest parity suite
- [ ] Storybook 9 with the six-palette toolbar
- [ ] `llms.txt` and the generated component manifest

**Gate C** — one component per concern, proven together: `Button` (pill geometry, press
recipe, Resin, focus halo), `Card` (Haze fill, feathered edge, crisp text), `Dialog` (Resin
surface, Mirage scrim, optical layer attached for entry and **fully detached** after),
`TextInput` (Haze fill in a Resin shell, `field-focus`, `field-invalid`). Nothing downstream
is trustworthy until this passes.

### D — Utility and layout (30)

`visually-hidden`, `skip-link`, `focus-trap`, `transition`, `direction-provider`,
`theme-provider`, `reduced-effects`, `resizable`, `watermark`, `qr-code`, `click-away`,
`animate-on-scroll`, `no-ssr`, `global-styles`, `terminal`*, `border-beam`*,
`app-shell`, `container`, `grid`, `simple-grid`, `stack`, `group`, `divider`,
`aspect-ratio`, `scroll-area`, `center`, `space`, `app-bar`, `masonry`, `overflow-list`.

\* recorded `not-applicable`.

### E — Typography and actions (16)

`title`, `text`, `blockquote`, `mark`, `prose`, `highlight`, `number-formatter`;
`button`, `icon-button`, `button-group`, `split-button`, `floating-action`, `copy-button`,
`close-button`, `action-bar`, `speed-dial`.

### F — Inputs, part one (22)

`text-input`, `textarea`, `number-input`, `password-input`, `search-input`, `mask-input`,
`json-input`, `select`, `native-select`, `checkbox`, `checkbox-group`, `radio`,
`radio-group`, `switch`, `slider`, `range-slider`, `angle-slider`, `knob`,
`segmented-control`, `rating`, `form-field`, `helper-text`.

### G — Inputs, part two (22)

`combobox`, `autocomplete`, `multi-select`, `tags-input`, `chip`, `pin-input`,
`color-input`, `date-input`, `date-picker`, `date-range-picker`, `date-time-picker`,
`time-input`, `month-picker`, `year-picker`, `digital-clock`, `file-input`, `dropzone`,
`transfer`, `cascader`, `mentions`, `rich-text-surface`, `fieldset`.

### H — Forms

The whole system from §3.8: `useCrystalForm`, Standard Schema validation, submission state,
the mutation adapter, and server-error mapping onto field state.

### I — Navigation and overlays (25)

`anchor`, `nav-link`, `nav-rail`, `dock`, `breadcrumbs`, `tabs`, `pagination`, `stepper`,
`burger`, `command-palette`, `tree-view`, `affix`, `bottom-navigation`, `navigation-menu`,
`table-of-contents`; `dialog`, `drawer`, `menu`, `context-menu`, `popover`, `hover-card`,
`tooltip`, `scrim`, `portal`, `floating-window`.

### J — Data display (31)

`card`, `table`, `data-table`, `list`, `description-list`, `avatar`, `avatar-group`,
`badge`, `status-badge`, `indicator`, `image`, `timeline`, `accordion`, `collapse`,
`spoiler`, `carousel`, `statistic`, `code`, `kbd`, `theme-icon`, `authored-bubble`,
`caption`, `calendar`, `data-view`, `virtual-scroller`, `image-list`,
`organization-chart`, `rolling-number`, `image-compare`, `marquee`, `overlay-badge`.

Ends with `data-table`, which is the hardest component in the catalogue: sorting,
selection, resizing, virtualisation and drag-and-drop, all of which React Aria supplies.

### K — Charts (14)

`chart-surface` first, then `bar-chart`, `line-chart`, `area-chart`, `pie-chart`,
`donut-chart`, `scatter-chart`, `radar-chart`, `spark-line`, `gauge`, `heatmap`,
`funnel-chart`, `chart-legend`, `chart-tooltip`.

**Every chart owes a text equivalent of its data.** A chart is a second representation,
never the only one. Colour never carries meaning alone.

### L — Feedback (14)

`alert`, `toast`, `notification`, `progress`, `ring-progress`, `semi-circle-progress`,
`meter-group`, `loader`, `skeleton`, `loading-overlay`, `empty-state`, `result`,
`popconfirm`, `tour`.

---

## 6. Final gates

- `parity.json` reports every component `implemented` for `web`, or `not-applicable` with a
  reason.
- Accessibility and visual evidence across six palettes, both modes, both densities, full
  and reduced effects, and both text directions. CONTRACT §5 makes this a library
  obligation; the design system's own verification says nothing about a library built on it.
- Framework smoke tests pass: Next.js, TanStack Start, React Router, Gatsby, Redwood.
- A Jest suite runs, so that claim is checkable rather than assumed.
- `lint:tokens` clean: no hard-coded design value anywhere in the library.

---

## 7. Standing constraints

From `libraries/CONTRACT.md`. These are the contract, not preferences.

- **No hard-coded design values.** `#7338EF`, `40px`, `1.95px`, `28px` in library source is
  a defect, because it is a value that can no longer be changed centrally.
- **Materials**: Plastic → Frost → Resin, plus Haze, Stone, Mirage. Resin never contains
  Resin; a surface above Resin is a Haze content fill.
- **Focus** is a crisp 2px core at 3px offset inside a four-layer feathered halo.
- **Selection is label weight.** Never a rail, never a check mark. A check mark means
  validated or informational.
- **Action controls are pills.** Card-shaped buttons keep the content radius.
- **Motion** honours the spring physics, not the keyframes. Hard ceiling 5000ms. Reduced
  motion removes spatial change and keeps state feedback.
- **Status colours** are independent of brand palettes.
- Text, icons, hit areas and focus rings are never blurred.
