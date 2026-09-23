# Crystal React — implementation plan

`@crystal-ui/react`. A comprehensive React component library implementing the full Crystal
catalogue at parity with Mantine, MUI (including the X add-ons), Ant Design and PrimeReact.

This is the working plan. It is kept current: when a decision changes, this document
changes with it, and `libraries/parity.json` in the design system is the progress record.

---

## 0. Open issues

Things noticed while implementing and not fixed are in
[open-issues.md](open-issues.md). It holds **one** entry now — R-17's second
item, where most stories are `render:` closures that ignore args, so Storybook's
Controls panel moves nothing for them. The twenty that closed are in
[closed-issues.md](closed-issues.md) with their reasoning intact, because several
explain why things are shaped as they are rather than merely what was wrong.

Crystal's own tracker is `crystal-design-system/proposals/open-issues.md`. What
is open there and matters here: two divergences in the focus ring between what
this library renders and what Crystal's site renders — the elevation layers and
the dark-mode feather alphas — both recorded in D-11 and both Meridian's to
decide. Do not resolve either by changing this library.

Add to the list rather than carrying a defect in your head.

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
| Named Crystal React, published as `@crystal-ui/react` | §3.9 | set |
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

### 2.5 `@crystal-ui/core` is the base package

The design system publishes as `@crystal-ui/core`; this library is `@crystal-ui/react`. Both sit
under the `@crystal-ui` scope. Crystal React consumes `@crystal-ui/core` and never vendors it —
it is `external` in the bundle, so a consumer resolves one copy of the token set.

`@crystal-ui/core` is **published** — `^2.0.0` from the public npm registry, and
the lockfile resolves to the registry tarball. It was a `file:` path into a
sibling checkout until 20 September 2026, which is a thing that works on one
contributor's disk and nowhere else; CI checked Crystal out beside this
repository to make it true there, and the push ordering between the two was a
trap with its own tracker entry.

None of that is needed now, and the workarounds came out with it: no sibling
checkout in CI, no `optimizeDeps.force` in Storybook. A published version is
immutable, so Vite's pre-bundle cache cannot go stale against an edit — which is
the entire hazard that flag existed for.

If you ever need to develop a change across both repositories, `pnpm link
../crystal-design-system/core` is the way, and it brings the stale-pre-bundle
hazard back with it: run Storybook with `--force` for that session. Do not
commit the linked range.

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
| Composition utilities | `react-aria` (`mergeProps`, `useObjectRef`) | Apache-2.0 | Prop and ref merging that every component needs; hand-rolled versions of both existed here first |

**Scrolling defers to React Aria wherever React Aria has an answer.** Meridian asked
for this explicitly, and it is worth writing down what the answer turns out to be,
because it is narrower than it sounds. React Aria ships **no scroll-area primitive**;
its one scrolling API is `usePreventScroll`, the modal scroll lock, which `Dialog`
already receives through React Aria's own `Modal` rather than from anything Crystal
wrote. So Crystal's `ScrollArea` is not a reimplementation of something React Aria
offers — it is the container React Aria leaves to the design system, and what it
contributes is Crystal's two scrollbars, the scroll contract and the edge fade.

Where React Aria *does* own scrolling, the components that need it take it and do not
repeat it:

| Scrolling concern | Owner |
| --- | --- |
| Modal scroll lock | React Aria `Modal` (`usePreventScroll`) |
| Keyboard scroll-into-view inside a collection | React Aria collections |
| Virtualised scrolling | React Aria `Virtualizer`, with `@tanstack/react-virtual` only where a collection is not involved |
| Infinite scroll sentinels | React Aria's `*LoadMoreItem` components |
| Focus containment and restoration | React Aria `FocusScope` |
| The scroll container, its scrollbar and its edge fade | Crystal |

Every one is MIT, ISC or Apache-2.0. No paid licence, and no licence that becomes
paid at a usage threshold.

**Motion for React also removes GSAP.** `@crystal-ui/core` depends on GSAP for
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

1. **`@crystal-ui/core` stylesheets** — the reset, the material primitives and the resolved
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

- `CrystalProvider` wraps `@crystal-ui/core/core/preferences`. Normalisation, clamps, choices
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

`@crystal-ui/react`, ESM + CJS + types, `sideEffects` declaring the SCSS. Changesets for
versioning. Peer range React 18.2 and 19.

### 3.10 Documentation website

A real documentation site, at the standard set by MUI, Mantine, PrimeReact and
Blueprint: every component gets a page with an explanation, isolated visual
examples, the code for each, a generated props table, and its accessibility and
material notes.

**Not `crystal-preview`.** That is Crystal's site: it documents the design
system, it installs `@crystal-ui/core`, and it renders the specification that
ships inside that package. It says what a material *is*. This site says what a
React component *does* — props, accessibility, the code that runs. Two audiences
and two sources of truth; merging them would mean one of the two repositories
documenting the other's API, which is the cross-repository coupling the split
just removed.

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
motion notes come from `@crystal-ui/core`'s catalogue, so a component added to the
catalogue appears in the documentation without anybody remembering to add it.

Beyond the component pages: getting started per framework, theming and the token
reference, the material hierarchy, motion, accessibility, forms, and a migration
note for each benchmark library. Local search over a generated index. And
`llms.txt` plus the component manifest (§3.7) are served from the site, so the
documentation is machine-readable at the same URL a person reads.

---

## 4. Scope — 285 entries

The catalogue lives in `core/tokens/catalogue/`; `libraries/parity.json` is
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

**"Story" is not documentation here; it is the address three of the six gates use.**
`verify-targets.mjs`, the rendered half of `verify-theme.mjs` and the visual frames all
reach a component by navigating to a story ID, so a component with no story is not
failing those gates — it is outside them, and the suite stays green. Slice I was shipped
without stories and CI passed; writing them afterwards turned three gates red on three
real defects, two of which no unit test could have caught because the element did report
the role each test asked for and the tree around it was what was wrong. The third was a
32px-wide target, which jsdom cannot see at all: it reports every box as zero. See R-18
in `docs/closed-issues.md`.

So: a component that carries a finger target also needs a **case in
`scripts/verify-targets.mjs`**, and `LEAST_PROBES` raised to the new count. A state that
matters and is reachable only by operating a control — a collapsed rail, a modal window —
needs a **story of its own**, because a gate can address a story and cannot address a
state behind a click.

### C — Foundation (in progress)

Repo, build, tokens, theme, motion, testing, Storybook, `llms.txt`.

- [x] Repository, separate from the design system, remote `boomerbowser/crystal-react`
- [x] `package.json` as `@crystal-ui/react`; Vite library build; ESM + CJS; `preserveModules`
- [x] TypeScript strict with the stricter flags; declarations emitted by `tsc`
- [x] `scripts/build-tokens.mjs` — the single point where values enter
- [x] `scripts/lint-tokens.mjs` — fails on a hard-coded colour or length
- [x] `CrystalProvider`, the theme object, six hooks, per-element scoping, 7 tests
  — and, since R-12, a browser gate that every property the stylesheets read
  resolves on the themed scope *and* on the container overlays are portalled
  into. The provider was built first and correctly; what was missing was proof
  that what it publishes survives to the served page.
- [x] **The environment, per component.** Every adjustable value in Crystal's own
  "Make it yours" panel is a Storybook toolbar control — palette, appearance,
  colour atmosphere, Frost base tint, elevation, corner radius, density,
  direction, animation speed, reduced motion, reduced effects — and each can be
  pinned per story through `parameters.crystal`, so a component whose subject is
  an environment can show one and a browser gate can measure a fixed one.

  Colour atmosphere mattered most and was the one with no way to reach it. Crystal's
  materials are defined by what is behind them, the decorator painted a flat
  canvas, and every material in every story therefore rendered as white. See R-13.
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

- [x] **Task C-1 — export the motion presets from `@crystal-ui/core`.** Done:
      `assets/core/presets.js` is a pure module, `motion.js` consumes it rather than
      keeping its own copy, and `usePreset` consumes it from React. The decorative paint
      layers stay behind in the web runtime, because animated `box-shadow`,
      `border-radius` and `background-position` cannot be composited and do not port.

### D — Utility and layout (39) — complete

**Done.**

- [x] `scroll-area` — taken out of order, because Meridian reported the scrolling
      problem from a phone and it had to be fixed in both places at once. Carries
      Crystal's two scrollbars by class rather than restating their CSS, drives the
      edge fade through `data-cr-scroll`, and becomes a tab stop only when it
      scrolls and holds nothing focusable.
- [x] `container` — the shell ceiling and the reading ceiling, which are different
      numbers for different reasons. Introduces no landmark, which the catalogue
      states in as many words.
- [x] `stack`, `group` — one box turned ninety degrees, two exports because that is
      the vocabulary a product reads. Gap as a custom property rather than seven
      classes per component.
- [x] `grid`, `simple-grid` — twelve columns with spans per breakpoint, and the
      auto-flowing pair that needs no breakpoint props at all. A cell with no span
      is full width: a forgotten prop produces a readable stack, not slivers.
- [x] `center`, `space`, `aspect-ratio` — `space` is `aria-hidden`, because the
      catalogue forbids using it to convey grouping and an empty div is announced
      as a blank item by some screen readers.
- [x] `divider` — decoration when unlabelled, a named `separator` when labelled.
      The name comes from `aria-labelledby`, because `separator` is not a
      name-from-content role and a label left as a child text node is announced as
      nothing.
- [x] `visually-hidden`, `skip-link` — React Aria owns the clipping recipe; Crystal
      owns the pill the skip link becomes on focus, and the part every product gets
      wrong: focusing the target rather than only scrolling to it.
- [x] `focus-trap` — React Aria's `FocusScope`, as the catalogue instructs ("use a
      maintained primitive rather than rebuilding it"), with Crystal's rule stated
      around it: never trap without a visible, keyboard-reachable exit.
- [x] `click-away` — React Aria's `useInteractOutside`, plus Escape, because
      Crystal's rule is that dismissal is never *only* a click-away and a keyboard
      user has no outside to click.
- [x] `no-ssr` — `useIsSSR`, tied to React's hydration signal rather than a
      `useEffect` flag, so there is no mismatch to warn about.
- [x] `focusable`, `pressable` — React Aria's behaviour with Crystal's appearance.
      `Pressable` also supplies the role React Aria deliberately leaves out: a bare
      React Aria `Pressable` is a tab stop a screen reader announces as nothing,
      and the catalogue asks for button semantics unless told otherwise.

Two tokens entered Crystal for this slice, because the catalogue makes both
Crystal's obligation and neither existed: the **spacing scale** and the
**breakpoints**, plus the shell's ceilings, gutters and minimum cell width. Values
a library has to invent are values that drift.

**Also done — providers, scopes and the two React Aria wrappers.**

- [x] `theme-provider` — `CrystalProvider`, which already was this; it gained the
      three things the catalogue asks for and it did not have. It declares
      `color-scheme`, so native controls and the browser's own scrollbars follow
      the mode rather than staying light inside a dark scope. It resolves
      `mode="system"` against `prefers-color-scheme` — a preference, never a
      resolved value, because a component asking "am I dark?" needs an answer. And
      it honours `prefers-reduced-transparency` and `forced-colors` on its own, so
      a product that never thought about either still respects them; an explicit
      `effects` prop can only ever reduce further, never restore.
- [x] `direction-provider` — a `CrystalProvider` underneath rather than a second
      mechanism. It also hands React Aria a locale, which is the half a `dir`
      attribute cannot do: React Aria calculates placement in JavaScript, and a
      calculation does not read an attribute.
- [x] `reduced-effects` — the explicit product preference. The system's own
      setting is already honoured above it.
- [x] `global-styles` — paints the document from the resolved scope, restores what
      it found on unmount, and deliberately touches neither focus visibility nor
      motion preferences. A reset may normalise appearance; it may not remove an
      affordance or overrule a preference somebody expressed to their operating
      system.
- [x] `router-provider`, `ssr-provider` — React Aria's, re-exported with Crystal's
      reason attached. `SSRProvider` does nothing on React 18 and later, which is
      this library's floor; it is shipped so the name exists where somebody looks
      for it and the reason is written down rather than folklore.
- [x] `toolbar` — React Aria's roving tab index and arrow handling, Crystal's
      material and geometry. One tab stop for a group of controls is an
      accessibility decision, not a layout one: a formatting bar of fifteen
      buttons is otherwise fifteen stops between a person and the next field.
- [x] `transition` — `usePreset` and `AnimatePresence`, and deliberately thin.
      Everything it could decide is decided in `@crystal-ui/core`, and a transition
      component carrying its own durations is a second motion system. It renders a
      real wrapper rather than `display: contents`, because an element that
      generates no box cannot be faded — which would silently remove the exit
      animation it exists for.

**Also done — the standalone five.**

- [x] `watermark` — a tiled SVG on a pseudo-element, so it is outside the
      accessibility tree by construction rather than by `aria-hidden`, and
      `pointer-events: none` because a wash that eats clicks makes the content
      under it unusable. The opacity is clamped: past a few percent the mark
      competes with body text, and text read through a pattern is text whose
      contrast ratio no longer means what it says.
- [x] `qr-code` — `qrcode.react` (ISC) renders it; Crystal owns the Haze quiet
      zone and the contrast floor. The code's two colours are the one place in
      this library where a colour is deliberately not a token: a scanner reads
      luminance, and a palette-tinted code is a decoration that scans in good
      light and fails in bad. The encoded value is always available as text.
- [x] `masonry` — CSS columns rather than a JavaScript packing pass, which reflows
      on every resize and produces an order a screen reader walks differently from
      a sighted reader. A list only when the items are a set, because the visual
      order really is columnar.
- [x] `animate-on-scroll` — content is present and readable before the animation
      runs, never revealed by it. So no `opacity: 0` waiting to be undone: a
      reader whose observer never fires, or whose JavaScript failed, gets the page
      rather than a blank one. Only entry recipes are accepted, and the rest are
      refused rather than accepted and ignored.
- [x] `overflow-list` — measures itself with the row laid out but invisible, so
      the overflowing state is never seen for a frame. Hidden items move into an
      affordance that names its count rather than being clipped away; priority
      order is the product's, in child order.

**Also done — the application frame and manipulation.**

- [x] `app-shell` — the material assignment of a whole view in one place: Plastic
      underneath, Frost for the supporting panels, Resin for the floating
      destination group. The landmarks with **one main per view**, which is why
      the regions are props rather than children a caller arranges. The content
      scrolls, not the page — a sticky header does not hold inside a grid whose
      header row is exactly as tall as the header — and both scrolling regions
      take Crystal's Frost scrollbar.
- [x] `app-bar` — Frost band, full-bleed, actions as pills, elevation earned on
      scroll rather than worn at rest. Declining the banner role means rendering a
      `div`: a `header` outside sectioning content *is* a banner implicitly, so a
      role alone would not have taken it away.
- [x] `resizable` — React Aria's `useMove`, which reports movement from a pointer
      and from the arrow keys through one interface, so the keyboard path is not a
      second implementation that drifts. A `separator` with `aria-valuenow`, so the
      size is announced as it changes rather than "something was grabbed".
- [x] `drag-handle`, `drop-indicator` — React Aria's `useDrag`, whose keyboard path
      is the same state machine rather than a fallback beside the pointer one. That
      is the whole reason to take it: a hand-rolled drag is where the keyboard path
      is invariably missing, because the pointer version looks finished. Crystal
      owns the lift, the settle and the indicator's material.
- [x] `virtualizer` — React Aria's, re-exported with its layouts. The hard part is
      not the windowing; it is `aria-setsize`/`aria-posinset` across recycling and
      not dropping focus when a focused row is reused, and only a virtualizer
      integrated with its collections gets those for free.
- [x] `shared-element-transition` — Motion's `layoutId` inside `AnimatePresence`.
      Removed entirely under reduced motion rather than damped, which is the
      catalogue's wording and the right reading: a slower moving object is still a
      moving object.

**Slice D is complete**: 37 implemented, 2 recorded `not-applicable` (`terminal`
and `border-beam`, with reasons in the catalogue).

\* recorded `not-applicable`, with the reason in the catalogue.

### E — Typography and actions (26) — complete

**The scale moved upstream first.** Crystal specified a reading rhythm and no
scale, so this library had derived six steps of its own — three tables of ratios,
leadings and trackings that no other platform could see. They are Crystal's tokens
now, reaching CSS as `--cr-text-<step>-*`, and six `crystal-allow-literal` markers
reading "pending a type-scale token" became tokens with them. Two icon sizes came
along: 20px, which Crystal's reset has always drawn an icon at, and 24px, the
catalogue's size inside an icon button.

- [x] `title`, `heading`, `display`, `lead` — `Title`, `Display`, `Lead`. **The
      level and the step are chosen separately**, which the catalogue states twice
      and which is the whole design: a component where `level={2}` also means
      "medium" forces a choice between a correct outline and a correct appearance,
      and products choose appearance. `Lead` stays a paragraph, because a
      standfirst in the document outline is a sentence of copy pretending to be
      structure.
- [x] `text`, `truncate`, `text-balance` — truncation clamps rather than cutting,
      so the text is hidden from sight and not from the DOM, and the full value
      comes back through `title`. `Truncate`'s expand control appears only when
      there is something to reveal: one that does nothing still costs a keyboard
      user a tab stop to find that out.
- [x] `prose`, `prose-list`, `blockquote`, `cite`, `abbreviation` — `Prose` is the
      one place a stylesheet reaches its descendants, because the alternative is
      asking a content author to know Crystal. `Cite` names a work rather than a
      person, and `Abbr` is focusable, because an expansion shown only on hover is
      no use without a pointer.
- [x] `mark`, `highlight` — the matched string stays one readable sentence with
      `mark` elements inside it, rather than an array of fragments a screen reader
      reads as fragments. The query is escaped: a search for `c++` is an input a
      person is allowed to make.
- [x] `number-formatter` — one string, visible and spoken. "1.2M" on screen and
      1204893 in an `aria-label` is two facts that drift, and the one a screen
      reader reads is the one nobody checks.
- [x] `code-block`, `copy-button` — a named region and a tab stop, because a
      sample wider than its column scrolls and a scroll container with nothing
      focusable is unreachable without a pointer. The copy control names what it
      copied, and the confirmation goes to a live region: a label that changes is
      a visual event until something says it.
- [x] `gradient-text` — every point along the gradient clears the contrast floor,
      because it runs between palette colours that already do. The solid colour
      under the clip is one of them, so an unsupported clip leaves coloured text
      rather than transparent text.
- [x] `icon-button`, `close-button` — `label` is required rather than
      optional-with-a-warning, which makes an unnamed icon button a compile error
      instead of an audit finding. `CloseButton` names *what* closes: a page with
      three dismissible things otherwise has three buttons called "Close".
- [x] `button-group`, `split-button` — pill outside, square inside, one plane. The
      role is earned by a name, because an unnamed group announces "group" and
      tells the reader nothing. A split button is two buttons: a control that
      behaves differently depending on which half was pressed cannot be described
      to somebody who cannot see the halves.
- [x] `floating-action`, `speed-dial`, `action-bar` — Resin at the float
      elevation, with the safe-area offset. A dial's actions keep visible labels,
      because an icon in a set that appeared a moment ago has no context to be read
      from. The action bar announces its count: the bar appearing and the size of
      the selection are the same piece of news.

### F — Inputs, part one (26 of 52) — complete

**One anatomy, shared by mixins.** Every text-shaped control is a label, a Haze
well inside a Resin shell, and helper text or an error beneath. That lives in
`styles/_field.scss` rather than in ten stylesheets, because ten descriptions of
one material diverge the first time one of them changes — CONTRACT §1 applied
inside a library rather than across one.

- [x] `form-field`, `fieldset`, `helper-text` — the wiring is the whole component:
      the label points at the control, `aria-describedby` carries the hint **and**
      the error (describing a field by only its error drops the guidance that
      would have prevented it), and the error is text with a mark, never colour.
- [x] `text-input`, `textarea`, `number-input`, `password-input`, `search-input`,
      `mask-input`, `json-input`, `pin-input` — the reveal toggle is a named
      button with `aria-pressed`, because whether the password is currently
      visible is a privacy question; the search landmark is opt-in, because two
      landmarks are worse than none; the mask reports the **raw** value, because a
      form that receives `(555) 012-3456` has pushed the formatting problem to a
      server that will disagree about it; and a pasted code fills every box.
- [x] `select`, `native-select`, `multi-select` — two components because a native
      select is the right answer more often than a built one: on a phone it opens
      the platform picker. Selection is label weight, never a check mark.
- [x] `checkbox`, `checkbox-group`, `radio`, `radio-group`, `switch`,
      `segmented-control`, `chip`, `rating` — indeterminate through the property
      and not a class; the switch's state never rests on position alone; the
      segmented control is a radio group and never borrows tab semantics; a
      rating is never symbol-only.
- [x] `slider`, `range-slider`, `angle-slider`, `knob` — `aria-valuetext` so a
      slider announces "£24" rather than "24", and a range slider is **two**
      sliders with distinct names, because a reader moving the lower bound must
      not be told the upper one. The dials share `useMove` with `Resizable`, which
      is how "keyboard steps match the slider contract" stays true.

Eight more tokens entered Crystal for this slice, every one of them a figure the
catalogue already stated in prose: the choice box and its radius, the switch
track, the slider track and thumb, the chip height, and the well inset.

### G — Inputs, part two (26 of 52) — complete

- [x] `combobox`, `autocomplete` — one React Aria primitive with a different
      policy on free text. Focus never leaves the field; the highlighted row is
      named by `aria-activedescendant`, which is what lets typing continue while
      the list is open. Empty and loading are surfaces, not an absent popover.
- [x] `tags-input`, `token-field` — additions and removals are announced, a
      duplicate is refused **and says why**, and focus returns to the entry after
      a removal: removing the last chip destroys the element that had focus, and
      the browser then focuses the body, dropping a keyboard user out of the form.
- [x] `color-input`, `color-area`, `color-slider`, `color-wheel`, `color-swatch`,
      `color-swatch-picker` — colour is never the only representation, in six
      components whose entire subject is a colour. The thumb is two rings, white
      inside dark, because a single-colour border disappears against part of the
      gamut it sits on. A hue slider handed a hex converts rather than throwing.
- [x] `date-input`, `time-input`, `date-picker`, `date-range-picker`,
      `date-time-picker`, `month-picker`, `year-picker`, `digital-clock` — a row
      of segments, each its own spin button, so a date is enterable in any locale
      without knowing the order. An unset segment shows `dd`: `01` is an answer
      nobody gave. All the arithmetic is `@internationalized/date`.
- [x] `file-input`, `dropzone`, `upload`, `upload-zone` — a drop surface always
      contains a real button, because dragging needs a pointer, a steady hand and
      sight of both ends of the gesture. Progress is a number as well as a bar.
- [x] `transfer`, `cascader` — Transfer moves items with named controls rather
      than a drag, which is the catalogue's requirement and the reason it is two
      listboxes. Cascader announces the whole path, and a branch says it is one
      in its **name** rather than as a silent chevron.
- [x] `rich-text-surface`, `mentions` — Crystal owns the chrome, the product owns
      the engine, which is what the catalogue says: "the entire editing engine,
      serialisation and paste handling". **The plan's dependency table names
      `@tiptap/react` for this; reading the catalogue, no engine belongs in the
      library**, and bundling one would impose a large dependency on every
      consumer for a component most will not use. The toolbar reports active
      formatting with `aria-pressed`, which is the only thing a formatting
      toolbar is for.

### H — Forms — complete

`useCrystalForm`, `Form`, and the Standard Schema types, in `src/form/`.

- **Standard Schema v1 declared locally, not depended on.** `@standard-schema/spec`
  is that interface and nothing else; a package in the tree for twenty lines of
  frozen type is the wrong trade. Zod, Valibot and ArkType all work untouched and
  none is a dependency. Tested against Valibot as a devDependency, because a
  hand-rolled `~standard` object proves only that the hook can read a shape it was
  written against.
- **Native validation stays on.** React Aria's `Form` sets `noValidate` only when
  `validationBehavior` is not `'native'`, so the browser blocks a structurally
  invalid submit before the schema runs. A field already declares `isRequired`;
  making the schema restate it would be §1's redeclaration with rules instead of
  values. The browser checks shape, the schema checks meaning, the server checks
  truth.
- **An issue with no path is a form error**, not a field's. "One of these two is
  required" is true of the form and of neither field.
- **Submission state as a data attribute**, so the stylesheet dresses it.
- **The double-submit guard is a ref**, because Enter in a text field submits
  whatever the button is doing and state read inside the handler still says idle.
- **`valuesFromForm` does not coerce.** Strings and `File`s as the browser reports
  them; a repeated name becomes an array; an unchecked checkbox is absent. Pinned
  by a test rather than assumed.

**Building it found two defects older than the slice.**

Every field coerced `isInvalid` with `?? Boolean(errorMessage)`. React Aria treats
a *defined* `isInvalid` as "the caller owns validity from here", so an untouched
field handed it `false` — which is not "this field is fine" but "stop working out
whether it is". Native validation never reached a field, and neither did any error
a `Form` distributed. Ten call sites fixed via `declaredInvalid`, with a test that
puts every named field inside a `Form` carrying an error and asks whether it
noticed. The temporal family accepted no `name` at all, so a date could not be
submitted or matched to an error; it does now.

And `--cr-focus-core` / `--cr-focus-ring` were read by every field and defined by
nothing, so Crystal's focus ring painted on no control in the library. Crystal now
publishes the recipe; `src/theme/published-properties.test.tsx` reads every
`var(--cr-…)` in every stylesheet here and fails on any that Crystal does not
publish and no component sets itself.

### I — Navigation and overlays (28) — complete

`anchor`, `nav-link`, `nav-rail`, `dock`, `breadcrumbs`, `tabs`, `pagination`, `stepper`, `burger`, `command-palette`, `tree-view`, `affix`, `bottom-navigation`, `navigation-menu`, `table-of-contents`, `menubar`, `submenu`, `dialog`, `drawer`, `menu`, `context-menu`, `popover`, `hover-card`, `tooltip`, `scrim`, `portal`, `floating-window`, `overlay-arrow`.

- [x] **The overlay surfaces** — `scrim`, `overlay-arrow`, `popover`,
  `tooltip`, `dialog`, `menu`, `context-menu`, `submenu`. **Resin never contains
  Resin**, and the DOM cannot enforce it: every overlay is portalled to `body` and
  loses its nesting on the way. A `Dialog` declares the material it presents and
  an overlay inside it reads that through React context, which follows the
  element tree rather than the document.
- [x] **`tabs` and `breadcrumbs`.** The tab strip and the segmented control are
  the same material and different semantics, so the strip moved into
  `styles/_strip.scss` before the second one could copy the first. Proved to be a
  no-op by compiling the segmented control's stylesheet before and after and
  diffing the declarations.

  Three things the unit tests found that reading the source would not: React
  Aria's `Breadcrumbs` renders a bare `<ol>` and supplies **no `nav` landmark**;
  `MenuTrigger` hands its press behaviour down through context, so a plain
  `<button>` child silently never opens the menu; and "1 hidden breadcrumb" was
  unreachable, because a collapse always hides `length - 2`. The last became a
  decision — a trail shorter than four now refuses to collapse, since hiding one
  crumb costs a click and saves no room.

  And one the browser found: **a tab was a 36px target against a stated 44px
  floor**, as the segmented control's pills had been since they shipped. See
  `scripts/verify-targets.mjs`, which now measures it.
- [x] **`anchor` and `nav-link`.** Both require an `href`, which is the
  catalogue's rule — "a link that acts is a button, not a link" — enforced in the
  type rather than documented beside it. React Aria renders a `<span role="link">`
  when given none, and the result announces as a link while being absent from the
  browser's link list, unopenable in a new tab and silent in the status bar.

  The nav link reserves the current-location dot's room whether or not the dot is
  drawn, and there is a story whose only job is to show the label not moving
  between two states. A column that appears only for the current entry is the
  defect that had the leading selection mark withdrawn from Crystal; drawing one
  here that shifted the label would reintroduce it under a new name. Measured in
  a browser: one distinct label position across all four rows.

  `component.anchor.underlineOffset` (4px) is new in Crystal. The catalogue
  states the value and there was nowhere honest to read it from — and borrowing
  `spacing.2xs` for a typographic offset is exactly how `selection.railWidth`
  became a generic 3px line.

  One naming defect the tests caught: a nav link with trailing content announced
  as "Inbox12", because the accessible name computation joins adjacent inline
  content with nothing between it.
- [x] **`tree-view` and `table-of-contents`.** Both mark their current row with
  label weight and put nothing in the leading space, because in both that space
  already means depth.

  The tree is a **`treegrid`**, not a `tree`. A `treeitem` in the plain tree
  pattern must not contain independently focusable widgets and Crystal's row
  contains the disclosure the catalogue asks for; the two cannot both be
  honoured. Level, expansion and full arrow-key navigation are all present.
  Raised as M-3 for Meridian, because changing the catalogue is their call.

  The table of contents is **controlled**: the catalogue puts "which headings are
  collected, scroll spy thresholds" with the product, so the component is told
  which entry is active and `useHeadingInView` ships beside it.

  Four defects, and the last three are the reason
  `scripts/verify-behaviour.mjs` now exists:

  - The tree animated its own rows on first render. The mechanism was React's
    effect ordering — children before parents — and it does not apply, because
    React Aria builds its collection in one commit and renders rows in the next,
    so *every* row mounts after the tree's mount effect. Replaced with a flag set
    on the first expand.
  - `rootMargin: '-20% 0px -80% 0px'`, the usual spelling of a reading line a
    fifth of the way down, is a band of **zero height** and nothing intersects a
    rectangle with no area. Two of five headings were never marked.
  - Given a real band, the last entry was unreachable: a short final section
    cannot push itself to the reading line.
  - Detecting the end of the scroll inside the observer's callback does not help,
    because reaching the end is not a crossing and the callback never runs.

  The spy is a passive scroll listener now, coalesced to one read per frame. It
  has none of those edge cases, and unlike the observer it works in the in-app
  preview browser, which delivers no `IntersectionObserver` callbacks at all
  (D-5).
- [x] **`drawer`.** "Modality must be real, not implied" is the catalogue's
  wording and the whole design: `isModal` picks between two different
  constructions, not two appearances. Modal is a React Aria `Modal` — focus
  contained, the page `inert`, Escape, scroll locked, focus returned, a Mirage
  scrim. Non-modal is a `complementary` landmark with no scrim, no trap and no
  lock. There is no way to ask for one's look with the other's behaviour, and
  both directions are gated.

  **`useMotion` gained `reorient`.** Crystal authors `drawer-in` once, from the
  right, with a physical `translateX(105%)`. CSS mirrors `padding-inline-start`
  and cannot mirror a transform, so that recipe is wrong on three of four edges
  and in every right-to-left page — and right-to-left is a verified axis in
  Crystal. `reorientRecipe` negates the inline component or turns the movement
  onto the block axis, carrying the fitted spring, the duration and the offsets
  through untouched. Authoring three more recipes would have been authoring three
  more specifications.

  Two defects: the close control in the modal drawer had **no handler at all**
  — `Dialog`'s children were passed directly rather than through its render
  prop, so the button rendered, focused, pressed and did nothing. And an
  inline-end drawer sat **151px clear of the right-hand edge**, because a
  shrink-to-fit holder anchors its content at its start. Both are now gated.

**Complete.** All 28: navigation 17, overlays 11. The twelve that were
outstanding are below, with what each had to get right.

- [x] **`portal`.** The mechanism, exposed. Every overlay here already portals,
  which is why this was easy to believe done — but a product needing the same
  escape for its own content had nothing to reach for. Two properties are
  tested rather than assumed: React context survives the portal, which is what
  makes `SurfaceProvider` and "Resin never contains Resin" enforceable; and the
  container is resolved in an effect, because `document` does not exist while
  rendering on the server and `createPortal` throws.
- [x] **`hover-card`.** Opens on hover *or focus*, after a delay, and survives
  the pointer's journey from trigger into card. That journey is the whole
  component: a boolean closes at the moment the pointer leaves the trigger and
  has not yet entered the card, so it counts instead — the same intent counter
  the disclosure, popover, menu and toast closures already use.
- [x] **`floating-window`.** The only component in this slice that is not a
  React Aria primitive, so its keyboard model is designed rather than
  inherited: the title bar is a real control, arrow keys move it, Shift widens
  the step, a modifier resizes, and Home returns it. A window that can only be
  moved with a pointer is a window half the users cannot move, and it looks
  complete to anyone testing with a mouse. Bounds are clamped on the way in
  rather than corrected afterwards — a window dropped past a corner cannot be
  recovered by pointer *or* keyboard, because both need the handle.
- [x] **`nav-rail`, `dock`, `bottom-navigation`.** Three shapes of one idea at
  three densities, and the catalogue distinguishes them by material: a Frost
  rail with a Resin active destination, one Resin dock plane whose labels share
  a single Stone backing, and a Resin bar holding Haze label fills. One plane
  for the dock, because a row of separate Resin pills is Resin beside Resin.
  None of the three draws anything beside a label; the active destination
  changes its own material and its label weight.
- [x] **`navigation-menu`, `menubar`.** These exist separately because their
  roles are not interchangeable and choosing by appearance is how the wrong one
  gets used. A menubar is an application's command surface — `role="menubar"`,
  one tab stop, arrow keys between triggers, wrapping, Home and End, and the
  roving index remembers where you left. A navigation menu is *not* a menu: it
  is a `nav` of disclosure buttons opening panels of ordinary links, because
  announcing a link as a `menuitem` says that following it runs a command, and
  the menu keyboard model forbids Tab between items a reader expects to Tab
  through.
- [x] **`pagination`, `stepper`.** Both announce their position rather than
  drawing it. Every page control is named "Page 3"; the ellipsis is not a
  control and no button's name contains it; the arrows are disabled at the
  bounds rather than removed, because a control that disappears changes the
  row's shape and moves every other target. Each step says its position, label
  and state in words — "Step 2 of 4: Details, current" — and nothing in a
  stepper is focusable unless navigation is real.
- [x] **`burger`.** A disclosure that owes a name, `aria-expanded` and
  `aria-controls`, and whose name does not change with its state: changing it
  re-announces the control as a different element to a reader who tabs back.
  The one place in this slice where motion carries meaning, so `icon-turn`
  plays it and the cross is a CSS end state, correct at rest whether or not it
  animated.
- [x] **`affix`.** A passive scroll listener rather than
  `IntersectionObserver`, which delivers nothing in the in-app preview browser
  (D-5). The placeholder is the component: pinning takes the element out of the
  flow and its height with it, and releasing restores the height, which scrolls
  the threshold back under the element and pins it again.

---

### J — Data display (37) — 35 of 37

`card`, `table`, `data-table`, `list`, `description-list`, `avatar`, `avatar-group`, `badge`, `status-badge`, `indicator`, `image`, `timeline`, `accordion`, `collapse`, `spoiler`, `carousel`, `statistic`, `code`, `kbd`, `theme-icon`, `authored-bubble`, `caption`, `calendar`, `data-view`, `virtual-scroller`, `image-list`, `organization-chart`, `rolling-number`, `image-compare`, `marquee`, `overlay-badge`, `navigation-tree`, `resizable-table`, `stat-card`, `kpi-tile`, `trend-indicator`, `delta-badge`.

Ends with `data-table`, the hardest component in the catalogue: sorting,
selection, resizing, virtualisation and drag-and-drop — every one of which React
Aria supplies, and every one of which needs a keyboard path as well as a pointer
one.

- [x] `card` — see slice C, where it was built as the first Haze surface.
- [x] **The small labels** — `badge`, `status-badge`. Both are counts or words on
  a Resin shell, and both turned out to be accessibility components rather than
  geometry ones. A badge's visual is always `aria-hidden`: a loose "3" announced
  beside a button leaves a listener to guess what the 3 belongs to, so the meaning
  travels as a whole sentence in a live region or not at all, and `description` is
  deliberately not defaulted to the count. A status badge puts the semantic pair
  on the **well** and leaves the pill Resin with ordinary text — which is what
  Crystal's own cascade produces, `crystal.reset` painting the chip in
  `--status-surface` and `crystal.component`'s control rule then overriding both
  the background and the colour. A status-coloured pill would make the word
  decoration on a coloured ground, and a status-coloured perimeter is the shape
  Crystal uses for focus.

  The catalogue's "36px minimum height" is a floor rather than the height: twelve
  pixels of block padding either side of a 24px well is 48px of content box, and
  the pill renders at 50px with its rim, which is what the preview has always
  shown. Both numbers are true, and the floor is what protects the pill when the
  word is set at a smaller step.
- [x] **`code`, `kbd`** — the two surfaces that are deliberately *not* Crystal
  materials in the ordinary way. "Never feathered, as code must stay exact": a
  softened edge around a fragment of syntax reads as imprecision in the thing
  being quoted, so `Code` takes a canvas fill and an edge rim, the flattest
  surface Crystal has. A block is a tab stop with a Resin scrollbar, because a
  sample wider than its column scrolls and a scroll container with nothing
  focusable in it is unreachable without a pointer. `Kbd` is Resin plus one extra
  inset highlight along the bottom edge — the difference between glass and a key
  you could press — and carries no Haze fill, because the fill's own 8px inset is
  wider than the cap's padding.

  `Code` stops where `CodeBlock` starts: the catalogue lists both, and the split
  is that `CodeBlock` is the documented sample with a filename, a named region and
  a copy control in a header, while `Code` is the typographic primitive.
- [x] **`caption`, `theme-icon`.** A caption never replaces alt text — alt text
  says what the image *is*, for someone who cannot see it; a caption says what it
  *means*, to everyone — so `Caption` takes no `alt` prop at all, because offering
  one invites the two to be written as a single sentence. Overlaid, it sits on
  Stone, which exists for exactly this: a label over artwork, where contrast
  cannot be argued from the palette because the palette is whatever the photograph
  happens to be. `ThemeIcon` looks exactly like an icon button, so the difference
  is carried by what it does — no press handler, no hit area, not focusable — and
  it is `aria-hidden` unless it is the only carrier of meaning.
- [x] **`avatar`, `avatar-group`.** The fallback chain is the component: identity
  images fail routinely, and a broken image icon where a person's face should be
  is worse than never having tried, so the image is watched and replaced in place
  — and a new `src` starts again, without which a virtualised row shows one
  person's initials over another's photograph. The 2px ring is not decoration: it
  is the band of page surface that lets overlapping avatars read as separate
  people, which is why `AvatarGroup` needs no rule of its own to produce it. The
  stacking order counts *down*, so the first avatar is in front; source order
  gives the opposite and produces a row that looks identical until you notice
  every ring is cut by the avatar after it.

  The group is one named list and the people in it keep their names: the catalogue
  asks the group to *have* a name, not for its members to lose theirs. The
  overflow chip shows "+3" and announces "3 more", because "+3" read literally is
  a plus sign and a number.

- [x] **`indicator`.** The mark a control wears, and the one place in Crystal
  where the Haze feather is not 1.95px: the catalogue asks for "a 3px-inset Haze
  fill and a 1px feather", and at 20px across the system feather is a fifth of
  the mark's own radius. `styles/_material.scss`'s `haze-fill` mixin took a
  second argument for it, defaulted so that every other caller is unchanged.
  It is `aria-hidden` and has no hit area at all, because the control beside it
  already carries `aria-checked`, `aria-invalid`, `aria-current` or `aria-busy`.
- [x] **`image`.** The ratio is reserved before anything loads, which is the only
  reason this exists rather than an `img` tag. `alt` is required and may be
  empty: empty means decorative, absent means announced as a filename, and
  making the prop required forces the author to say which.
- [x] **`statistic`.** "Trend direction is stated in text, not by colour or arrow
  alone", so `trend` carries a direction *and* the words — the arrow is drawn
  beside them and hidden. `flat` takes the muted ink rather than a third status
  colour, because "no change" is not a status.
- [x] **`list`, `description-list`, `timeline`.** All three are arguments for
  using the real element. A row with an `onClick` on a div is not reachable by
  keyboard and cannot be opened in a new tab when it was really a link, so
  `ListItem` takes `href` or `onPress` and renders what each one means, with the
  trailing action as a *sibling* of the row's control because a button inside a
  button is invalid. A definition list is the only thing that keeps a term and
  its value associated when a reader moves through them out of order. And a
  timeline is an `ol` because the order is the meaning — plus the status said in
  words, since three of its four states differ only by the colour of a small
  circle.
- [x] **`collapse`, `spoiler`, `accordion`** — and the distinction between the
  first two, which is the whole of it. A collapse is *genuinely* hidden: the
  usual `max-height: 0` leaves a zero-height region full of focusable links a
  keyboard user can still tab into, so a closed region is not rendered at all. A
  spoiler is the opposite and deliberately so — it is a visual economy, and a
  reader who is not looking at the page has no reason to be given less of it, so
  the truncated text stays in the accessibility tree behind a mask. `Accordion`
  is React Aria's `DisclosureGroup`, which is what makes "only one at a time" a
  property of the group rather than of five rows each watching the others; the
  chevron's rotation is a CSS end state, correct at rest whether or not
  `icon-turn` ran, which is the rule `burger` established.

**The change this slice made to `useMotion`.** `play` now returns a promise that
settles when the movement finishes. Until it did, an *exit* recipe could not be
honoured at all: `accordion-out` and `list-out` mark a region closing, and a
region that unmounted the moment its state changed would play them into a
detached node. `usePreset` had solved this for the material presets and recipes
had no equivalent. Nothing has to await it — every existing caller marks an
arrival and ignores the result — and it settles on every path, reduced motion
and a missing element included. `Collapse` is the first caller to await it, and
its test asserts the region is *still there* on the tick after the state changed,
which is the half a `waitFor` alone would not catch.

`list-out` is still not played by the library, and the comment in `List` says why
rather than leaving it looking like an omission: the element of a removed row is
gone by the time the component hears about it, so an exit there belongs to
whoever owns the data and can hold the row — which the promise now lets them do.

- [x] **`trend-indicator`, `delta-badge`.** Both exist to hold one rule that is
  easy to state and easy to drop: direction is carried by a word and a symbol,
  never by colour alone, and the sign is a character rather than a colour.
  `TrendIndicator` makes the words a required child, because a direction with no
  words is a coloured arrow. `DeltaBadge` writes the sign itself — U+2212 MINUS
  SIGN, not the hyphen a keyboard produces, which is read as a hyphen by some
  screen readers and rendered at hyphen width by every font, so a column signed
  with hyphens does not line up. `Statistic` was rebuilt on `TrendIndicator` in
  the same change: two implementations of one rule is how one of them stops
  following it.
- [x] **`authored-bubble`.** The silhouette is Crystal's, value for value from
  `.cr-bubble`: three content-radius corners and one cut to 6px. The cut is
  written with *logical* radius properties, so the mirroring the catalogue asks
  for is expressed once rather than twice in a `[dir=rtl]` rule. `grouped` drops
  the cut, because in a run of messages from one author the cut marks where the
  run starts and repeating it turns a signal into a texture. `author` is required
  — "author and time are text, not implied by side alone" — and `arriving` is the
  caller's word rather than the component's guess, because Crystal's own note on
  `message-in` is "only on a new message; do not replay on virtualised history".
- [x] **`overlay-badge`.** A mark over a corner rather than a count attached to
  one, which is the distinction from `badge`. Two things are the component rather
  than a note: the fill is on a pseudo-element so the glyph above it stays crisp,
  and the wrapper does not clip, because "never clipped by its host" is broken by
  any caller who wraps a rounded image in `overflow: hidden`.
- [x] **`rolling-number`** — and the one place in this library where Crystal
  assigns no recipe and the component is nonetheless motion. `Card` plays nothing
  because the catalogue gives it nothing; here the anatomy *is* "a number that
  animates digit by digit", so refusing to move would be refusing to build it.
  The roll is built from Crystal's published motion **tokens** instead of an
  invented recipe: one digit of travel, `motion.duration.state`, and
  `motion.easing.settle`. The CSS does the same arithmetic `resolveDuration`
  does — `duration / speed`, and zero when `--cr-motion-enabled` is 0 — so the
  roll follows the same preference slider as every JS recipe without a second
  copy of the rule. The value is announced once it settles rather than on every
  frame, and its test asserts the announcement is *still the old value* on the
  tick after the change.

- [x] **`stat-card`, `kpi-tile`.** Both are `Card` and `Statistic` rather than a
  third implementation of either. The stat card's rule — "the figure and its
  trend are one readable sentence, not a number beside an arrow" — is a rule
  about *order*, which is the one thing a card can enforce: label, figure,
  period, trend, read straight down. The KPI tile's is that attainment is stated
  in words as well as shown, because a bar near its end and a bar past its end
  look the same and neither says whether past the end is good. `onTarget` is the
  caller's judgement and not a comparison the tile makes: a cost target is met by
  coming in *under* it, and a tile that decided for itself would report every
  saving as a miss.
- [x] **`marquee`** — the one component in Crystal whose default state is
  movement at rest, which is the rule Crystal otherwise holds absolutely. The
  catalogue lists it anyway and the reconciliation is in its own semantics line:
  "removed entirely under reduced motion". So the animation and the duplicate
  copy both go under reduced motion, the viewport takes a tab stop so "pausable
  on focus" means something without a pointer, and `speed` is a rate rather than
  a duration because a continuous scroll's duration is a fact about the caller's
  content. The measured duration arrives as a custom property so the stylesheet
  can still gate it with `--cr-motion-enabled` — an inline `animation-duration`
  would outrank the rule and quietly un-gate it.
- [x] **`image-list`.** A real `ul`, so a reader is told how many images there
  are before walking them, and `alt` required on every item exactly as `Image`
  requires it. The caption bar keeps the tile's radius on the two corners it
  meets, logically, so a right-to-left grid needs no second rule.
- [x] **`image-compare`**, and the defect `verify:targets` found in it. The
  divider is React Aria's slider — role, value, arrow keys, and `aria-valuetext`
  via `style: 'unit'` with the percent unit rather than `style: 'percent'`, which
  multiplies by a hundred and would announce "6,200%". The top picture is clipped
  rather than resized, because a width would squash it.

  The gate caught what review would not have: React Aria sets `position:
  relative` on the slider track *inline*, which outranks a class, so the track's
  `inset: 0` silently did not apply, the track collapsed to zero height, and the
  handle's `50%` put it at the very top of the frame with half of it clipped by
  the container's own `overflow: hidden`. The failure read "44×44, but the top of
  a 44px target is not on it" — the box was right and the position was not, which
  is the shape of defect a unit test cannot see and a screenshot might be
  forgiven for. Sizing the track instead of positioning it is the fix that
  survives the inline style. The handle carries `data-cr-handle` because React
  Aria's real `input[role=slider]` lives in a visually-hidden 1px box inside it,
  so probing the *named* element would have reported a 1px target — the same trap
  the segmented control's label hit in slice I.

- [x] **`table`**, which the rest of the data components stand on.
  `crystal.css` already carries a complete `.cr-table` treatment, so the
  stylesheet follows it value for value rather than choosing again — including
  the Haze fill inset **6px** rather than the usual 8, which is the one value
  here most likely to be "corrected" by somebody reading the Haze default, and
  the header band's top corners at `calc(var(--cr-radius) - 8px)`, which is how
  the catalogue's "header corners inset 8px" stays right when the radius slider
  moves.

  Two semantics, both easy to get wrong. Every header carries `scope`, because
  header association is what lets a reader hear "Seats, column 3, 12" while
  moving across a row, and no ARIA pattern recovers it once the elements are
  divs. And `aria-sort` goes on the `th` rather than on the button inside it,
  with exactly one column carrying it at a time — it describes the table's
  current order, not each column's capability, so a sortable column that is not
  sorted carries nothing. The test asserts both, by counting the elements that
  have it and checking the tag.

  The shell scrolls rather than the page, so it is a named tab stop with the
  Resin scrollbar `.cr-table-scroll` gives it: a compact horizontal scroller is a
  control plane, and a scroll container with nothing focusable in it cannot be
  reached without a pointer.

- [x] **`carousel`**, and the autoplay that is not there. Crystal's rule is that
  nothing moves at rest, the catalogue says "never autoplay without a pause
  control", and the recipes say "explicit next/previous navigation; never
  autoplay" — three statements of one thing, and the catalogue assigns autoplay
  *policy* to the product, so a product that must have it owns both the timer and
  the control. The movement is on the **arriving slide** rather than the track,
  because `carousel-next` and `carousel-previous` are a 3D swing-in and animating
  the track as well would move the same thing twice; the scroll itself is
  instant, by `scrollIntoView` rather than arithmetic on `scrollLeft`, which is
  negative in some engines in a right-to-left locale and zero-at-the-right in
  others. The index follows a passive scroll listener rather than an
  `IntersectionObserver`, which delivers nothing in the in-app preview browser
  (D-5).
- [x] **`navigation-tree`** — M-3's other half, and three things checked rather
  than assumed. React Aria's `NavigationTree` renders a **`treegrid` of pressable
  rows carrying `data-href`**, not a nested set of `a` elements, whatever the
  name suggests. It does **not** set `aria-current`: it computes `data-current`
  and `data-current-ancestor` for styling and stops, so the catalogue's
  "aria-current on the active destination" is this library's to supply — and
  supplying it took a third attempt, because passing the attribute to
  `NavigationTreeItem` typechecks and is then filtered out of the DOM, and
  putting it on the row's content leaves it on a descendant of the element a
  reader lands on. And a React context provider placed around a collection is not
  visible to the children React Aria renders *in its own pass*, which is what the
  second attempt failed on.
- [x] **`virtual-scroller`** — already implemented, and now named. It is React
  Aria's `Virtualizer`, re-exported, so the manifest's translation table maps the
  export to the catalogue id the way it does for `CrystalProvider`. What it did
  not have was the story R-18 taught this library to require: Crystal's half of
  this component is the *scroll surface*, which is composed rather than implied,
  and a component whose Crystal half is a composition cannot be reviewed from its
  signature. Two thousand rows on a Frost `ScrollArea`.

  It also surfaced a bundling defect that had been latent: React Stately's
  layouts read `process.env` in the browser, Vite does not define `process`, and
  `ListLayout` threw `process is not defined` the moment a `Virtualizer`
  rendered. Nothing in this library used a layout until now. `.storybook/main.ts`
  defines both `process.env.NODE_ENV` and a bare `process.env`.

- [x] **`calendar`**, which existed and could not be reached. "Usable on its own
  rather than only inside a picker" is the catalogue's first clause, and the
  month grid was inside `DatePicker` where a booking view that wanted a calendar
  and no field had to copy it. The grid moved to `Calendar` and `DatePicker`
  consumes `CalendarBody` — one month grid in the library rather than two that
  drift — with the picker's popover carrying the material and the standalone
  component carrying the Frost panel, because Frost inside Frost reads as
  neither pane.

  Standing on its own turned up a defect the picker had hidden: the month
  header was a `<header>`, which is a `banner` landmark, and a banner inside the
  calendar's own `application` role is an axe violation. Inside a dialog the
  element is scoped away and nothing complained. It is a `div` now.

  Two things about React Aria's date grid are worth having written down, because
  both read like defects and are not. The weekday row is `aria-hidden` **on
  purpose** — each day announces its whole date, "Wednesday, September 23,
  2026", so a reader hears the weekday without cross-referencing a column header
  whose position they cannot see. And the accessible name is on a button *inside*
  the `gridcell`, not on the cell: the `td` is the grid position and the control
  inside it is the day.

- [x] **`data-view`**, and the two places its catalogue line does not survive
  contact. "The layout switch is a control with a pressed state" — it is a named
  radio group instead, because picking one of two arrangements is a *choice*
  rather than a pressed state, and Crystal and React Aria reach that
  independently: `SegmentedControl` is a radio group, and React Aria's
  `ToggleButtonGroup` renders `role="radiogroup"` with `aria-checked` the moment
  its selection is single. What the clause rules out — two unlabelled icons whose
  state is a colour — is ruled out at least as firmly, and using Crystal's own
  control means there is one segmented strip in the library rather than two.

  "Layout switches at a declared breakpoint" is a **container** query rather than
  a media query, because the same collection is a grid in a full-width page and a
  list in a narrow sidebar of the same window and only the container knows which.
  The width is Crystal's `$cr-breakpoint-sm` rather than a prop, and that is a
  limit rather than a choice: a container query's condition cannot read a custom
  property. It is a real `ul` in both layouts, because a grid of items is still a
  list of items — the arrangement is visual and the count is information.
- [x] **`organization-chart`**, drawn vertically rather than as top-down boxes,
  which is a decision about who it is for. The catalogue asks for "a tree;
  collapse state is announced, and the chart is navigable by keyboard", and the
  top-down layout is the one that makes both hard: the DOM order that reads
  correctly is depth-first, the visual order is breadth-first, and every
  implementation that reconciles them does it by positioning absolutely and
  leaving the keyboard behind. A vertical hierarchy has the same connectors, the
  same collapse and the same reading order, with React Aria's tree keyboard
  behaviour for nothing. `treegrid` rather than `tree`, which is M-3 again and
  for its reason.

**What this slice had to write down rather than look up.** Crystal 2.0.0 publishes
*action* geometry as tokens and badge, avatar, code, kbd and caption geometry only
as rules in `crystal.css` — or, for the ones with no rule at all, only as a
sentence in the catalogue. Every such value enters through a named variable
carrying `crystal-allow-literal` and its source, so the set of things owed a token
in a later core release is greppable rather than remembered. `styles/_avatar.scss`
is the one that is shared, because the overflow chip must be the same circle as
the people beside it.

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
- **Selection is label weight.** Never a check mark, and never a mark beside the label.
  A check mark means validated or informational.
- **Action controls are pills.** Card-shaped buttons keep the content radius.
- **Motion** honours the spring physics, not the keyframes. Hard ceiling 5000ms. Reduced
  motion removes spatial change and keeps state feedback.
- **Status colours** are independent of brand palettes.
- Text, icons, hit areas and focus rings are never blurred.
