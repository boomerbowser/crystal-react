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
| Parity with PrimeReact, Mantine, MUI + MUI X, Ant Design, including add-ons | §4, §4.1, §4.2 | scoped: 265 components + 20 blocks, capability specified per component |
| Crystal's animations at every appropriate step | §3.4, §2.6 | built on Motion for React, driven by Crystal's springs |
| Theme provider, theme object, colour scheme and typography context, hooks | §3.3 | built |
| 100% functional, correct TypeScript | §3.2 | enforced |
| Next.js, TanStack Start, React Router, Gatsby, Redwood | §3.6 | designed, gated |
| Vitest, Jest, Storybook, LLMs | §3.7 | built, all four |
| SCSS/PostCSS under the hood, not CSS-in-JS | §2.2, §3.1 | built |
| Dynamic and responsive; improve the animations | §3.4, §3.5 | designed |
| Forms: components, state, validation, submission, mutations | §3.8 | designed |
| Named Crystal React, published as `@crystal/react` | §3.9 | set |
| A documentation website, deployable to Vercel | §3.10, slice M | designed |

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

### 2.6 Every dependency is the React-native one

**Policy.** Where a library ships a React binding, Crystal React uses the binding,
not the framework-agnostic core. A JS-first library is used only where no React
binding exists *and* the work is genuinely framework-agnostic — date arithmetic,
scale math — because wrapping such a library in `useEffect` by hand reimplements
what its own binding already does, and does it worse: lifecycle, cleanup,
concurrent rendering and Strict Mode double-invocation are exactly where
hand-rolled wrappers leak.

This was a real gap. Motion was adopted only after Meridian pointed at it, which
means the plan had no policy — so here is the audit, and the rule that produced it.

| Need | Chosen | Licence | Why |
| --- | --- | --- | --- |
| Behaviour and accessibility | `react-aria-components` | Apache-2.0 | §2.1 |
| Motion | `motion/react` | MIT | Consumes Crystal's `{stiffness, damping, mass}` springs directly |
| Dates | `@internationalized/date` | Apache-2.0 | Framework-agnostic *by design*; there is nothing React-shaped to bind |
| Charts | `@visx/*` | MIT | React-native and low-level: scales and shapes, no imposed visual opinion, so Crystal owns the material |
| Virtualisation | `@tanstack/react-virtual` | MIT | Headless, React-native |
| Rich text | `@tiptap/react` | MIT | The React binding, not the vanilla core |
| Carousel | `embla-carousel-react` | MIT | The React binding |
| Mask input | `react-imask` | MIT | The React binding of IMask |
| QR code | `qrcode.react` | ISC | React-native |
| Drag and drop | `@react-aria/dnd` | Apache-2.0 | Already present; a second DnD library would mean a second accessibility model |
| Command palette | React Aria `Autocomplete` | Apache-2.0 | Prefer the primitive already in use over `cmdk`, for the same reason |

Every one is MIT, ISC or Apache-2.0. No paid licence, and no licence that becomes
paid at a usage threshold.

**Motion for React also removes GSAP.** `@crystal/core` depends on GSAP for
pseudo-element animation in the web preview, and GSAP's is a custom
"no charge" licence rather than an OSS one. Crystal React needs neither: Motion
for React covers what it used GSAP for, so the React library's dependency graph
contains no non-OSS licence at all.

**Where this changes the physics, it improves it.** Every Crystal recipe carries a
spring fitted so its settling time equals the authored duration, and Motion's
spring transition takes exactly `{ stiffness, damping, mass }`. The recipe's own
physics now drive the animation instead of a duration plus a bezier approximating
them — which is what CONTRACT §6 asks for when it says to honour the physics
rather than the keyframes.

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
- **Jest** compatibility is proven, not assumed: `pnpm test:jest` runs a real suite under
  Jest's own resolver, transform and environment, and it is part of `pnpm verify`. Babel is
  pinned to 7.x there to match the core `babel-jest` resolves — with preset-typescript 8
  against core 7 the preset silently does not engage, the file parses as JavaScript, and
  `createContext<T | null>(null)` becomes a chain of comparisons.
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

### 3.10 Documentation website

A real documentation site, at the standard set by MUI, Mantine, PrimeReact and
Blueprint: every component gets a page with an explanation, isolated visual
examples, the code for each, a generated props table, and its accessibility and
material notes.

**Next.js App Router, deployed to Vercel.** Chosen over a docs framework because
it earns its keep twice: the site is also the Next.js compatibility gate from
§3.6. A library that cannot server-render its own documentation has not proven
the claim, and a separate smoke app would be a weaker test than the real thing.

It lives at `apps/docs` in this repository, as a pnpm workspace package depending
on the library through `workspace:*`. The library stays at the repository root.
Vercel's project root is `apps/docs`; a preview deployment per pull request is the
review surface for visual change.

**The code shown is the code that runs.** This is the one rule the docs
architecture is built around, because it is where documentation sites decay. Each
example is a real `.tsx` file under `apps/docs/demos/`, imported and rendered *and*
read from disk at build time for its source. There is no second copy of an
example in a code fence, so an example cannot drift from what it renders, and a
demo that stops compiling breaks the build rather than quietly lying.

Each example is **isolated**: rendered inside its own `CrystalProvider` scope with
per-demo controls for palette, mode, density, direction and reduced effects — the
same axes the design system's visual gate uses. Because the provider scopes to an
element rather than a document (§3.3), a demo can be dark on a light page with no
iframe and no portal gymnastics.

**Props tables are generated** from the TypeScript types with
`react-docgen-typescript`, never hand-written. A hand-written props table is a
second description of the same shape and drifts from the first — the same argument
as CONTRACT §1 for values.

Every component page carries:

- what it is, and when to reach for it rather than its neighbours;
- anatomy, states, and which Crystal materials it uses;
- isolated examples, each with its source and a copy button;
- a generated props table, plus the React Aria props it passes through;
- accessibility notes: roles, keyboard map, and what the component does *not* do;
- the motion recipes it plays, and what each marks;
- its parity claim — the Mantine, MUI, Ant Design and PrimeReact components it
  corresponds to, drawn from the catalogue rather than retyped.

Page content is MDX. The component index, the parity claims and the material and
motion notes come from `@crystal/core`'s catalogue, so a component added to the
catalogue appears in the documentation without anybody remembering to add it.

Beyond the component pages: getting started per framework, theming and the token
reference, the material hierarchy, motion, accessibility, forms, and a migration
note for each benchmark library. Local search over a generated index. And
`llms.txt` plus the component manifest (§3.7) are served from the site, so the
documentation is machine-readable at the same URL a person reads.

---

## 4. Scope — 285 entries

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

| Category | Count | |
| --- | --- | --- |
| utility | 25 | |
| layout | 14 | |
| typography | 17 | a full suite, not five entries |
| actions | 9 | |
| inputs | 52 | |
| navigation | 17 | |
| overlays | 11 | |
| data-display | 37 | |
| charts | 24 | charts, statistics and visualisation |
| feedback | 15 | |
| media | 5 | |
| commerce | 24 | functional e-commerce |
| screens | 15 | whole views and their chrome |
| **blocks** | **20** | **a separate tier — see §4.2** |

**283 to build**; two are recorded `not-applicable` with reasons.


### 4.1 Capability, not nomenclature

**The correction that reshaped this section.** The first reading of parity counted
component *names* against four benchmark libraries. A catalogue can pass that
check and still be unable to drag an element, upload a file with progress, or play
a video, because counting names against names cannot see a missing capability.
Meridian's own example: Crystal specified a drag element that could not actually
be click-and-dragged.

Two sources were added as a result:

1. **React Aria's component list.** CONTRACT §3 says to wrap a maintained
   primitive rather than rebuild it, so a primitive React Aria ships that Crystal
   does not name is a gap *by definition* — Crystal would be leaving accessible
   behaviour on the floor. The installed package was enumerated and diffed against
   the catalogue; the contexts are internal plumbing, the components are not.
2. **The named list**: click-and-drag, File Input / Upload / UploadZone,
   Spotlight, floating action, navbar and submenu types, animated toasts and
   banners, alerts, loading and skeletons, pagination, portal, video and music
   players, gallery, carousel.

28 components followed, including a `media` category Crystal never had.

#### Capabilities every component owes

These are requirements on the *whole library*, checked per component rather than
assumed. Where a component in the catalogue can carry one of these and does not,
it is not finished.

| Capability | Where it applies | What it means |
| --- | --- | --- |
| **Click-and-drag** | list, grid-list, tree-view, navigation-tree, table, data-table, transfer, tags-input, token-field, kanban-style collections, gallery, upload-zone | Pointer drag **and** keyboard drag. Enter lifts, arrows move, Enter drops, Escape cancels, every state announced. A drag that only works by pointer is unfinished, not degraded. |
| **Drop targets** | anything that accepts a drag | A visible drop indicator that follows the gap rather than covering an item, plus announced valid and invalid targets. |
| **Resize** | table, data-table, resizable, floating-window, split panes | Pointer and keyboard. The resizer is a slider with announced values, and a 44px target that does not shift what it borders. |
| **Virtualisation** | list, grid-list, table, data-table, tree-view, select, combobox, virtual-scroller | Correct `aria-setsize` and `aria-posinset` across recycling, and focus retained when a focused row recycles. |
| **Selection** | every collection | Single, multiple and none; range selection with Shift; select-all semantics. Carried by label weight, never a check mark. |
| **Async** | every collection, every field that fetches | Loading, empty, error and load-more as first-class states with their own surfaces, not a spinner covering the component. |
| **Filtering and sorting** | table, data-table, list, combobox, autocomplete | Sort state announced through `aria-sort`; filtering never silently drops the selected item. |
| **Forms** | every input | Native form participation, validation display, `aria-describedby` wiring, submission state, server errors landing on the same field state as client rules. |
| **Overlay placement** | popover, tooltip, menu, submenu, hover-card, combobox, date pickers | Flip and shift at viewport edges, arrow following placement, and correct behaviour inside a scroll container. |
| **Internationalisation** | dates, times, numbers, calendars, collation | Real locale handling through `@internationalized/date`, and right-to-left correctness — an axis Crystal's own visual gate already tests. |
| **Media transport** | video-player, audio-player, media-controls, gallery, lightbox | Real `video`/`audio` elements, captions with announced state, a scrubber that is a slider rather than a progress bar, and keyboard transport that does not trap focus. |
| **Motion** | every component with a state change | The recipe Crystal's catalogue assigns it, bound to **state** rather than to an event, so keyboard and assistive technology get what a pointer user gets. Where the catalogue assigns none, the component plays none. |

#### How this is enforced

A component's catalogue entry carries its `states` and its `crystal` obligations,
and the parity manifest carries its status. A slice is not complete until, for
each of its components, the capabilities above that apply to it are implemented
and tested — a drag test that only simulates a pointer does not count, because the
keyboard path is the one that breaks silently.


### 4.2 Blocks are a separate tier

Meridian asked for larger composed blocks — dashboards, players, stores,
interactive apps — and asked for them in a section of their own rather than mixed
into the components. That separation is right, and worth stating as a rule:

**A component is a primitive with one job and a contract a library can hold.** A
button is a button in every product; its material, geometry, focus and motion are
the same everywhere, and the contract is checkable.

**A block is an arrangement that solves a recognisable product problem** — a
dashboard shell, a checkout, a player, a storefront. Blocks are *opinionated by
design*: they make layout and flow decisions that a component never should. A
design system that cannot tell the two apart ends up shipping opinions as if they
were primitives, and every product then fights the opinion instead of using the
system.

So blocks live in their own category, ship from their own entry point, and carry a
different promise: **a component's API is stable; a block is a starting point that
products are expected to fork.** What blocks guarantee is that the materials,
motion, focus and accessibility inside them are Crystal's, so forking one does not
mean leaving the design system.

Benchmarked against Tailwind UI, Mantine UI, Ant Design Pro, MUI Templates and
PrimeBlocks — which is where this tier exists in the ecosystems Crystal is
measured against.

Two scope boundaries worth stating now, because they are easy to cross later:

- **Payment.** The commerce components never handle raw card data. `payment-method`
  defers to the host provider's own element, which keeps PCI scope out of the
  library entirely.
- **Charts owe a text equivalent.** A chart is a second representation of data,
  never the only one, and colour never carries meaning alone. This applies to all
  24 of them.

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
- [x] Typography context: family, reading rhythm, and a scale *derived* from the reading size so moving that token moves every step
- [x] `useMotion` (recipes, on Crystal's springs) and `usePreset` (material presets, on Crystal's shared preset module)
- [x] `renderWithCrystal` with theme axes as one argument; axe assertions
- [x] Jest parity suite — one suite runs under Jest in `pnpm verify`, so the claim is
      checkable. It renders a themed component, reads the theme through Crystal's
      resolver and asserts the clamp, which exercises the three things that actually
      differ under Jest: ESM-style `.js` specifiers in TypeScript imports, SCSS module
      resolution, and the jsdom environment
- [x] Storybook with every theme axis in the toolbar — six palettes, both modes, both densities, both directions, reduced effects and reduced motion — and a11y findings set to fail rather than inform
- [x] `llms.txt` and `component-manifest.json`, generated from Crystal's catalogue with status read from the source tree

**Gate C** — one component per concern, proven together:

- [x] `Button` — pill geometry, Resin, focus halo, `press` and `hover` bound to press
      *state* so a keyboard user gets what a pointer user gets.
- [x] `Card` — Haze fill on an isolated paint layer, crisp text, recessed when inside a
      Resin frame, and **no motion**: the catalogue assigns Card no recipe, and a library
      must not invent one.
- [x] `TextInput` — Haze well in a Resin shell, `field-focus`, and `field-invalid` /
      `field-valid` bound to validation state so a server-side failure animates
      identically to a client one.
- [x] `Dialog` — a Mirage scrim with an 80% feathered Haze surface above it (**not**
      Resin, as an earlier draft of this plan said; the catalogue is the spec and a test
      pins it). React Aria owns focus containment, its return, Escape and scroll locking.
      `AnimatePresence` holds the subtree mounted until the exit settles, which is why a
      dismissal plays at all — without it the animation and the unmount race, and the
      unmount wins.

Nothing downstream is trustworthy until this passes.

- [x] **Task C-1 — export the motion presets from `@crystal/core`.** Done:
      `assets/core/presets.js` is a pure module, `motion.js` consumes it rather than
      keeping its own copy, and `usePreset` consumes it from React. The decorative paint
      layers stay behind in the web runtime, because animated `box-shadow`,
      `border-radius` and `background-position` cannot be composited and do not port.

### D — Utility and layout (39, 1 done)

- [x] `scroll-area` — taken out of order, because Meridian reported the scrolling
      problem from a phone and it had to be fixed in both places at once. Carries
      Crystal's two scrollbars by class rather than restating their CSS, drives
      the edge fade through `data-cr-scroll`, and becomes a tab stop only when it
      scrolls and holds nothing focusable. 14 tests.

`visually-hidden`, `skip-link`, `focus-trap`, `transition`, `direction-provider`, `theme-provider`, `reduced-effects`, `resizable`, `watermark`, `qr-code`, `click-away`, `animate-on-scroll`, `no-ssr`, `global-styles`, `terminal`*, `border-beam`*, `pressable`, `focusable`, `drag-handle`, `drop-indicator`, `virtualizer`, `shared-element-transition`, `toolbar`, `router-provider`, `ssr-provider`, `app-shell`, `container`, `grid`, `simple-grid`, `stack`, `group`, `divider`, `aspect-ratio`, `scroll-area`, `center`, `space`, `app-bar`, `masonry`, `overflow-list`.

\* recorded `not-applicable`, with the reason in the catalogue.

### E — Typography and actions (26)

`title`, `text`, `blockquote`, `mark`, `prose`, `highlight`, `number-formatter`, `display`, `heading`, `lead`, `prose-list`, `code-block`, `truncate`, `cite`, `abbreviation`, `text-balance`, `gradient-text`, `button`, `icon-button`, `button-group`, `split-button`, `floating-action`, `copy-button`, `close-button`, `action-bar`, `speed-dial`.

### F — Inputs, part one (26 of 52)

The text, choice and range families: text and its variants, select, checkbox,
radio, switch, the sliders, segmented control, rating, and the field scaffolding.

### G — Inputs, part two (26 of 52)

The composite and temporal families: combobox and autocomplete, tags and tokens,
colour in all six forms, the six date and time components, file input, upload and
upload zone, transfer, cascader, mentions and the rich-text surface.

### H — Forms

The whole system from §3.8: `useCrystalForm`, Standard Schema validation,
submission state, the mutation adapter, and server errors landing on the same
field state as client rules.

### I — Navigation and overlays (28)

`anchor`, `nav-link`, `nav-rail`, `dock`, `breadcrumbs`, `tabs`, `pagination`, `stepper`, `burger`, `command-palette`, `tree-view`, `affix`, `bottom-navigation`, `navigation-menu`, `table-of-contents`, `menubar`, `submenu`, `dialog`, `drawer`, `menu`, `context-menu`, `popover`, `hover-card`, `tooltip`, `scrim`, `portal`, `floating-window`, `overlay-arrow`.

### J — Data display (37)

`card`, `table`, `data-table`, `list`, `description-list`, `avatar`, `avatar-group`, `badge`, `status-badge`, `indicator`, `image`, `timeline`, `accordion`, `collapse`, `spoiler`, `carousel`, `statistic`, `code`, `kbd`, `theme-icon`, `authored-bubble`, `caption`, `calendar`, `data-view`, `virtual-scroller`, `image-list`, `organization-chart`, `rolling-number`, `image-compare`, `marquee`, `overlay-badge`, `navigation-tree`, `resizable-table`, `stat-card`, `kpi-tile`, `trend-indicator`, `delta-badge`.

Ends with `data-table`, the hardest component in the catalogue: sorting,
selection, resizing, virtualisation and drag-and-drop — every one of which React
Aria supplies, and every one of which needs a keyboard path as well as a pointer
one.

### K — Charts, statistics and visualisation (24)

`chart-surface`, `bar-chart`, `line-chart`, `area-chart`, `pie-chart`, `donut-chart`, `scatter-chart`, `radar-chart`, `spark-line`, `gauge`, `heatmap`, `funnel-chart`, `chart-legend`, `chart-tooltip`, `calendar-heatmap`, `treemap`, `sankey`, `candlestick-chart`, `waterfall-chart`, `bullet-chart`, `box-plot`, `histogram`, `geo-map`, `network-graph`.

`chart-surface` first; everything else composes onto it. **Every chart owes a
text equivalent of its data** — a chart is a second representation, never the only
one, and colour never carries meaning alone.

### L — Feedback (15)

`alert`, `toast`, `notification`, `progress`, `ring-progress`, `loader`, `skeleton`, `loading-overlay`, `empty-state`, `result`, `popconfirm`, `tour`, `semi-circle-progress`, `meter-group`, `banner`.

### M — Media (5)

`video-player`, `audio-player`, `media-controls`, `gallery`, `lightbox`.

Real `video` and `audio` elements underneath. Captions with announced state, a
scrubber that is a slider rather than a progress bar, and keyboard transport that
does not trap focus.

### N — Commerce (24)

`price`, `price-range`, `discount-badge`, `quantity-stepper`, `variant-selector`, `stock-indicator`, `product-card`, `product-gallery`, `cart-item`, `cart-summary`, `coupon-input`, `checkout-steps`, `payment-method`, `address-form`, `order-summary`, `shipping-selector`, `delivery-estimate`, `wishlist-button`, `review`, `rating-summary`, `filter-panel`, `sort-select`, `compare-table`, `recently-viewed`.

`payment-method` defers to the host provider's own element and never handles raw
card data, which keeps PCI scope out of the library entirely.

### O — Screens (15)

`screen`, `page-header`, `view-stack`, `master-detail`, `split-view`, `command-bar`, `status-bar`, `workspace`, `focus-mode`, `empty-screen`, `error-screen`, `loading-screen`, `offline-screen`, `not-found-screen`, `permission-screen`.

Whole views and their chrome, including the states a view can be in before it has
content — loading, empty, error, offline, not found, unauthorised — which products
otherwise improvise separately and inconsistently.

### P — Blocks (20)

`dashboard-shell`, `metrics-row`, `analytics-panel`, `data-table-block`, `crud-form-block`, `settings-block`, `auth-block`, `profile-block`, `activity-feed`, `notification-centre`, `player-shell`, `playlist-block`, `storefront-block`, `product-detail-block`, `checkout-block`, `cart-drawer`, `pricing-block`, `onboarding-block`, `search-block`, `editor-block`.

Last, because every block is an arrangement of components that must already
exist. A separate tier with a different promise: a component's API is stable, a
block is a starting point products are expected to fork. See §4.2.

### Q — Documentation website

Built alongside the slices rather than after them: a component is not done until
its page exists, which keeps the documentation from becoming a separate project
nobody finishes.

- [ ] `apps/docs` as a pnpm workspace package; Next.js App Router; library by `workspace:*`
- [ ] Vercel project rooted at `apps/docs`, preview deployment per pull request
- [ ] The demo registry: source read from disk at build time, so the code shown is the code that runs
- [ ] The isolated demo frame, with palette, mode, density, direction and reduced-effects controls
- [ ] Generated props tables from the TypeScript types
- [ ] The component page template, fed from the catalogue
- [ ] Guides: getting started per framework, theming, tokens, materials, motion, accessibility, forms
- [ ] Migration notes from Mantine, MUI, Ant Design and PrimeReact
- [ ] Local search; `llms.txt` and the component manifest served from the site

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
- The documentation site builds and deploys to Vercel, with a page for every
  component `parity.json` reports as `implemented` — a component claiming to exist
  with no page is not done.
- Every demo compiles. Since the source shown is read from the file that renders,
  a broken example breaks the build rather than misleading a reader.

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
