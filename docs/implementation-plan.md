# Crystal React implementation plan

`@crystal-ui/react`. A React component library that implements the full Crystal
catalogue at parity with Mantine, MUI (including the X add-ons), Ant Design and PrimeReact.

This is the working plan. It is kept current: when a decision changes, this document
changes with it, and `libraries/parity.json` in the design system is the progress record.

---

## 0. Open issues

Things noticed while implementing and not fixed are in
[open-issues.md](open-issues.md). It holds one entry now: R-17's second
item, where most stories are `render:` closures that ignore args, so Storybook's
Controls panel changes nothing for them. The twenty that closed are in
[closed-issues.md](closed-issues.md) with their reasoning intact, because several
explain why things are shaped as they are as well as what was wrong.

Crystal's own tracker is `crystal-design-system/proposals/open-issues.md`. Open
there, and relevant here, are two divergences in the focus ring between what
this library renders and what Crystal's site renders: the elevation layers and
the dark-mode feather alphas. Both are recorded in D-11 and both are Meridian's
to decide. Do not resolve either by changing this library.

Since 2 October 2026 the tracker holds R-27 to R-29, from Slice R (media, text
and recipe parity); Crystal's holds D-30 to D-36 from the same proposal.

When you notice a defect, add it to the list.

---

## 1. Requirements, and where each is answered

Meridian's brief, traced to the section that satisfies it. Where something is not yet
built, the status says so.

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

Settled by coverage of this catalogue. Every capability below was checked against the
live npm registry:

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

Radix is the better-known choice and is excellent at what it covers, which is roughly
the overlay-and-form third of this catalogue. Building the rest by hand would breach
CONTRACT §3: *"Do not rebuild complex behaviour to obtain a surface style; wrap a
maintained primitive and dress it."*

Three secondary reasons, each sufficient on its own:

- State is exposed as `data-*` attributes (`data-pressed`, `data-focus-visible`,
  `data-selected`), so Crystal's materials can be written in plain CSS. The stated
  preference for SCSS over Emotion therefore costs nothing.
- It is SSR-safe by design, which §3.6 requires.
- It has real internationalisation, which Crystal's right-to-left axis already tests for.

### 2.2 SCSS and PostCSS, not CSS-in-JS

This is Meridian's stated preference, and the architecture supports it because React Aria
publishes state as attributes. There is no style runtime, no serialisation cost and no
per-render class generation.

**On LESS.** The brief named SASS, LESS and PostCSS. The library's own source is SCSS,
because a second preprocessor inside one codebase doubles the toolchain and adds nothing.
Consumers can use any of the three: every value is published as a CSS custom property, so
a LESS, SASS or PostCSS consumer overrides Crystal without needing Crystal's own
preprocessor. §3.1 states the surface.

### 2.3 Crystal owns the physics, React owns the binding

`assets/motion.js` is an IIFE that installs document-wide listeners, which a React library
must not do. `src/engines.js` is already ESM with named exports and `assets/core/*.js`
are pure functions. React imports those and binds through refs and effects.

This satisfies CONTRACT §1 and §6: arithmetic, springs, recipes and state derivation stay
Crystal's. React implements lifecycle, which is different on a platform with components
and is what §2 means by "platform-appropriate techniques".

### 2.4 No ambient motion

Crystal 2.0 ships none. It was specified, built, measured and withdrawn (R17 to R22), and
Crystal React must not reintroduce it. Materials are at rest when nothing is happening to
them. CONTRACT §8 records two findings for when it returns. A rest state fails by being
too strong or too weak, so it needs a measured floor as well as a ceiling. Its cost came
from its structure, not from its tuning.

### 2.5 `@crystal-ui/core` is the base package

The design system publishes as `@crystal-ui/core`; this library is `@crystal-ui/react`. Both sit
under the `@crystal-ui` scope. Crystal React consumes `@crystal-ui/core` and never vendors it.
It is `external` in the bundle, so a consumer resolves one copy of the token set.

`@crystal-ui/core` is published. The dependency is `^2.0.0` from the public npm
registry, and the lockfile resolves to the registry tarball. Until 20 September
2026 it was a `file:` path into a sibling checkout, which resolved only on a
disk that had that checkout. CI checked Crystal out beside this repository to
make it resolve there, and the push ordering between the two repositories was a
hazard with its own tracker entry.

The workarounds were removed with the `file:` path: CI has no sibling checkout
and Storybook has no `optimizeDeps.force`. A published version is immutable, so
Vite's pre-bundle cache cannot go stale against an edit, which is the hazard
that flag guarded against.

To develop a change across both repositories, use
`pnpm link ../crystal-design-system/core`. It brings the stale pre-bundle
hazard back, so run Storybook with `--force` for that session. Do not commit
the linked range.

### 2.6 Every dependency is the React-native one

**Policy.** Where a library ships a React binding, Crystal React uses the binding
and not the framework-agnostic core. A JS-first library is used only where no
React binding exists and the work is framework-agnostic, such as date arithmetic
or scale math. Wrapping a library in `useEffect` by hand reimplements what its
own binding already does, and hand-rolled wrappers leak in lifecycle, cleanup,
concurrent rendering and Strict Mode double-invocation.

The plan had no such policy at first: Motion was adopted only after Meridian
pointed at it. The table below is the audit made under the policy.

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
for this explicitly. React Aria ships no scroll-area primitive. Its one scrolling
API is `usePreventScroll`, the modal scroll lock, which `Dialog` already receives
through React Aria's own `Modal`. Crystal's `ScrollArea` is therefore the container
React Aria leaves to the design system, and it contributes Crystal's two scrollbars,
the scroll contract and the edge fade.

Where React Aria does own scrolling, the components that need it take it from
React Aria:

| Scrolling concern | Owner |
| --- | --- |
| Modal scroll lock | React Aria `Modal` (`usePreventScroll`) |
| Keyboard scroll-into-view inside a collection | React Aria collections |
| Virtualised scrolling | React Aria `Virtualizer`, with `@tanstack/react-virtual` only where a collection is not involved |
| Infinite scroll sentinels | React Aria's `*LoadMoreItem` components |
| Focus containment and restoration | React Aria `FocusScope` |
| The scroll container, its scrollbar and its edge fade | Crystal |

Every one is MIT, ISC or Apache-2.0. None is a paid licence, and none becomes
paid at a usage threshold.

**Motion for React also removes GSAP.** `@crystal-ui/core` depends on GSAP for
pseudo-element animation in the web preview, and GSAP's is a custom
"no charge" licence rather than an OSS one. Crystal React does not need GSAP:
Motion for React covers what GSAP was used for, so the React library's
dependency graph contains no non-OSS licence.

**Where this changes the physics, it improves it.** Every Crystal recipe carries a
spring fitted so its settling time equals the authored duration, and Motion's
spring transition takes exactly `{ stiffness, damping, mass }`. The recipe's own
physics now drive the animation, where before a duration and a bezier
approximated them. CONTRACT §6 asks for this when it says to honour the physics
rather than the keyframes.

---

## 3. Architecture

### 3.1 Styling

Three layers, in cascade order:

1. **`@crystal-ui/core` stylesheets**: the reset, the material primitives and the resolved
   theme custom properties. Imported once by the consumer.
2. **Component SCSS**: one `.module.scss` per component, selecting on React Aria's
   `data-*` attributes. Compiled through PostCSS with Autoprefixer.
3. **Consumer overrides**: custom properties, scoped to a `CrystalProvider` subtree or to
   a single component through `style`.

**Values enter in one place.** `scripts/build-tokens.mjs` reads Crystal's resolved
export and writes `src/styles/_tokens.scss` and `src/theme/tokens.generated.ts`. Both are
gitignored, because a committed generated file eventually gets edited by hand.
`scripts/lint-tokens.mjs` fails the build on a hard-coded colour or length anywhere else.
It caught one in its own first test run.

**What is a SCSS variable and what is a custom property** follows one rule. A value that
can change at runtime with the theme, such as palette colour, radius, elevation or motion
speed, is a custom property. A value that cannot, such as a blur radius inside a `filter`
shorthand or a breakpoint in a media query, is a SCSS variable.

### 3.2 TypeScript

`strict`, plus `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`,
`noImplicitOverride`, `verbatimModuleSyntax`, `noUnusedLocals` and `noUnusedParameters`.
No `any` in a public type. Every component exports its own props interface, extending the
matching React Aria props so consumers keep the full underlying surface.

Declarations are emitted separately (`tsc --emitDeclarationOnly`) and not by the
bundler, so the published types are the ones the source is checked against.

### 3.3 Theme, built

- `CrystalProvider` wraps `@crystal-ui/core/core/preferences`. Normalisation, clamps, choices
  and duration resolution are Crystal's, and the provider re-derives nothing. Crystal's own
  defaults and palette list are passed in, not copied.
- **Scoping is per element.** A nested provider writes custom properties onto its own
  wrapper, so a dark island inside a light page needs no second root. The provider is
  also safe to render more than once, which Storybook and visual tests both do.
- Hooks: `useCrystalTheme`, `useColorScheme`, `useDensity`, `useDirection`,
  `useReducedEffects`, `useMotionSpeed`. Each is a narrow read, so a component that cares
  only about direction need not re-render when the palette changes.
- `useCrystalTheme` throws outside a provider and returns no default. A component that
  renders un-themed without an error is the failure that produces "it looks
  nothing like the design system" reports.
- **Typography context** is still to build: `useTypography` returning the resolved family,
  reading size and leading, plus a `Text`/`Title` scale bound to it (§ slice F).

### 3.4 Motion

Motion is bound to state and not to events: `checked`, `aria-expanded`, `aria-invalid`,
`open`, a committed range value. Keyboard and assistive technology therefore get what a
pointer user gets. This mirrors `motion-interactions.js` upstream, implemented as hooks.

- `useMotion(ref, recipe, options)` plays a Crystal recipe through Crystal's engine,
  cancels on unmount, and supports `{ once }` coalescing so a continuous control does not
  restart its recipe on every event.
- `useStateMotion(ref, { checked, expanded, invalid, open })` is the declarative binding
  most components use.
- `useOpticalLayer(ref)` attaches the shader for the duration of an interaction and
  fully detaches after it. A layer that outlived its motion is how the preview grew a
  ghost box.

Reduced motion resolves durations to zero. The state change still happens and the
movement does not.

**Where the animations improve on the web preview:**

- The property vocabulary is restricted to `transform` and `opacity`. The preview's
  optical layers animate `box-shadow` (18 keyframes), `border-radius` (19) and
  `background-position` (9). None of these can be composited, so each forces a repaint
  every frame. Shadow and rim changes become opacity cross-fades between pre-rendered
  layers.
- No React state changes during an animation. Motion is driven imperatively through refs,
  so a 60fps animation causes zero re-renders.
- Interruption is supported: a recipe replaced mid-flight starts from the current value
  and does not snap.

### 3.5 Responsiveness

Container queries are used where a component's layout depends on its own width and not on
the viewport's, which is most components in a component library. Breakpoint SCSS variables
come from tokens. Density (`comfortable` / `compact`) tightens spacing and never targets:
the 44px minimum survives every density and every breakpoint.

### 3.6 Framework compatibility

- `"use client"` on every module with state, effects or context. Pure presentational and
  type-only modules stay server-compatible.
- No `window`, `document` or `matchMedia` at module scope. Anything environmental is read
  in an effect or behind `useSyntheticEnvironment`-style guards.
- `<ColorSchemeScript />` for the pre-paint theme class, so there is no flash and no
  hydration mismatch.
- ESM and CJS both published, with `preserveModules` so a consumer importing `Button` does
  not pull the date picker's internationalisation tables.
- Gated by a smoke app per framework: Next.js (App and Pages router), TanStack Start,
  React Router, Gatsby and Redwood. Each renders a themed component server-side and
  hydrates without warnings.

### 3.7 Testing, stories, and machine readability

- **Vitest** + Testing Library + `vitest-axe`, with a shared `renderWithCrystal` helper.
  Built; 7 tests currently cover the provider.
- **Jest** compatibility is tested: `pnpm test:jest` runs a real suite under Jest's own
  resolver, transform and environment, and it is part of `pnpm verify`. Babel is pinned
  to 7.x there to match the core that `babel-jest` resolves. With preset-typescript 8
  against core 7 the preset silently does not engage, the file parses as JavaScript, and
  `createContext<T | null>(null)` becomes a chain of comparisons.
- **Storybook 9** with a toolbar covering all six palettes, both modes, both densities, both
  directions and reduced effects. These are the axes the design system's visual gate uses.
- **LLM integration**: `llms.txt` at the package root, and a generated
  `component-manifest.json` carrying props, states, tokens and recipes per component, so an
  assistant can use the library without reading the source. Generated from the catalogue
  and the types, never hand-written.

### 3.8 Forms

- `useCrystalForm` over React Aria's own form integration. React Hook Form is not
  wrapped, because RAC already owns validation display, `aria-describedby` wiring and
  submission semantics, and a second form library competing with it is a known source of
  bugs.
- **Validation** through [Standard Schema](https://standardschema.dev) (`~standard`), so
  Zod, Valibot and ArkType all work untouched and none is a dependency.
- **Submission state** (idle, submitting, succeeded, failed) is surfaced as data
  attributes so the SCSS can dress it, and drives Crystal's `field-invalid` / `field-valid`
  recipes.
- **Mutations** through an adapter that accepts any `mutate` function with a
  `{ mutateAsync, isPending, error }` shape. TanStack Query fits it exactly and is not a
  dependency. A plain `fetch` wrapper fits it too.
- Server-side and asynchronous errors map onto the same field state as client validation,
  so a field looks the same however it failed.

### 3.9 Packaging

`@crystal-ui/react`, ESM + CJS + types, `sideEffects` declaring the SCSS. Changesets for
versioning. Peer range React 18.2 and 19.

### 3.10 Documentation website

A documentation site at the standard set by MUI, Mantine, PrimeReact and
Blueprint: every component gets a page with an explanation, isolated visual
examples, the code for each, a generated props table, and its accessibility and
material notes.

**Separate from `crystal-preview`.** That is Crystal's site: it documents the design
system, it installs `@crystal-ui/core`, and it renders the specification that
ships inside that package. It says what a material is. This site says what a
React component does: props, accessibility, the code that runs. The two sites
have different audiences and different sources of truth. Merging them would mean
one of the two repositories documenting the other's API, which is the
cross-repository coupling the split removed.

**Next.js App Router, deployed to Vercel.** Chosen over a docs framework because
the site is also the Next.js compatibility gate from §3.6. Server-rendering the
library's own documentation proves that claim, and a separate smoke app would be
a weaker test.

It lives at `apps/docs` in this repository, as a pnpm workspace package depending
on the library through `workspace:*`. The library stays at the repository root.
Vercel's project root is `apps/docs`, and a preview deployment per pull request is
the review surface for visual change.

**The code shown is the code that runs.** The docs architecture is built around
this rule, because examples are where documentation sites decay. Each example is
a real `.tsx` file under `apps/docs/demos/`. It is imported and rendered, and it
is read from disk at build time for its source. There is no second copy of an
example in a code fence, so an example cannot drift from what it renders, and a
demo that stops compiling breaks the build.

Each example is isolated: it is rendered inside its own `CrystalProvider` scope
with per-demo controls for palette, mode, density, direction and reduced effects,
the same axes the design system's visual gate uses. Because the provider scopes
to an element and not to a document (§3.3), a demo can be dark on a light page
with no iframe and no portal workaround.

**Props tables are generated** from the TypeScript types with
`react-docgen-typescript`, never hand-written. A hand-written props table is a
second description of the same shape and drifts from the first, which is the
argument CONTRACT §1 makes for values.

Every component page carries:

- what it is, and when to use it in place of its neighbours;
- anatomy, states, and which Crystal materials it uses;
- isolated examples, each with its source and a copy button;
- a generated props table, plus the React Aria props it passes through;
- accessibility notes: roles, keyboard map, and what the component does not do;
- the motion recipes it plays, and what each marks;
- its parity claim: the Mantine, MUI, Ant Design and PrimeReact components it
  corresponds to, drawn from the catalogue and not retyped.

Page content is MDX. The component index, the parity claims and the material and
motion notes come from `@crystal-ui/core`'s catalogue, so a component added to the
catalogue appears in the documentation with no further step.

Beyond the component pages: getting started per framework, theming and the token
reference, the material hierarchy, motion, accessibility, forms, and a migration
note for each benchmark library. Search is local, over a generated index.
`llms.txt` and the component manifest (§3.7) are served from the site, so the
documentation is machine-readable at the same URL a person reads.

---

## 4. Scope: 285 entries

The catalogue lives in `core/tokens/catalogue/`. `libraries/parity.json` is
generated from it and is the progress record. 172 to build; two are recorded
`not-applicable` with reasons.

The gap against the four benchmarks was computed: every benchmark package was installed
and its component directories enumerated. Curating that list was most of the work. MUI
composes from anatomy parts (`CardHeader`, `TableCell`, `StepLabel`, `ChartsAxis`) and
date-library adapters (`AdapterDayjs`, `AdapterLuxon`), which are parts and plumbing and
not components Crystal would name. 55 additions took the catalogue from 119 to 174. The
largest single gap was that Crystal named no charting surface while all four benchmarks
ship one.

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
| **blocks** | **20** | **a separate tier, see §4.2** |

283 to build; two are recorded `not-applicable` with reasons.


### 4.1 Capability, not nomenclature

**This section was corrected.** The first reading of parity counted
component names against four benchmark libraries. A catalogue can pass that
check and still be unable to drag an element, upload a file with progress, or play
a video, because counting names against names cannot see a missing capability.
Meridian's own example: Crystal specified a drag element that could not be
click-and-dragged.

Two sources were added as a result:

1. **React Aria's component list.** CONTRACT §3 says to wrap a maintained
   primitive rather than rebuild it, so a primitive React Aria ships that Crystal
   does not name is a gap by definition: Crystal would be leaving accessible
   behaviour unused. The installed package was enumerated and diffed against
   the catalogue. The contexts are internal plumbing and the components are not.
2. **The named list**: click-and-drag, File Input / Upload / UploadZone,
   Spotlight, floating action, navbar and submenu types, animated toasts and
   banners, alerts, loading and skeletons, pagination, portal, video and music
   players, gallery, carousel.

28 components followed, including a `media` category, which Crystal did not have
before.

#### Capabilities every component owes

These are requirements on the whole library, checked per component. A component
in the catalogue that can carry one of these and does not is not finished.

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
| **Internationalisation** | dates, times, numbers, calendars, collation | Real locale handling through `@internationalized/date`, and right-to-left correctness, an axis Crystal's own visual gate already tests. |
| **Media transport** | video-player, audio-player, media-controls, gallery, lightbox | Real `video`/`audio` elements, captions with announced state, a scrubber that is a slider rather than a progress bar, and keyboard transport that does not trap focus. |
| **Motion** | every component with a state change | The recipe Crystal's catalogue assigns it, bound to **state** rather than to an event, so keyboard and assistive technology get what a pointer user gets. Where the catalogue assigns none, the component plays none. |

#### How this is enforced

A component's catalogue entry carries its `states` and its `crystal` obligations,
and the parity manifest carries its status. A slice is not complete until, for
each of its components, the capabilities above that apply to it are implemented
and tested. A drag test that only simulates a pointer does not count, because the
keyboard path is the one that breaks silently.


### 4.2 Blocks are a separate tier

Meridian asked for larger composed blocks (dashboards, players, stores,
interactive apps) and asked for them in a section of their own, not mixed
into the components. That separation is right. The rule is:

**A component is a primitive with one job and a contract a library can hold.** A
button is a button in every product. Its material, geometry, focus and motion are
the same everywhere, and the contract is checkable.

**A block is an arrangement that solves a recognisable product problem**: a
dashboard shell, a checkout, a player, a storefront. Blocks are opinionated. They
make layout and flow decisions that a component never should. A design system
that does not separate the two ships opinions as primitives, and every product
then has to work against the opinion.

Blocks therefore live in their own category, ship from their own entry point, and
carry a different promise: a component's API is stable, and a block is a starting
point that products are expected to fork. Blocks guarantee that the materials,
motion, focus and accessibility inside them are Crystal's, so forking one does not
mean leaving the design system.

The tier is benchmarked against Tailwind UI, Mantine UI, Ant Design Pro, MUI
Templates and PrimeBlocks, which is where it exists in the ecosystems Crystal is
measured against.

Two scope boundaries, stated now because they are easy to cross later:

- **Payment.** The commerce components never handle raw card data. `payment-method`
  defers to the host provider's own element, which keeps PCI scope out of the
  library.
- **Charts owe a text equivalent.** A chart is a second representation of data,
  never the only one, and colour never carries meaning alone. This applies to all
  24 of them.

---

## 5. Slices

Each slice: implement, story, test, axe check, visual evidence, `parity.json` status,
report. Order follows dependency and not the catalogue's own order. A component is not
done until `parity.json` says `implemented`.

A story is the address that three of the six gates use. `verify-targets.mjs`, the
rendered half of `verify-theme.mjs` and the visual frames all reach a component by
navigating to a story ID. A component with no story is therefore outside those gates,
and the suite stays green. Slice I was shipped without stories and CI passed. Writing
them afterwards turned three gates red on three real defects. No unit test could have
caught two of them, because the element did report the role each test asked for and the
defect was in the tree around it. The third was a 32px-wide target, which jsdom cannot
see: it reports every box as zero. See R-18 in `docs/closed-issues.md`.

A component that carries a finger target therefore also needs a case in
`scripts/verify-targets.mjs`, and `LEAST_PROBES` raised to the new count. A state that
matters and is reachable only by operating a control, such as a collapsed rail or a modal
window, needs a story of its own, because a gate can address a story and cannot address
a state behind a click.

### C: Foundation, complete

Repo, build, tokens, theme, motion, testing, Storybook, `llms.txt`.

- [x] Repository, separate from the design system, remote `boomerbowser/crystal-react`
- [x] `package.json` as `@crystal-ui/react`; Vite library build; ESM + CJS; `preserveModules`
- [x] TypeScript strict with the stricter flags; declarations emitted by `tsc`
- [x] `scripts/build-tokens.mjs`: the single point where values enter
- [x] `scripts/lint-tokens.mjs`: fails on a hard-coded colour or length
- [x] `CrystalProvider`, the theme object, six hooks, per-element scoping, 7 tests.
  Since R-12 there is also a browser gate that every property the stylesheets read
  resolves on the themed scope and on the container that overlays are portalled
  into. The provider was built first and correctly. What was missing was proof
  that what it publishes survives to the served page.
- [x] **The environment, per component.** Every adjustable value in Crystal's own
  "Make it yours" panel is a Storybook toolbar control: palette, appearance,
  colour atmosphere, Frost base tint, elevation, corner radius, density,
  direction, animation speed, reduced motion and reduced effects. Each can be
  pinned per story through `parameters.crystal`, so a component whose subject is
  an environment can show one and a browser gate can measure a fixed one.

  Colour atmosphere mattered most and there was no way to reach it. Crystal's
  materials are defined by what is behind them, the decorator painted a flat
  canvas, and every material in every story therefore rendered as white. See R-13.
- [x] Typography context: family, reading rhythm, and a scale derived from the reading size so moving that token moves every step
- [x] `useMotion` (recipes, on Crystal's springs) and `usePreset` (material presets, on Crystal's shared preset module)
- [x] `renderWithCrystal` with theme axes as one argument; axe assertions
- [x] Jest parity suite: one suite runs under Jest in `pnpm verify`, so the claim is
      checkable. It renders a themed component, reads the theme through Crystal's
      resolver and asserts the clamp, which exercises the three things that
      differ under Jest: ESM-style `.js` specifiers in TypeScript imports, SCSS module
      resolution, and the jsdom environment
- [x] Storybook with every theme axis in the toolbar (six palettes, both modes, both densities, both directions, reduced effects and reduced motion) and a11y findings set to fail rather than inform
- [x] `llms.txt` and `component-manifest.json`, generated from Crystal's catalogue with status read from the source tree

**Gate C.** One component per concern, proven together:

- [x] `Button`: pill geometry, Resin, focus halo, `press` and `hover` bound to press
      state so a keyboard user gets what a pointer user gets.
- [x] `Card`: Haze fill on an isolated paint layer, crisp text, recessed when inside a
      Resin frame, and no motion. The catalogue assigns Card no recipe, and a library
      must not invent one.
- [x] `TextInput`: Haze well in a Resin shell, `field-focus`, and `field-invalid` /
      `field-valid` bound to validation state so a server-side failure animates
      identically to a client one.
- [x] `Dialog`: a Mirage scrim with an 80% feathered Haze surface above it. An earlier
      draft of this plan said Resin. The catalogue is the spec and a test pins it.
      React Aria owns focus containment, its return, Escape and scroll locking.
      `AnimatePresence` holds the subtree mounted until the exit settles, so the
      dismissal plays. Without it the animation and the unmount race, and the
      unmount wins.

Nothing downstream is trustworthy until this gate passes.

- [x] **Task C-1: export the motion presets from `@crystal-ui/core`.** Done:
      `assets/core/presets.js` is a pure module, `motion.js` consumes it and keeps
      no copy of its own, and `usePreset` consumes it from React. The decorative paint
      layers stay behind in the web runtime, because animated `box-shadow`,
      `border-radius` and `background-position` cannot be composited and do not port.

### D: Utility and layout (39), complete

**Done.**

- [x] `scroll-area`: taken out of order, because Meridian reported the scrolling
      problem from a phone and it had to be fixed in both places at once. It carries
      Crystal's two scrollbars by class and does not restate their CSS, drives the
      edge fade through `data-cr-scroll`, and becomes a tab stop only when it
      scrolls and holds nothing focusable.
- [x] `container`: the shell ceiling and the reading ceiling, which are different
      numbers for different reasons. It introduces no landmark, as the catalogue
      states.
- [x] `stack`, `group`: one box turned ninety degrees, with two exports because
      that is the vocabulary a product reads. The gap is a custom property and not
      seven classes per component.
- [x] `grid`, `simple-grid`: twelve columns with spans per breakpoint, and the
      auto-flowing pair that needs no breakpoint props. A cell with no span
      is full width, so a forgotten prop produces a readable stack and not slivers.
- [x] `center`, `space`, `aspect-ratio`: `space` is `aria-hidden`, because the
      catalogue forbids using it to convey grouping and an empty div is announced
      as a blank item by some screen readers.
- [x] `divider`: decoration when unlabelled, a named `separator` when labelled.
      The name comes from `aria-labelledby`, because `separator` is not a
      name-from-content role and a label left as a child text node is announced as
      nothing.
- [x] `visually-hidden`, `skip-link`: React Aria owns the clipping recipe. Crystal
      owns the pill the skip link becomes on focus. It also focuses the target and
      does not only scroll to it, which is the part every product gets wrong.
- [x] `focus-trap`: React Aria's `FocusScope`, as the catalogue instructs ("use a
      maintained primitive rather than rebuilding it"), with Crystal's rule stated
      around it: never trap without a visible, keyboard-reachable exit.
- [x] `click-away`: React Aria's `useInteractOutside`, plus Escape, because
      Crystal's rule is that dismissal is never only a click-away and a keyboard
      user has no outside to click.
- [x] `no-ssr`: `useIsSSR`, tied to React's hydration signal and not to a
      `useEffect` flag, so there is no mismatch to warn about.
- [x] `focusable`, `pressable`: React Aria's behaviour with Crystal's appearance.
      `Pressable` also supplies the role React Aria deliberately leaves out: a bare
      React Aria `Pressable` is a tab stop a screen reader announces as nothing,
      and the catalogue asks for button semantics unless told otherwise.

Two tokens entered Crystal for this slice: the spacing scale and the breakpoints,
plus the shell's ceilings, gutters and minimum cell width. The catalogue makes
both Crystal's obligation and neither existed, and a value a library invents for
itself drifts.

**Also done: providers, scopes and the two React Aria wrappers.**

- [x] `theme-provider`: `CrystalProvider`, which already was this. It gained the
      three things the catalogue asks for that it did not have. It declares
      `color-scheme`, so native controls and the browser's own scrollbars follow
      the mode and do not stay light inside a dark scope. It resolves
      `mode="system"` against `prefers-color-scheme`: system is a preference and
      never a resolved value, because a component asking "am I dark?" needs an
      answer. It honours `prefers-reduced-transparency` and `forced-colors` on its
      own, so a product that never thought about either still respects them. An
      explicit `effects` prop can only reduce further and never restore.
- [x] `direction-provider`: a `CrystalProvider` underneath, not a second
      mechanism. It also hands React Aria a locale, which a `dir` attribute
      cannot do: React Aria calculates placement in JavaScript, and a
      calculation does not read an attribute.
- [x] `reduced-effects`: the explicit product preference. The system's own
      setting is already honoured above it.
- [x] `global-styles`: paints the document from the resolved scope, restores what
      it found on unmount, and touches neither focus visibility nor motion
      preferences. A reset may normalise appearance. It may not remove an
      affordance or overrule a preference somebody expressed to their operating
      system.
- [x] `router-provider`, `ssr-provider`: React Aria's, re-exported with Crystal's
      reason attached. `SSRProvider` does nothing on React 18 and later, which is
      this library's floor. It is shipped so the name exists where somebody looks
      for it and the reason is written down.
- [x] `toolbar`: React Aria's roving tab index and arrow handling, Crystal's
      material and geometry. One tab stop for a group of controls is an
      accessibility decision: without it, a formatting bar of fifteen buttons is
      fifteen stops between a person and the next field.
- [x] `transition`: `usePreset` and `AnimatePresence`, and thin, because
      everything it could decide is decided in `@crystal-ui/core`, and a transition
      component carrying its own durations is a second motion system. It renders a
      real wrapper and not `display: contents`, because an element that
      generates no box cannot be faded, and the exit animation would not play.

**Also done: the standalone five.**

- [x] `watermark`: a tiled SVG on a pseudo-element, so it is outside the
      accessibility tree by construction and needs no `aria-hidden`. It is
      `pointer-events: none`, because a wash that takes clicks makes the content
      under it unusable. The opacity is clamped: past a few percent the mark
      competes with body text, and a contrast ratio measured for text no longer
      holds when the text is read through a pattern.
- [x] `qr-code`: `qrcode.react` (ISC) renders it. Crystal owns the Haze quiet
      zone and the contrast floor. The code's two colours are the one place in
      this library where a colour is not a token, because a scanner reads
      luminance, and a palette-tinted code scans in good light and fails in bad.
      The encoded value is always available as text.
- [x] `masonry`: CSS columns. A JavaScript packing pass reflows on every resize
      and produces an order a screen reader walks differently from a sighted
      reader. A list only when the items are a set, because the visual order is
      columnar.
- [x] `animate-on-scroll`: content is present and readable before the animation
      runs and is never revealed by it. There is no `opacity: 0` waiting to be
      undone, so a reader whose observer never fires, or whose JavaScript failed,
      gets the page and not a blank one. Only entry recipes are accepted. The rest
      are refused and not silently ignored.
- [x] `overflow-list`: measures itself with the row laid out but invisible, so
      the overflowing state is never seen for a frame. Hidden items move into an
      affordance that names its count and are not clipped away. Priority
      order is the product's, in child order.

**Also done: the application frame and manipulation.**

- [x] `app-shell`: the material assignment of a whole view in one place. Plastic
      is underneath, Frost is for the supporting panels and Resin is for the
      floating destination group. It sets the landmarks, with one main per view, which is
      why the regions are props and not children a caller arranges. The content
      scrolls and the page does not: a sticky header does not hold inside a grid
      whose header row is exactly as tall as the header. Both scrolling regions
      take Crystal's Frost scrollbar.
- [x] `app-bar`: Frost band, full-bleed, actions as pills, elevation gained on
      scroll and absent at rest. Declining the banner role means rendering a
      `div`: a `header` outside sectioning content is a banner implicitly, so a
      role alone would not have taken it away.
- [x] `resizable`: React Aria's `useMove`, which reports movement from a pointer
      and from the arrow keys through one interface, so the keyboard path is not a
      second implementation that drifts. A `separator` with `aria-valuenow`, so the
      size is announced as it changes rather than "something was grabbed".
- [x] `drag-handle`, `drop-indicator`: React Aria's `useDrag`, whose keyboard path
      is the same state machine as the pointer path and not a fallback beside it.
      That is the reason to take it: a hand-rolled drag is where the keyboard path
      is invariably missing, because the pointer version looks finished. Crystal
      owns the lift, the settle and the indicator's material.
- [x] `virtualizer`: React Aria's, re-exported with its layouts. The hard part is
      `aria-setsize`/`aria-posinset` across recycling and keeping focus when a
      focused row is reused. The windowing is the easier part. Only a virtualizer
      integrated with its collections gets those for free.
- [x] `shared-element-transition`: Motion's `layoutId` inside `AnimatePresence`.
      It is removed entirely under reduced motion and not damped. That is the
      catalogue's wording, and it is the right reading, because a slower moving
      object is still a moving object.

**Slice D is complete**: 37 implemented, 2 recorded `not-applicable` (`terminal`
and `border-beam`, with reasons in the catalogue).

\* recorded `not-applicable`, with the reason in the catalogue.

### E: Typography and actions (26), complete

The type scale moved upstream first. Crystal specified a reading rhythm and no
scale, so this library had derived six steps of its own: three tables of ratios,
leadings and trackings that no other platform could see. They are Crystal's tokens
now, reaching CSS as `--cr-text-<step>-*`, and six `crystal-allow-literal` markers
reading "pending a type-scale token" became tokens with them. Two icon sizes moved
with them: 20px, the size Crystal's reset has always drawn an icon at, and 24px,
the catalogue's size inside an icon button.

- [x] `title`, `heading`, `display`, `lead`: `Title`, `Display`, `Lead`. The
      level and the step are chosen separately, as the catalogue states twice. A
      component where `level={2}` also means "medium" forces a choice between a
      correct outline and a correct appearance, and products choose appearance.
      `Lead` stays a paragraph, because a standfirst is a sentence of copy and
      has no place in the document outline.
- [x] `text`, `truncate`, `text-balance`: truncation clamps the text and does
      not cut it, so the text is hidden from sight and stays in the DOM, and the
      full value comes back through `title`. `Truncate`'s expand control appears
      only when there is something to reveal, because a control that does
      nothing still costs a keyboard user a tab stop.
- [x] `prose`, `prose-list`, `blockquote`, `cite`, `abbreviation`: `Prose` is the
      one place a stylesheet reaches its descendants, because the alternative is
      asking a content author to know Crystal. `Cite` names a work, not a
      person. `Abbr` is focusable, because an expansion shown only on hover is
      no use without a pointer.
- [x] `mark`, `highlight`: the matched string stays one readable sentence with
      `mark` elements inside it. A screen reader reads an array of fragments as
      fragments. The query is escaped, because `c++` is a valid search.
- [x] `number-formatter`: one string, visible and spoken. With "1.2M" on screen
      and 1204893 in an `aria-label`, the two values drift, and nobody checks
      the one a screen reader reads.
- [x] `code-block`, `copy-button`: a named region and a tab stop, because a
      sample wider than its column scrolls and a scroll container with nothing
      focusable is unreachable without a pointer. The copy control names what it
      copied, and the confirmation goes to a live region, because a change of
      label on its own is only visible.
- [x] `gradient-text`: every point along the gradient clears the contrast floor,
      because it runs between palette colours that already do. The solid colour
      under the clip is one of them, so an unsupported clip leaves coloured
      text. It does not leave transparent text.
- [x] `icon-button`, `close-button`: `label` is required, not optional with a
      warning, so an unnamed icon button fails to compile. `CloseButton` names
      what it closes, because a page with three dismissible things otherwise
      has three buttons called "Close".
- [x] `button-group`, `split-button`: pill outside, square inside, one plane. The
      group takes its role only when it has a name, because an unnamed group
      announces "group" and tells the reader nothing. A split button is two
      buttons, because a control that behaves differently depending on which
      half was pressed cannot be described to somebody who cannot see the
      halves.
- [x] `floating-action`, `speed-dial`, `action-bar`: Resin at the float
      elevation, with the safe-area offset. A dial's actions keep visible labels,
      because an icon in a set that appeared a moment ago has no context to be
      read from. The action bar announces its count when it appears, so the
      reader learns the size of the selection at the same time.

### F: Inputs, part one (26 of 52), complete

One anatomy is shared through mixins. Every text-shaped control is a label, a Haze
well inside a Resin shell, and helper text or an error beneath. That lives in
`styles/_field.scss` and not in ten stylesheets, because ten descriptions of one
material diverge the first time one of them changes. This is CONTRACT §1 applied
inside a library as well as across one.

- [x] `form-field`, `fieldset`, `helper-text`: the component is its wiring. The
      label points at the control, `aria-describedby` carries the hint and the
      error (describing a field by only its error drops the guidance that would
      have prevented it), and the error is text with a mark, never colour.
- [x] `text-input`, `textarea`, `number-input`, `password-input`, `search-input`,
      `mask-input`, `json-input`, `pin-input`: the reveal toggle is a named
      button with `aria-pressed`, because whether the password is currently
      visible is a privacy question. The search landmark is opt-in, because two
      landmarks are worse than none. The mask reports the raw value, because a
      form that receives `(555) 012-3456` has pushed the formatting problem to a
      server that will disagree about it. A pasted code fills every box.
- [x] `select`, `native-select`, `multi-select`: there are two components because
      a native select is the right answer more often than a built one. On a
      phone it opens the platform picker. Selection is label weight, never a
      check mark.
- [x] `checkbox`, `checkbox-group`, `radio`, `radio-group`, `switch`,
      `segmented-control`, `chip`, `rating`: indeterminate is set through the
      property and not a class. The switch's state never rests on position
      alone. The segmented control is a radio group and never borrows tab
      semantics. A rating is never symbol-only.
- [x] `slider`, `range-slider`, `angle-slider`, `knob`: `aria-valuetext` makes a
      slider announce "£24" where it would otherwise announce "24". A range
      slider is two sliders with distinct names, because a reader moving the
      lower bound must not be told the upper one. The dials share `useMove` with
      `Resizable`, which keeps "keyboard steps match the slider contract" true.

Eight more tokens entered Crystal for this slice. Each is a figure the catalogue
already stated in prose: the choice box and its radius, the switch track, the
slider track and thumb, the chip height, and the well inset.

### G: Inputs, part two (26 of 52), complete

- [x] `combobox`, `autocomplete`: one React Aria primitive with a different
      policy on free text. Focus never leaves the field. The highlighted row is
      named by `aria-activedescendant`, which lets typing continue while the
      list is open. Empty and loading are surfaces, so the popover is present
      in both states.
- [x] `tags-input`, `token-field`: additions and removals are announced, and a
      refused duplicate says why it was refused. Focus returns to the entry
      after a removal, because removing the last chip destroys the element that
      had focus, and the browser then focuses the body, which drops a keyboard
      user out of the form.
- [x] `color-input`, `color-area`, `color-slider`, `color-wheel`, `color-swatch`,
      `color-swatch-picker`: colour is never the only representation, in six
      components whose subject is a colour. The thumb is two rings, white
      inside dark, because a single-colour border disappears against part of the
      gamut it sits on. A hue slider handed a hex converts it and does not
      throw.
- [x] `date-input`, `time-input`, `date-picker`, `date-range-picker`,
      `date-time-picker`, `month-picker`, `year-picker`, `digital-clock`: a row
      of segments, each its own spin button, so a date can be entered in any
      locale without knowing the order. An unset segment shows `dd`, because
      `01` is an answer nobody gave. All the arithmetic is
      `@internationalized/date`.
- [x] `file-input`, `dropzone`, `upload`, `upload-zone`: a drop surface always
      contains a real button, because dragging needs a pointer, a steady hand and
      sight of both ends of the gesture. Progress is a number as well as a bar.
- [x] `transfer`, `cascader`: Transfer moves items with named controls rather
      than a drag. That is the catalogue's requirement and the reason it is two
      listboxes. Cascader announces the whole path, and a branch says it is one
      in its name, because a chevron alone is silent.
- [x] `rich-text-surface`, `mentions`: Crystal owns the chrome and the product
      owns the engine, which the catalogue states as "the entire editing engine,
      serialisation and paste handling". The plan's dependency table names
      `@tiptap/react` for this. By the catalogue's wording no engine belongs in
      the library, and bundling one would impose a large dependency on every
      consumer for a component most will not use. The toolbar reports active
      formatting with `aria-pressed`.

### H: Forms, complete

`useCrystalForm`, `Form`, and the Standard Schema types, in `src/form/`.

- **Standard Schema v1 declared locally, not depended on.** `@standard-schema/spec`
  contains that interface and nothing else, and a package in the tree is a poor
  trade for twenty lines of frozen type. Zod, Valibot and ArkType all work
  untouched and none is a dependency. The hook is tested against Valibot as a
  devDependency, because a hand-rolled `~standard` object proves only that the
  hook can read a shape it was written against.
- **Native validation stays on.** React Aria's `Form` sets `noValidate` only when
  `validationBehavior` is not `'native'`, so the browser blocks a structurally
  invalid submit before the schema runs. A field already declares `isRequired`.
  Making the schema restate it would be §1's redeclaration, with rules in place
  of values. The browser checks shape, the schema checks meaning and the server
  checks truth.
- **An issue with no path is a form error** and belongs to no field. "One of
  these two is required" is true of the form and of neither field.
- **Submission state as a data attribute**, so the stylesheet dresses it.
- **The double-submit guard is a ref**, because Enter in a text field submits
  whatever the button is doing, and state read inside the handler still says
  idle.
- **`valuesFromForm` does not coerce.** It returns strings and `File`s as the
  browser reports them. A repeated name becomes an array, and an unchecked
  checkbox is absent. A test pins this behaviour.

Building it found two defects older than the slice.

The first was in validity. Every field coerced `isInvalid` with
`?? Boolean(errorMessage)`. React Aria treats a defined `isInvalid` as "the
caller owns validity from here", so an untouched field handed it `false`. To
React Aria that `false` means "stop working out whether it is". It does not mean
"this field is fine". Native validation never reached a field, and neither did
any error a `Form` distributed. Ten call sites were fixed through
`declaredInvalid`, with a test that puts every named field inside a `Form`
carrying an error and checks that each field picked it up. The temporal family
accepted no `name` at all, so a date could not be submitted or matched to an
error. It accepts one now.

The second was in focus. `--cr-focus-core` / `--cr-focus-ring` were read by
every field and defined by nothing, so Crystal's focus ring painted on no
control in the library. Crystal now publishes the recipe.
`src/theme/published-properties.test.tsx` reads every `var(--cr-…)` in every
stylesheet here and fails on any that Crystal does not publish and no component
sets itself.

### I: Navigation and overlays (28), complete

`anchor`, `nav-link`, `nav-rail`, `dock`, `breadcrumbs`, `tabs`, `pagination`, `stepper`, `burger`, `command-palette`, `tree-view`, `affix`, `bottom-navigation`, `navigation-menu`, `table-of-contents`, `menubar`, `submenu`, `dialog`, `drawer`, `menu`, `context-menu`, `popover`, `hover-card`, `tooltip`, `scrim`, `portal`, `floating-window`, `overlay-arrow`.

- [x] **The overlay surfaces**: `scrim`, `overlay-arrow`, `popover`,
  `tooltip`, `dialog`, `menu`, `context-menu`, `submenu`. Resin never contains
  Resin, and the DOM cannot enforce that, because every overlay is portalled to
  `body` and loses its nesting on the way. A `Dialog` declares the material it
  presents, and an overlay inside it reads that through React context, which
  follows the element tree where the DOM follows the document.
- [x] **`tabs` and `breadcrumbs`.** The tab strip and the segmented control are
  the same material with different semantics, so the strip moved into
  `styles/_strip.scss` before the second one could copy the first. The move was
  proved a no-op by compiling the segmented control's stylesheet before and
  after and diffing the declarations.

  The unit tests found three things that reading the source had not shown. React
  Aria's `Breadcrumbs` renders a bare `<ol>` and supplies no `nav` landmark.
  `MenuTrigger` hands its press behaviour down through context, so a plain
  `<button>` child never opens the menu and nothing reports it. And "1 hidden
  breadcrumb" was unreachable, because a collapse always hides `length - 2`. The
  last became a decision: a trail shorter than four now refuses to collapse,
  since hiding one crumb costs a click and saves no room.

  The browser found one more. A tab was a 36px target against a stated 44px
  floor, as the segmented control's pills had been since they shipped. See
  `scripts/verify-targets.mjs`, which now measures it.
- [x] **`anchor` and `nav-link`.** Both require an `href`. That is the
  catalogue's rule, "a link that acts is a button, not a link", and the type
  enforces it. React Aria renders a `<span role="link">` when given none. The
  result announces as a link, is absent from the browser's link list, cannot be
  opened in a new tab and shows nothing in the status bar.

  The nav link reserves the room for the current-location dot whether or not the
  dot is drawn, and one story exists only to show that the label does not move
  between the two states. A column that appears only for the current entry is
  the defect that had the leading selection mark withdrawn from Crystal, and a
  dot drawn here that shifted the label would reintroduce it under a new name.
  Measured in a browser: one distinct label position across all four rows.

  `component.anchor.underlineOffset` (4px) is new in Crystal. The catalogue
  states the value and no token carried it. Borrowing `spacing.2xs` for a
  typographic offset is how `selection.railWidth` became a generic 3px line.

  The tests caught one naming defect: a nav link with trailing content announced
  as "Inbox12", because the accessible name computation joins adjacent inline
  content with nothing between it.
- [x] **`tree-view` and `table-of-contents`.** Both mark their current row with
  label weight and put nothing in the leading space, because in both that space
  already means depth.

  The tree is a `treegrid` and not a `tree`. A `treeitem` in the plain tree
  pattern must not contain independently focusable widgets, and Crystal's row
  contains the disclosure the catalogue asks for, so the two cannot both be
  honoured. Level, expansion and full arrow-key navigation are all present.
  This is raised as M-3 for Meridian, because changing the catalogue is their
  call.

  The table of contents is controlled. The catalogue puts "which headings are
  collected, scroll spy thresholds" with the product, so the component is told
  which entry is active and `useHeadingInView` ships beside it.

  There were four defects, and the last three are the reason
  `scripts/verify-behaviour.mjs` now exists:

  - The tree animated its own rows on first render. The mechanism was React's
    effect ordering, children before parents. That ordering does not apply,
    because React Aria builds its collection in one commit and renders rows in
    the next, so every row mounts after the tree's mount effect. It was replaced
    with a flag set on the first expand.
  - `rootMargin: '-20% 0px -80% 0px'`, the usual spelling of a reading line a
    fifth of the way down, is a band of zero height, and nothing intersects a
    rectangle with no area. Two of five headings were never marked.
  - Given a real band, the last entry was unreachable, because a short final
    section cannot push itself to the reading line.
  - Detecting the end of the scroll inside the observer's callback does not help,
    because reaching the end is not a crossing and the callback never runs.

  The spy is now a passive scroll listener, coalesced to one read per frame. It
  has none of those edge cases. It also works in the in-app preview browser,
  which delivers no `IntersectionObserver` callbacks at all (D-5), so the
  observer did not work there.
- [x] **`drawer`.** "Modality must be real, not implied" is the catalogue's
  wording, and the design follows from it. `isModal` picks between two different
  constructions and not between two appearances. Modal is a React Aria `Modal`:
  focus contained, the page `inert`, Escape, scroll locked, focus returned, a
  Mirage scrim. Non-modal is a `complementary` landmark with no scrim, no trap
  and no lock. There is no way to ask for one's look with the other's
  behaviour, and both directions are gated.

  **`useMotion` gained `reorient`.** Crystal authors `drawer-in` once, from the
  right, with a physical `translateX(105%)`. CSS mirrors `padding-inline-start`
  and cannot mirror a transform, so that recipe is wrong on three of four edges
  and in every right-to-left page, and right-to-left is a verified axis in
  Crystal. `reorientRecipe` negates the inline component or turns the movement
  onto the block axis, and carries the fitted spring, the duration and the
  offsets through untouched. Authoring three more recipes would have meant
  authoring three more specifications.

  Two defects were found. The close control in the modal drawer had no handler
  at all: `Dialog`'s children were passed directly and not through its render
  prop, so the button rendered, focused, pressed and did nothing. An inline-end
  drawer sat 151px clear of the right-hand edge, because a shrink-to-fit holder
  anchors its content at its start. Both are now gated.

**Complete.** All 28: navigation 17, overlays 11. The twelve that were
outstanding are below, with what each had to get right.

- [x] **`portal`.** The mechanism, exposed. Every overlay here already portals,
  so this was easy to believe done, but a product needing the same escape for
  its own content had nothing to reach for. Two properties are tested. React
  context survives the portal, which makes `SurfaceProvider` and "Resin never
  contains Resin" enforceable. The container is resolved in an effect, because
  `document` does not exist while rendering on the server and `createPortal`
  throws.
- [x] **`hover-card`.** Opens on hover or focus, after a delay, and survives
  the pointer's journey from trigger into card. A boolean closes at the moment
  the pointer leaves the trigger and has not yet entered the card, so the
  component counts instead, with the same intent counter the disclosure,
  popover, menu and toast closures already use.
- [x] **`floating-window`.** The only component in this slice that is not a
  React Aria primitive, so its keyboard model is designed where the others
  inherit theirs: the title bar is a real control, arrow keys move it, Shift
  widens the step, a modifier resizes, and Home returns it. A window that can
  only be moved with a pointer cannot be moved by a keyboard user, and it looks
  complete to anyone testing with a mouse. Bounds are clamped on the way in
  rather than corrected afterwards, because a window dropped past a corner
  cannot be recovered by pointer or keyboard. Both need the handle.
- [x] **`nav-rail`, `dock`, `bottom-navigation`.** Three shapes of one idea at
  three densities, and the catalogue distinguishes them by material: a Frost
  rail with a Resin active destination, one Resin dock plane whose labels share
  a single Stone backing, and a Resin bar holding Haze label fills. The dock is
  one plane, because a row of separate Resin pills is Resin beside Resin. None
  of the three draws anything beside a label. The active destination changes
  its own material and its label weight.
- [x] **`navigation-menu`, `menubar`.** These exist separately because their
  roles are not interchangeable, and choosing by appearance leads to using the
  wrong one. A menubar is an application's command surface: `role="menubar"`,
  one tab stop, arrow keys between triggers, wrapping, Home and End, and a
  roving index that remembers where you left. A navigation menu is not a menu.
  It is a `nav` of disclosure buttons opening panels of ordinary links, because
  announcing a link as a `menuitem` says that following it runs a command, and
  the menu keyboard model forbids Tab between items a reader expects to Tab
  through.
- [x] **`pagination`, `stepper`.** Both announce their position and do not rely
  on drawing it. Every page control is named "Page 3". The ellipsis is not a
  control and no button's name contains it. The arrows are disabled at the
  bounds rather than removed, because a control that disappears changes the
  row's shape and moves every other target. Each step says its position, label
  and state in words, "Step 2 of 4: Details, current", and nothing in a stepper
  is focusable unless navigation is real.
- [x] **`burger`.** A disclosure that owes a name, `aria-expanded` and
  `aria-controls`, and whose name does not change with its state, because
  changing it re-announces the control as a different element to a reader who
  tabs back. This is the one place in this slice where motion carries meaning,
  so `icon-turn` plays it and the cross is a CSS end state, correct at rest
  whether or not it animated.
- [x] **`affix`.** A passive scroll listener rather than
  `IntersectionObserver`, which delivers nothing in the in-app preview browser
  (D-5). The component needs its placeholder: pinning takes the element out of
  the flow and its height with it, and releasing restores the height, which
  scrolls the threshold back under the element and pins it again.

### J: Data display (37), complete

`card`, `table`, `data-table`, `list`, `description-list`, `avatar`, `avatar-group`, `badge`, `status-badge`, `indicator`, `image`, `timeline`, `accordion`, `collapse`, `spoiler`, `carousel`, `statistic`, `code`, `kbd`, `theme-icon`, `authored-bubble`, `caption`, `calendar`, `data-view`, `virtual-scroller`, `image-list`, `organization-chart`, `rolling-number`, `image-compare`, `marquee`, `overlay-badge`, `navigation-tree`, `resizable-table`, `stat-card`, `kpi-tile`, `trend-indicator`, `delta-badge`.

The slice ends with `data-table`, the hardest component in the catalogue:
sorting, selection, resizing, virtualisation and drag-and-drop. React Aria
supplies every one of them, and every one needs a keyboard path as well as a
pointer one.

- [x] `card`: see slice C, where it was built as the first Haze surface.
- [x] **The small labels**: `badge`, `status-badge`. Both are counts or words on
  a Resin shell, and in both the work was accessibility more than geometry. A
  badge's visual is always `aria-hidden`. A loose "3" announced beside a button
  leaves a listener to guess what the 3 belongs to, so the meaning travels as a
  whole sentence in a live region or not at all, and for the same reason
  `description` is not defaulted to the count. A status badge puts the semantic
  pair on the well and leaves the pill Resin with ordinary text. Crystal's own
  cascade produces the same thing: `crystal.reset` paints the chip in
  `--status-surface`, and `crystal.component`'s control rule then overrides both
  the background and the colour. A status-coloured pill would make the word
  decoration on a coloured ground, and a status-coloured perimeter is the shape
  Crystal uses for focus.

  The catalogue's "36px minimum height" is a floor and the pill is taller.
  Twelve pixels of block padding either side of a 24px well is 48px of content
  box, and the pill renders at 50px with its rim, which is what the preview has
  always shown. Both numbers are true, and the floor protects the pill when the
  word is set at a smaller step.
- [x] **`code`, `kbd`**: the two surfaces that are not Crystal materials in the
  ordinary way. "Never feathered, as code must stay exact": a softened edge
  around a fragment of syntax reads as imprecision in the thing being quoted,
  so `Code` takes a canvas fill and an edge rim, the flattest surface Crystal
  has. A block is a tab stop with a Resin scrollbar,
  because a sample wider than its column scrolls and a scroll container with
  nothing focusable in it is unreachable without a pointer. `Kbd` is Resin plus
  one extra inset highlight along the bottom edge, which is the difference
  between glass and a key you could press. It carries no Haze fill, because the
  fill's own 8px inset is wider than the cap's padding.

  `Code` stops where `CodeBlock` starts. The catalogue lists both: `CodeBlock`
  is the documented sample with a filename, a named region and a copy control
  in a header, and `Code` is the typographic primitive.
- [x] **`caption`, `theme-icon`.** A caption never replaces alt text. Alt text
  says what the image *is*, for someone who cannot see it. A caption says what
  it *means*, to everyone. `Caption` therefore takes no `alt` prop at all,
  because offering one invites the two to be written as a single sentence.
  Overlaid, it sits on Stone, which exists for a label over artwork, where
  contrast cannot be argued from the palette because the palette is whatever
  the photograph happens to be. `ThemeIcon` looks exactly like an icon button,
  so the difference is in what it does: no press handler, no hit area, not
  focusable. It is `aria-hidden` unless it is the only carrier of meaning.
- [x] **`avatar`, `avatar-group`.** The component is built around its fallback
  chain. Identity images fail routinely, and a broken image icon where a
  person's face should be is worse than never having tried, so the image is
  watched and replaced in place. A new `src` starts again. Without that, a
  virtualised row shows one person's initials over another's photograph. The
  2px ring is the band of page surface that lets overlapping avatars read as
  separate people, which is why `AvatarGroup` needs no rule of its own to
  produce it. The stacking order counts down, so the first avatar is in front.
  Source order gives the opposite, and produces a row that looks identical
  until you notice every ring is cut by the avatar after it.

  The group is one named list and the people in it keep their names. The
  catalogue asks the group to have a name. It does not ask its members to lose
  theirs. The overflow chip shows "+3" and announces "3 more", because "+3" read
  literally is a plus sign and a number.

- [x] **`indicator`.** The mark a control wears, and the one place in Crystal
  where the Haze feather is not 1.95px. The catalogue asks for "a 3px-inset Haze
  fill and a 1px feather", and at 20px across the system feather is a fifth of
  the mark's own radius. `styles/_material.scss`'s `haze-fill` mixin took a
  second argument for it, defaulted so that every other caller is unchanged.
  It is `aria-hidden` and has no hit area at all, because the control beside it
  already carries `aria-checked`, `aria-invalid`, `aria-current` or `aria-busy`.
- [x] **`image`.** The ratio is reserved before anything loads, which is the
  only reason to use this over an `img` tag. `alt` is required and may be
  empty. Empty means decorative and absent means announced as a filename, and
  making the prop required forces the author to say which.
- [x] **`statistic`.** "Trend direction is stated in text, not by colour or arrow
  alone", so `trend` carries a direction and the words. The arrow is drawn
  beside them and hidden. `flat` takes the muted ink rather than a third status
  colour, because "no change" is not a status.
- [x] **`list`, `description-list`, `timeline`.** All three use the real
  element. A row with an `onClick` on a div is not reachable by keyboard and
  cannot be opened in a new tab when it was really a link, so `ListItem` takes
  `href` or `onPress` and renders what each one means, with the trailing action
  as a sibling of the row's control, because a button inside a button is
  invalid. A definition list is the only thing that keeps a term and its value
  associated when a reader moves through them out of order. A timeline is an
  `ol` because the order is the meaning, and its status is said in words, since
  three of its four states differ only by the colour of a small circle.
- [x] **`collapse`, `spoiler`, `accordion`**, and the distinction between the
  first two. A collapse is hidden from every reader. The usual `max-height: 0`
  leaves a zero-height region full of focusable links a keyboard user can still
  tab into, so a closed region is not rendered at all. A spoiler is the
  opposite. It is a visual economy, and a reader who is not looking at the page
  has no reason to be given less of it, so the truncated text stays in the
  accessibility tree behind a mask. `Accordion` is
  React Aria's `DisclosureGroup`, which makes "only one at a time" a property
  of the group, where otherwise five rows would each watch the others. The
  chevron's rotation is a CSS end state, correct at rest whether or not
  `icon-turn` ran, which is the rule `burger` established.

**The change this slice made to `useMotion`.** `play` now returns a promise that
settles when the movement finishes. Until it did, an exit recipe could not be
honoured at all: `accordion-out` and `list-out` mark a region closing, and a
region that unmounted the moment its state changed would play them into a
detached node. `usePreset` had solved this for the material presets and recipes
had no equivalent. Nothing has to await the promise. Every existing caller marks
an arrival and ignores the result. It settles on every path, reduced motion and
a missing element included. `Collapse` is the first caller to await it, and its
test asserts the region is still there on the tick after the state changed,
which a `waitFor` alone would not catch.

`list-out` is still not played by the library, and the comment in `List` says
why. The element of a removed row is gone by the time the component hears about
it, so an exit there belongs to whoever owns the data and can hold the row, and
the promise now lets them do that.

- [x] **`trend-indicator`, `delta-badge`.** Both exist to hold one rule:
  direction is carried by a word and a symbol, never by colour alone, and the
  sign is a character and not a colour. `TrendIndicator` makes the words a
  required child, because a direction with no words is a coloured arrow.
  `DeltaBadge` writes the sign itself as U+2212 MINUS SIGN. The hyphen a
  keyboard produces is read as a hyphen by some screen readers and rendered at
  hyphen width by every font, so a column signed with hyphens does not line up.
  `Statistic` was rebuilt on `TrendIndicator` in the same change, because with
  two implementations of one rule, one of them stops following it.
- [x] **`authored-bubble`.** The silhouette is Crystal's, value for value from
  `.cr-bubble`: three content-radius corners and one cut to 6px. The cut is
  written with logical radius properties, so the mirroring the catalogue asks
  for is expressed once, where a `[dir=rtl]` rule would express it twice.
  `grouped` drops the cut, because in a run of messages from one author the cut
  marks where the run starts, and repeating it on every message removes that
  signal. `author` is required, following "author and time are text, not
  implied by side alone". `arriving` is set by the caller and the component
  does not guess it, because Crystal's own note on `message-in` is "only on a
  new message; do not replay on virtualised history".
- [x] **`overlay-badge`.** A mark over a corner, where `badge` is a count
  attached to one. Two things are built into the component and not left to a
  note: the fill is on a pseudo-element so the glyph above it stays crisp, and
  the wrapper does not clip, because "never clipped by its host" is broken by
  any caller who wraps a rounded image in `overflow: hidden`.
- [x] **`rolling-number`**, the one place in this library where Crystal assigns
  no recipe and the component is still motion. `Card` plays nothing because the
  catalogue gives it nothing. Here the anatomy is "a number that animates digit
  by digit", so the component has to move. The roll is built from Crystal's
  published motion tokens and no recipe was invented: one digit of travel,
  `motion.duration.state`, and `motion.easing.settle`. The CSS does the same
  arithmetic `resolveDuration` does, which is `duration / speed`, and zero when
  `--cr-motion-enabled` is 0. The roll therefore follows the same preference
  slider as every JS recipe without a second copy of the rule. The value is
  announced once it settles rather than on every frame, and its test asserts
  the announcement is still the old value on the tick after the change.

- [x] **`stat-card`, `kpi-tile`.** Both are `Card` and `Statistic`, and neither
  is a third implementation of either. The stat card's rule, "the figure and its
  trend are one readable sentence, not a number beside an arrow", is a rule
  about order, which a card can enforce: label, figure, period, trend, read
  straight down. The KPI tile's rule is that attainment is stated in words as
  well as shown, because a bar near its end and a bar past its end look the
  same and neither says whether past the end is good. `onTarget` is the
  caller's judgement and the tile makes no comparison of its own. A cost target
  is met by coming in under it, and a tile that decided for itself would report
  every saving as a miss.
- [x] **`marquee`**, the one component in Crystal whose default state is
  movement at rest, against a rule Crystal otherwise holds absolutely. The
  catalogue lists it anyway, and its own semantics line reconciles the two:
  "removed entirely under reduced motion". So the animation and the duplicate
  copy both go under reduced motion, the viewport takes a tab stop so "pausable
  on focus" means something without a pointer, and `speed` is a rate rather
  than a duration, because the duration of a continuous scroll depends on the
  caller's content. The measured duration arrives as a custom property so the
  stylesheet can still gate it with `--cr-motion-enabled`. An inline
  `animation-duration` would outrank the rule and remove the gate without any
  sign.
- [x] **`image-list`.** A real `ul`, so a reader is told how many images there
  are before walking them, and `alt` required on every item exactly as `Image`
  requires it. The caption bar keeps the tile's radius on the two corners it
  meets, logically, so a right-to-left grid needs no second rule.
- [x] **`image-compare`**, and the defect `verify:targets` found in it. The
  divider is React Aria's slider: role, value, arrow keys, and `aria-valuetext`
  via `style: 'unit'` with the percent unit. `style: 'percent'` multiplies by a
  hundred and would announce "6,200%". The top picture is clipped rather than
  resized, because a width would squash it.

  The gate caught a defect that review would have missed. React Aria sets
  `position: relative` on the slider track inline, which outranks a class, so
  the track's `inset: 0` did not apply and nothing reported it. The track
  collapsed to zero height, and the handle's `50%` put it at the very top of
  the frame with half of it clipped by the container's own `overflow: hidden`.
  The failure read "44×44, but the top of a 44px target is not on it". The box
  was right and the position was wrong. A unit test cannot see that kind of
  defect and a screenshot review can pass it. Sizing the track, where the first
  version positioned it, is the fix that survives the inline style. The handle
  carries `data-cr-handle` because React Aria's real `input[role=slider]` lives
  in a visually-hidden 1px box inside it, so probing the named element would
  have reported a 1px target. The segmented control's label hit the same
  problem in slice I.

- [x] **`table`**, which the rest of the data components stand on.
  `crystal.css` already carries a complete `.cr-table` treatment, so the
  stylesheet follows it value for value and makes no choices of its own. That
  includes the Haze fill inset 6px where the usual is 8, which is the value
  here most likely to be "corrected" by somebody reading the Haze default. It
  also includes the header band's top corners at
  `calc(var(--cr-radius) - 8px)`, which keeps the catalogue's "header corners
  inset 8px" right when the radius slider moves.

  Two semantics are easy to get wrong. Every header carries `scope`, because
  header association lets a reader hear "Seats, column 3, 12" while moving
  across a row, and no ARIA pattern recovers it once the elements are divs.
  `aria-sort` goes on the `th` and not on the button inside it, with exactly
  one column carrying it at a time. It describes the table's current order and
  not each column's capability, so a sortable column that is not sorted carries
  nothing. The test asserts both, by counting the elements that have it and
  checking the tag.

  The shell scrolls and the page does not, so the shell is a named tab stop with
  the Resin scrollbar `.cr-table-scroll` gives it: a compact horizontal scroller
  is a control plane, and a scroll container with nothing focusable in it cannot
  be reached without a pointer.

- [x] **`carousel`**, which has no autoplay. Crystal's rule is that nothing
  moves at rest, the catalogue says "never autoplay without a pause control",
  and the recipes say "explicit next/previous navigation; never autoplay". The
  three state one thing. The catalogue assigns autoplay policy to the product,
  so a product that must have it owns both the timer and the control. The
  movement is on the arriving slide and not the track, because `carousel-next`
  and `carousel-previous` are a 3D swing-in and animating the track as well
  would move the same thing twice. The scroll itself is instant, by
  `scrollIntoView` rather than arithmetic on `scrollLeft`, which is negative in
  some engines in a right-to-left locale and zero-at-the-right in others. The
  index follows a passive scroll listener rather than an
  `IntersectionObserver`, which delivers nothing in the in-app preview browser
  (D-5).
- [x] **`navigation-tree`**, which is M-3's other half, with three things
  checked. React Aria's `NavigationTree` renders a `treegrid` of pressable rows
  carrying `data-href`, and does not render a nested set of `a` elements,
  whatever the name suggests. It does not set `aria-current`. It computes
  `data-current` and `data-current-ancestor` for styling and stops, so the
  catalogue's "aria-current on the active destination" is this library's to
  supply. Supplying it took a third attempt, because passing the attribute to
  `NavigationTreeItem` typechecks and is then filtered out of the DOM, and
  putting it on the row's content leaves it on a descendant of the element a
  reader lands on. And a React context provider placed around a collection is
  not visible to the children React Aria renders in its own pass, which is what
  the second attempt failed on.
- [x] **`virtual-scroller`**, already implemented and now named. It is React
  Aria's `Virtualizer`, re-exported, so the manifest's translation table maps the
  export to the catalogue id the way it does for `CrystalProvider`. It lacked
  the story R-18 taught this library to require. Crystal's half of this
  component is the scroll surface, which is composed and not implied, and a
  component whose Crystal half is a composition cannot be reviewed from its
  signature. The story is two thousand rows on a Frost `ScrollArea`.

  It also surfaced a bundling defect that had been latent. React Stately's
  layouts read `process.env` in the browser, Vite does not define `process`, and
  `ListLayout` threw `process is not defined` the moment a `Virtualizer`
  rendered. Nothing in this library used a layout until now. `.storybook/main.ts`
  defines both `process.env.NODE_ENV` and a bare `process.env`.

- [x] **`calendar`**, which existed and could not be reached. "Usable on its own
  rather than only inside a picker" is the catalogue's first clause, and the
  month grid was inside `DatePicker`, where a booking view that wanted a calendar
  and no field had to copy it. The grid moved to `Calendar` and `DatePicker`
  consumes `CalendarBody`, so the library has one month grid and not two that
  drift. The picker's popover carries the material and the standalone component
  carries the Frost panel, because Frost inside Frost reads as neither pane.

  Standing on its own exposed a defect the picker had hidden. The month header
  was a `<header>`, which is a `banner` landmark, and a banner inside the
  calendar's own `application` role is an axe violation. Inside a dialog the
  element is scoped away and nothing complained. It is a `div` now.

  Two facts about React Aria's date grid read like defects and are intended.
  The weekday row is `aria-hidden` on purpose. Each day announces its whole
  date, "Wednesday, September 23, 2026", so a reader hears the weekday without
  cross-referencing a column header whose position they cannot see. The
  accessible name is on a button inside the `gridcell` and not on the cell: the
  `td` is the grid position and the control inside it is the day.

- [x] **`data-view`**, which departs from its catalogue line in two places.
  "The layout switch is a control with a pressed state": it is a named radio
  group instead, because picking one of two arrangements is a choice and not a
  pressed state. Crystal and React Aria reach that independently:
  `SegmentedControl` is a radio group, and React Aria's `ToggleButtonGroup`
  renders `role="radiogroup"` with `aria-checked` the moment its selection is
  single. What the clause rules out is two unlabelled icons whose state is a
  colour, and that is ruled out at least as firmly. Using Crystal's own control
  means there is one segmented strip in the library and not two.

  "Layout switches at a declared breakpoint" is a container query and not a
  media query, because the same collection is a grid in a full-width page and a
  list in a narrow sidebar of the same window and only the container knows which.
  The width is Crystal's `$cr-breakpoint-sm` and not a prop. That is a limit and
  was not a choice: a container query's condition cannot read a custom property.
  It is a real `ul` in both layouts, because a grid of items is still a list of
  items. The arrangement is visual and the count is information.
- [x] **`organization-chart`**, drawn vertically and not as top-down boxes,
  which is a decision about who it is for. The catalogue asks for "a tree;
  collapse state is announced, and the chart is navigable by keyboard", and the
  top-down layout makes both hard: the DOM order that reads correctly is
  depth-first, the visual order is breadth-first, and every implementation that
  reconciles them does it by positioning absolutely and leaving the keyboard
  behind. A vertical hierarchy has the same connectors, the same collapse and
  the same reading order, and it gets React Aria's tree keyboard behaviour at
  no cost. It is a `treegrid` and not a `tree`, which is M-3 again and for its
  reason.

- [x] **`data-table`** and **`resizable-table`**, which end the slice. This is
  React Aria's `Table` where this library's `Table` is a plain one, and the split
  is the catalogue's own three entries. A static table is a document: a reader
  moves through it with their screen reader's table commands, and a plain
  `<table>` is what those commands are for. An interactive one is a grid widget,
  with roving focus, arrow keys moving a cursor between cells, and controls
  inside cells, and `role="grid"` tells assistive technology to switch from
  reading mode to interaction mode. Rendering the interactive one as a plain
  table leaves every one of those keys doing nothing.

  Selection is label weight, "not a check badge on the row": the checkbox makes
  the selection and the row shows it is selected by being heavier. React Aria
  composes each checkbox's name from its own label plus the row's text value,
  so the label passed in is the verb alone. "Select Gather" announces as "Select
  Gather Gather", which is how that was found. `resizable-table` is the same
  component with resizing on and every column resizable unless it says otherwise,
  because a second implementation would be a second table to keep in step.

  Two costs are recorded here. A `table-layout: fixed` rule was added on the
  assumption the fixed layout was missing, and planting `auto` in its place
  changed nothing: `ResizableTableContainer` sets it inline along with
  `width: min-content`, and had all along. The rule is gone and the comment says
  why. The arrow-key half of the resizer's contract is **not** verified, because
  React Aria's roving focus could not be driven to the control from Playwright
  in three different ways. That is D-18, which records what was tried and three
  ways out.

**What this slice had to write down rather than look up.** Crystal 2.0.0
publishes action geometry as tokens. It publishes badge, avatar, code, kbd and
caption geometry only as rules in `crystal.css` or, for the ones with no rule at
all, only as a sentence in the catalogue. Every such value enters through a
named variable carrying `crystal-allow-literal` and its source, so the set of
things owed a token in a later core release can be found with grep and does not
depend on memory. `styles/_avatar.scss` is the one that is shared, because the
overflow chip must be the same circle as the people beside it.

### K: Charts, statistics and visualisation (24), complete

`chart-surface`, `bar-chart`, `line-chart`, `area-chart`, `pie-chart`, `donut-chart`, `scatter-chart`, `radar-chart`, `spark-line`, `gauge`, `heatmap`, `funnel-chart`, `chart-legend`, `chart-tooltip`, `calendar-heatmap`, `treemap`, `sankey`, `candlestick-chart`, `waterfall-chart`, `bullet-chart`, `box-plot`, `histogram`, `geo-map`, `network-graph`.

`chart-surface` comes first and everything else composes onto it. **Every chart
owes a text equivalent of its data.** A chart is a second representation of the
data and never the only one, and colour never carries meaning alone.

**What the slice needed from Crystal before it could start.** Crystal's
catalogue named twenty-four chart components, and Crystal published no series
colours, no intensity ramp and no stroke or point scale, although the catalogue
says "line weight follows the stroke scale". A missing recipe is authored in
core. Crystal 2.1.0 now publishes six categorical colours per palette per mode,
a five-step intensity ramp with the ink measured for each step, and nine
geometry values. The values are derived by measurement, because the
requirements on seventy-two colours can be measured, and they are asserted
across all twelve palette-and-mode combinations. `R-20` carries the table here
until 2.1.0 is on npm, and is removed when it is.

- [x] **`chart-surface`**, and the two decisions every chart below it inherits.
  `table` is a required prop, so a chart cannot be drawn without its text
  equivalent, and no chart in the slice renders a table of its own. The table is
  folded behind a disclosure. That has a cost: a closed `<details>` keeps its
  content out of the accessibility tree, so the numbers are one action away. It
  is acceptable because the control is in the tab order immediately after the
  plot.

  The plot is drawn in CSS pixels at the measured width. A scaled, fixed
  `viewBox` is far less code, but it scales the stroke scale, the point scale
  and every axis label with the window: a 2px line becomes 3.4px on a wide
  screen.

- [x] **The keyboard model**, written once, in `useMarkNavigation`. Each chart
  is one tab stop, with a roving tabindex between the marks.
  "each item is reachable" cannot mean one tab stop each, because a
  two-hundred-point scatter would put two hundred stops between the control
  before it and the one after. The marks are SVG groups carrying `tabindex`,
  which is SVG 2. A unit test in jsdom cannot check that, because
  `element.focus()` on an unfocusable node is not an error there, so
  `verify:behaviour` drives it in a real engine. Navigation does not wrap at the
  ends, because a reader who cannot see the chart's shape loses their place when
  the cursor returns silently to the first point after the last.

- [x] **The second channel**, in `charts/channel.ts`. Which channel a mark takes
  depends on what the mark is: outlines take a dash, points take a shape and
  areas take a label. A hatch is noise at the sizes charts use, and the
  catalogue already asks for the label on every area mark it describes
  ("each segment is labelled with its value", "intensity is paired with a value").

- [x] **`bar-chart`** and **`line-chart`**. A bar's marks are lengths, so the
  axis includes zero and the component does not offer the alternative. A line's
  marks are positions, so the domain fits the data: a series between 412 and 418
  drawn from zero is a flat line. A fitted domain may leave zero out, and it may
  not extend past zero to a side the data never reaches. That rule was added
  after an axis offered −100 on a chart of counts.

- [x] **`area-chart`**. Its stacked table carries the total, because the top
  edge of the picture asserts the total and a reader should not have to add six
  numbers to check it. The band is generated from a pair of accessors. Drawing
  the edge forwards and walking it back is right for straight segments and wrong
  for every curve, because a reversed cubic is not the same cubic with its
  points swapped.

- [x] **`pie-chart`**, **`donut-chart`**. A pie states its total, because a pie
  asserts a whole and a reader cannot notice four per cent missing without it.
  Order is the caller's and is never sorted, so that "the third segment" means
  the same segment in the picture and in the table. The donut's ring thickness
  is set by Crystal and not by the caller, so a donut is the same object at
  every size. Its centre is real text in the document.

- [x] **`scatter-chart`**, which sizes points by area, so equal differences in
  the data are equal differences in ink. Mapping the value onto the diameter
  makes the largest point three times the area it should be. The test checks
  that the halfway value lands halfway in area and does not land halfway in
  width, because both look right in a screenshot.

- [x] **`spark-line`**, the one chart here that is not a `ChartSurface`. A spark
  line sits inside other content, and a table row holding six of them should not
  become six figures and six tables, so the required `summary` is the text
  equivalent. It is required because every implementation that made it optional
  shipped without it.

- [x] **`gauge`** and **`bullet-chart`**, both `role="meter"`. A meter is a
  measurement in a known range and a progress bar is a task getting closer to
  finishing, and the two announce differently. The bullet's target is in the
  meter's text and on the screen, because "62" alone tells a reader nothing.
  Every qualitative band is named, because a band with no name is only a colour.

- [x] **`heatmap`**, **`calendar-heatmap`**, and one intensity scale for the
  whole system. The buckets are equal-width and never quantiles. Quantiles put
  the same number of cells in every bucket, so a week where one day had four
  times the traffic looks the same as a week where every day was the same. There
  are three marks for three states, "this much happened", "nothing happened" and
  "nobody counted", because drawing the last two alike reports a zero that
  nobody measured. Under forced colours the ramp collapses to one colour, so the
  intensity becomes the size of the mark. That was found by looking at a
  forced-colours capture.

- [x] **`funnel-chart`**, which states both shares. "Relative to what" is the
  question a funnel answers, and it has two answers. People mean different
  things by "conversion", so the chart states both and picks neither silently.
  It draws bands and not a tapering trapezoid, because a trapezoid puts each
  stage's value in an area, and people read areas worst.

- [x] **`radar-chart`**, **`box-plot`**, **`histogram`**, **`waterfall-chart`**,
  **`candlestick-chart`**. A box plot counts its outliers, because twelve dots
  tell a reader who cannot see them nothing. A histogram's bins meet by sharing
  edges. Giving each bin a width leaves a sub-pixel gap when the width is
  rounded, and a gap draws a range where nothing was counted. A candlestick
  already has a second channel: hollow for a rise and filled for a fall is how
  the chart was drawn before screens had colour.

- [x] **`chart-legend`**, **`chart-tooltip`**. The legend announces what the
  reader just did and not the current state of the data, because people turn off
  a live region that speaks on every render. The tooltip is `aria-hidden`,
  because every value in it is already the label of the mark it describes, and
  announcing both would read every number twice.

- [x] **`treemap`**, **`sankey`**, **`geo-map`**, **`network-graph`**. The
  treemap is navigated as a tree: one level at a time, `Enter` to descend,
  `Escape` to return, and a breadcrumb that says where you are. The sankey names
  both ends of every link, because the nodes are the labels and the links are
  the data. The geo map takes its topology from the caller, because a world
  outline shipped with the component would give every product that used it one
  political position on borders and names. The network graph takes positions
  from the caller and does not compute them, because a force simulation is
  motion and nothing moves at rest.

**What this slice had to write down.** Two things. The first is that
`crystal.css` styles the element, with `svg { width: 20px;
height: 20px; fill: none; stroke: currentColor; stroke-width: 1.8 }`. That is
right for the thousand icons Crystal ships and wrong for every other drawing,
and a consumer loading the stylesheet gets it either way. It is D-1's hazard in
a new place: a spark line came out twenty pixels square, and every filled mark
took a body-ink outline inherited from an ancestor. The second, which was not
expected, is that a label written straight onto a series colour has no ink that
clears 4.5:1, because the series colours are all drawn at one lightness. The
label takes Crystal's own Stone backing, as a halo round the glyphs. A pad
behind them would have to be the size of text that has not been measured yet.

**Dependencies.** `d3-scale`, `d3-shape`, `d3-hierarchy`, `d3-sankey` and
`d3-geo` do the arithmetic. They are licensed ISC and BSD-3, with no paid
licence. Every element on the screen is still written here, because a charting
library that owned the markup would also own the materials, the focus ring and
the forced-colours behaviour, and none of those would be Crystal's.
`check-bundle.mjs` caught all five being vendored into `dist/` the first time
the charts were built.

**What a reviewer found.** Three defects passed every gate in the slice, because
each was a gap between components and no single component was at fault. A
tooltip existed and no chart used one, so every value was on its mark for a
screen reader and nowhere for a sighted reader. That is fixed with
`useMarkTooltip`, which joins hover and the roving cursor into one index, so the
panel cannot describe a different mark from the one the ring is on. A
multi-series chart named its series only in `aria-label`s and the folded-away
table, so the picture had no key. The four series charts and the pie now render
a `ChartLegend` themselves unless the caller passes one, `null` included. Hiding
a series could only be done by filtering the array, which repaints every series
after it and leaves the legend describing the wrong colours. That is fixed with
`hidden` on `ChartSeries` and with `drawnSeries()`, which keeps a series'
**channel** (its colour and dash) apart from its **slot** (its place in the mark
numbering). A fourth, smaller defect: `useMarkNavigation` lost the plot's only
tab stop when the data shrank under `active`, so a keyboard could no longer
reach the chart.

**What is deferred.** The catalogue asks `bar-chart` and `pie-chart` for an
enter motion and `line-chart` for a draw-on. None of the twenty-four has one,
because Crystal publishes no recipe for a mark arriving and this library does
not author recipes. R-21 records it with the reasoning.

### L: Feedback (15), complete

`alert`, `toast`, `notification`, `progress`, `ring-progress`, `loader`, `skeleton`, `loading-overlay`, `empty-state`, `result`, `popconfirm`, `tour`, `semi-circle-progress`, `meter-group`, `banner`.

**What each one is built around.** Every entry below is a sentence from
`core/tokens/catalogue/06-feedback.json`.

- **`progress`**. "indeterminate omits the value rather than faking one". The
  type has no `indeterminate` flag beside `value`, so that "we do not know"
  cannot be typed next to a number, and `exactOptionalPropertyTypes` stops a
  story from expressing it as `value: undefined` either. The track is the
  slider's track, from `component.slider.trackHeight`, because "matching the
  slider track" is a sentence about two components that must not drift.
- **`ring-progress`**, **`semi-circle-progress`**. One stroke shared with the
  gauge, `--cr-progress-ring-stroke`, published in core for that purpose. Both
  draw through the charts' `arcPath` instead of a second annular sector.
- **`meter-group`**. Each segment is its own `role="meter"`: "63% disk, 22%
  cache" is two measurements, and one element reporting a single number would
  have to pick one. Tints come from Crystal's chart series scale.
- **`alert`**. `role="alert"` only for urgent content that has to interrupt.
  An assertive live region interrupts a screen reader mid-word, so `urgent` is
  an explicit opt-in and is not implied by `danger`.
- **`banner`**. "dismissal returns focus sensibly": the control being pressed
  is the control being removed, so `returnFocusTo` exists to make the omission
  visible.
- **`result`**. The outcome is in a real heading. Six outcomes map onto four
  ink pairs, because Crystal publishes no fifth and sixth semantic pair, and
  inventing two would add two more colours to hold at 4.5:1 across twelve
  combinations.
- **`empty-state`**. "no-results and truly-empty are different states". `state`
  is required with no default: a component with one empty state tells a reader
  with three hundred projects that they have none.
- **`loader`**. The text is required. A bare spinner tells a sighted reader
  that something is happening and tells everyone else nothing.
- **`skeleton`**. It wraps its content instead of replacing it, which is the
  only way `skeleton-resolve` can exist: a skeleton swapped out by its caller
  has already unmounted when the data arrives. There is one live region for the
  whole skeleton, not one per line.
- **`loading-overlay`**. The blocked region is `inert`. A scrim hides a region
  and stops the mouse and does nothing about the tab key, which is why this
  component wraps its region instead of being dropped on top of it.
- **`toast`**. "auto-dismiss must never remove the only route to an action",
  enforced in the type: `ToastOptions` is a union in which an `action` and a
  `duration` cannot appear together. A runtime warning is read only after
  shipping.
- **`notification`**. Unread is label weight, with nothing drawn beside the
  label: Crystal's selection rule applied one component along, because a mark
  beside the title offsets the title it points at. The state is said in words
  too, since weight is not read out.
- **`popconfirm`**. Focus lands on Cancel. A confirmation exists because the
  action is hard to undo, and one that puts the destructive choice under the
  key the reader is already pressing has asked a question whose default answer
  is yes.
- **`tour`**. Escapable from every step, focus returns to whatever had it when
  the tour began, and the position is in the panel's accessible name.

**One shared vocabulary instead of five copies.** `src/feedback/status.ts` and
`styles/_status.scss` hold Crystal's four glyphs and four ink pairs once;
`StatusBadge` was moved onto them in the same pass. `src/feedback/ActivityArc.tsx`
is the ring that an indeterminate `RingProgress` and a `Loader` both are.

**Adopted from Crystal.** `Button` gained the `danger` variant this library was
missing. Crystal 2.1.0 restored `.cr-button.danger` as an independent boundary
rather than a fill, and when Crystal and a library diverge the library adopts.

**Four gates that guarded nothing, found by planting them red.**

1. The reduced-motion check asserted "the animation is gone". `crystal.css`
   carries a global `animation: none !important` under reduced motion, so the
   check was green with the component's own rules deleted. It now asserts what
   the component owns: the stopped bar fills the track, because a segment
   frozen two fifths along reports a measurement nobody took.
2. The forced-colours heatmap check passed because empty cells differ from
   measured ones, not because intensities do.
3. The toast lifespan test waited 400ms, which is shorter than a 30ms lifespan
   plus a 440ms `toast-out`, so nothing could ever be observed leaving.
4. The tour's spotlight was `clip-path: xywh(…) exclude xywh(…)`, which is not
   CSS. The declaration was dropped, the scrim had no hole in it, and eight unit
   tests passed because jsdom measures nothing and the component took the branch
   where there is no box to cut.

**Five more found after the slice was first called done.** Every one of them
changed what ships.

- **Every `show()` reset every visible toast's countdown.** `onDismiss` is a new
  closure on each provider render, so the lifespan effect tore its timer down
  and started it again whenever any toast arrived. In a busy stack the oldest
  toast outlived them all. Every test that raises one toast misses it; the test
  that catches it keeps toasts arriving and asserts that the first left on time,
  since waiting for it to go passes either way.
- **The tour said `aria-modal="true"` and let Tab walk out of it**, onto the
  control it was spotlighting. It is contained with `FocusTrap` now, and checked
  by pressing Tab eight times in a real engine.
- **An uncontrolled `Popconfirm` never closed after Confirm.** Only Cancel
  carried `slot="close"`.
- **`Skeleton`'s live region was born with its text in it**, which is the
  hazard the toast stack is built to avoid.
- **`LoadingOverlay`'s "focus does not enter it" was a claim no unit test could
  make.** jsdom ignores `inert` for focus entirely, so the test is green with
  `aria-hidden` in its place, and that is the version that ships broken: it
  hides the region from a screen reader while leaving every control in the tab
  order.

Twice in this slice a gate identified an element by its position in the DOM and
stopped checking anything when something was inserted beside it. Both now use a
stable attribute.

**What is not here.** Crystal has no continuous motion recipe. D-19 in the core
repository records that its catalogue asks three of these components to spin,
sweep and travel while its motion chapter publishes fifty-four finite recipes
and says nothing loops. Every continuous indicator here takes one duration,
`--cr-flow`, and authors only the shape of the movement.

### M: Media (5), complete

`video-player`, `audio-player`, `media-controls`, `gallery`, `lightbox`.

Real `video` and `audio` elements underneath. Captions with announced state, a
scrubber that is a slider rather than a progress bar, and keyboard transport that
does not trap focus.

**The element is the source of truth.** `useMediaElement` reads every value
from the `<audio>` or `<video>` and sets none of them: the controls call
methods, the element fires events, the events move the state. A player that
kept its own `isPlaying` is wrong the first time anything else touches the
media, and plenty does: the operating system's media keys, a Bluetooth
headset's pause button, another tab taking audio focus, picture-in-picture,
`autoplay` being refused.

**What each one is built around.**

- **`media-controls`**. "play and pause are **one toggle with a pressed
  state**". Two buttons swapped by state means the one a reader has focused
  disappears under them the moment they press it, and focus falls to the
  document. And "the scrubber is a **slider announcing time, not a progress
  bar**": a progress bar reports, a slider is operated. It also has to say a
  time. `1:23` reads as "one colon twenty-three", so `src/media/time.ts`
  publishes two notations, one for the screen and one for the announcement,
  and owns both so the two players cannot format a second differently.
- **`audio-player`**. A real `<audio>`, handed to the caller through
  `mediaRef`, because sources, playlists and streaming are the product's half
  and all of them are done on the element. The browser's own `controls` are
  off: two sets of controls for one element is two tab stops per action and two
  places a state can be shown differently.
- **`video-player`**. "captions are supported and their state is announced":
  the toggle is over `textTracks`, its pressed state is the track's real
  `mode`, and the change is said in words. "Keyboard shortcuts do not trap
  focus" is two separate promises: no document-level listener, which is the
  shape that steals the space bar from the page, and no shortcut that takes a
  key from the control the reader is on.
- **`lightbox`**. Pan is the platform's. The enlarged item lives in a scroll
  container the reader tabs to, so arrow keys are the engine's own scrolling. A
  component that read arrow keys itself would answer "what do arrows do here"
  differently depending on the zoom, a mode nobody was told about. Leaving pan
  to the platform also leaves the arrows free for a gallery to move between
  items.

  That only works if the container has something to scroll, and for a while it
  did not: see the defect below. The zoom is now the item's size, not a
  transform on it, and the item is laid out from the frame's origin rather than
  centred on it.
- **`gallery`**. The thumbnails are one tab stop with a roving `tabindex`, the
  same argument the charts make about marks. The position is part of the
  viewer's accessible name, because a reader who cannot see the strip has no
  other way to know where in the set they are. It is announced as well as
  named, because a dialog's name is read when the reader arrives in it and is
  not read again when it changes underneath them.

  Selection on a thumbnail is Crystal's other half of the selection rule. There
  is no label to weight, so the selected thumbnail takes the tinted reading pad
  core paints a selected control with, and not the outline: a 2px primary
  outline is how Crystal paints focus, and a thumbnail wearing one goes on
  looking focused after focus has left the strip.

**One extension to an existing component.** `Slider` gained `valueText`, a
narrow escape hatch that sets `aria-valuetext` when `Intl.NumberFormat` cannot
say the value. The component rejects a formatting function, because the visible
output and the announcement must agree by construction, so this sets the
announcement only and the visible number stays the formatted one. It had to go
on the `<input type="range">` React Aria renders inside the thumb, which is the
element carrying the `slider` role; an attribute on the thumb's own `<div>`
lands on a wrapper nothing reads.

**Two gates that guarded nothing, found by planting the slice's claims red.**

1. `expect(container.querySelector('[role="group"]')).toBeNull()`. The lightbox
   is portalled to `body`, so a query scoped to the render container finds
   nothing whatever the component does.
2. "Space on the play toggle is the button's Space" counted plays and passed with
   the guard deleted, because React Aria's button does not let the press bubble
   as a second toggle. It presses `m` at the focused scrubber now, where the
   difference is the video muting or not, and it uses `fireEvent`, because
   `userEvent` does not dispatch a printable keydown at a range input at all.

Twice more a check identified an element by its position in the DOM and
reported the wrong thing: the first `[role="status"]` in the player is the
transport's buffering region, which is empty and always will be. That is the
same mistake as slice L's, now made three times.

**A review of the slice found four more, and the worst of them had shipped the
component's whole purpose broken.** They are recorded in full because the
pattern transfers.

1. **The lightbox showed no picture.** `max-inline-size: 100%` on the item's
   image resolved against an item that was itself sized by that image, a cyclic
   percentage, which Chromium resolves against zero. The item measured 0×0 in
   every browser. Eight unit tests passed, because jsdom measures nothing and so
   had no size to disagree with, and no gate had ever looked at the picture. The
   fix makes both percentages resolve against the grid area, which is definite
   for reasons of its own.
2. **Nothing could be panned to.** `scale` paints outside the box without
   changing it, so the scroll container saw the content it always had. A scroll
   position cannot go negative, so centring an oversized child, by transform or
   by `place-items`, puts half of it where no scrollbar, no arrow key and no
   screen reader can reach. Both halves are now measured at scroll zero, which
   is where a reader starts.
3. **`hands the element to the caller` was vacuous.** It read `ref.current`
   during the render that creates the ref and asserted it was null, which is
   true of any component and of no component. It would have passed with
   `mediaRef` ignored entirely, and it was not among the claims planted because
   it read like a test of a value rather than of a behaviour. `VideoPlayer` had
   no such test at all; it has one now.
4. **`zooms from a control and from the keyboard` never pressed a key.** Half a
   claim, asserted by its own title.

Two claims also turned out to be held by a dependency and asserted by nobody:
that closing returns focus to the thumbnail, and that the gallery returns it to
the thumbnail the reader ended on. The first was true and is now tested. The
second was false: React Aria restores focus to the thumbnail they opened, which
after moving through the set leaves focus on one picture while the strip's
roving cursor sits on another. Claiming it synchronously is not a race. React
Aria restores inside a `requestAnimationFrame` and only if focus is still on the
body by then, and defers to anything that "has been purposefully moved
elsewhere". The guarantee that focus never lands on the body is still the
dependency's; only the destination is this library's.

Two more came out of reviewing that review. The viewer is mounted while it is
closed, so a gallery pointing it at another item moved the announcement before
anybody had arrived in it: a reader who arrowed along the strip and pressed
Enter was told what had changed while they were not there. And the zoom outlived
the sitting: closing and reopening the set found it still at 400 per cent.
`isOpen` is required now and `defaultOpen` is gone, because a viewer that resets
on close has to be told when it is closed.

**The rule this slice adds.** Slice L's rule was to plant anything that turns on
time or on absence. This slice adds: plant anything whose subject is a
measurement, and never trust jsdom for one. Three of the four defects above are
invisible to a DOM that has no layout, and the two worst were geometry. A
component whose entire job is to show one picture larger needs a gate that has
seen the picture.

### N: Commerce (24), complete

`price`, `price-range`, `discount-badge`, `quantity-stepper`, `variant-selector`, `stock-indicator`, `product-card`, `product-gallery`, `cart-item`, `cart-summary`, `coupon-input`, `checkout-steps`, `payment-method`, `address-form`, `order-summary`, `shipping-selector`, `delivery-estimate`, `wishlist-button`, `review`, `rating-summary`, `filter-panel`, `sort-select`, `compare-table`, `recently-viewed`.

`payment-method` defers to the host provider's own element and never handles raw
card data, which keeps PCI scope out of the library entirely.

Built in six rounds, each with its own planting pass: the atoms, the controls,
the choice groups, the cart, the catalogue, and the address form last because it
is the one with a scope trap in it.

**Done: the atoms (5).** `price`, `price-range`, `discount-badge`,
`stock-indicator`, `delivery-estimate`.

`src/commerce/` came first, as `feedback/status.ts` and `media/time.ts` did.
Nine components in this slice render an amount, and each of them would otherwise
decide separately how a number becomes a currency, which is what the catalogue
means when it says Crystal "left every store to reinvent … currency
formatting". So the unit of exchange is `Money`, an amount with its currency:
`29.99` alone is a price in something somebody has to remember. Every rule about
where the separator goes, whether the symbol leads, and how many fraction digits
a currency has is `Intl`'s, reached through `NumberFormatter` so the locale
comes from `CrystalProvider` and not from the call site.

**What the catalogue's wording decided, in each case.**

- **"A percentage alone is not a claim."** `DiscountBadge` refuses a `percent`
  prop. A percentage handed in from outside is a number nobody can check
  (twenty per cent off something), so the badge takes the two amounts and
  computes the reduction, which stops it disagreeing with the price beside it.
  An increase and a cross-currency ratio both render nothing, since either
  would assert something the component has just worked out is false.
- **"Reads as a sentence rather than two numbers with a dash."** A dash means
  nothing out loud, and a reader who cannot see the layout cannot tell an upper
  bound from an instalment. `PriceRange` joins its ends with words, and the
  words are a prop because word order differs between languages. A range whose
  ends are equal, or whose ends are in two currencies, is not a range and
  collapses.
- **"An absolute date, not only a relative phrase."** "Arrives in 3 days" stops
  being true the moment it is cached or read the next morning, and it cannot
  answer the question that matters: deciding whether a parcel beats a Friday
  needs a date. So `DeliveryEstimate` always renders one, with the relative
  phrase in addition.
- **"Words carry the state."** `StockIndicator` is a `StatusBadge` with the
  availability vocabulary in front of it, with no second badge drawing the same
  well. Backorder is `info` rather than `attention`: the item can be bought and
  arrives later, and the attention colour would report a problem where there is
  an ordinary outcome.

**What the one-string rule does and does not forbid.** `NumberFormatter`
refuses a separate spoken form, because "1.2M" and `1204893` are two different
values and the one a screen reader reads is the one nobody checks. A pill
reading "20% off" whose accessible name reads "£40.00, reduced from £50.00, 20%
off" is the same fact stated more completely, the pattern the notification's
"Unread." and the gallery's position already use. Where a product needs the
currency spelled out because `$` is ambiguous, `currencyDisplay="name"` spells
it out for everybody. That is the case the rule governs.

**Planting.** Eight claims planted red: the range's two collapses and its
dash-free sentence, the badge's refusal of an increase, backorder's status, the
estimate's live region, its unavailable wording, and its `datetime`. The last
one needed two instants rather than one. A date at local midnight has the same
UTC day in a zone behind Greenwich, so a single fixture cannot see
`toISOString` being wrong. Whatever the offset, one of an early and a late
instant crosses; in UTC itself neither does, which is the one place the defect
does not exist.

**Done: the controls (4).** `quantity-stepper`, `wishlist-button`, `sort-select`,
`coupon-input`.

**The stepper differs from `NumberInput` by one number.** `NumberInput` says of
its chevrons that "making each 44px would make the field 88px tall", which is
right for a form where the arrow keys are the primary route. The catalogue says
of this one: "Pill; **both controls reach 44px**." A stepper beside a price is
pressed with a thumb, on a phone, next to a Remove control it must not be
mistaken for. The two share a primitive and make opposite geometry decisions,
and neither is a variant of the other.

**Building it found R-22, and a false sentence in this repository.** The
catalogue calls the stepper "a spin button". React Aria's `NumberField` computes
the spin-button props and then strips every one of them (`role: null`,
`aria-valuenow: null`, `aria-valuemin: null`, `aria-valuemax: null`), with the
reason in its own source comment: "we can't focus a spin button with VO". So the
catalogue asks for a role the accessible primitive removes on purpose, and
resolving that is Meridian's decision.

Two consequences need separating. The role is deferred, filed as R-22. The
bounds are not deferred: stripping `aria-valuemin` and `aria-valuemax` takes
them off the control entirely, so the live region here is the only thing that
conveys them, and "announced when reached" is met in full. It announces on a
change and never on mount, because a stepper that opens at its minimum has not
reached anything.

`NumberInput`'s own header had claimed the opposite, that React Aria "gives a
`spinbutton` with `aria-valuenow`, `aria-valuemin` and `aria-valuemax`", and
that sentence sent this component's first draft down the wrong road. It is
corrected. A header is a source somebody will believe, and this one was believed
by the next person to read it.

**The wishlist button's name does not move.** "A name that says what it will do"
has two readings and only one is safe. A name that flips to "Remove" once the
item is saved is announced as "Remove from wishlist, **pressed**", and pressed
says the item is in the list while the name says pressing is what puts it there.
The safe reading is that the name is a verb phrase, with `aria-pressed` carrying
the state, the decision `MediaControls` already made about play and pause. The
item is in the name too, because thirty controls called "Save to wishlist" are
thirty identical rows in an element list.

That needed `Button` to gain `isSelected`, which `IconButton` has had since the
actions slice. Crystal's stylesheet has always specified
`button[aria-pressed=true]` (the reading pad in `--cr-primary` with its feather
off, `--cr-on-primary` ink, weight 800), and having the state on one shape of
the control and not the other was the inconsistency.

**The sort select announces the ordering**, because pressing it rewrites a list
the reader is not looking at. A sighted reader sees the list flip; a screen
reader hears the select close and then nothing. A select's value and "the list
beneath you has been reordered" are two different statements. Everything else
is `Select`; the component adds only the announcement.

**The coupon field's answer is the whole component.** It is one of the few
places in a checkout where a reader has done something and cannot tell whether
it worked. Failure is an `alert` and success a `status`, the same split the
feedback slice made between `Alert` and `Banner`. The field applies on Enter as
well as from the control, and applying disables the action instead of replacing
it with a spinner, because a control that vanishes under the cursor mid-press is
one the reader has to find again.

**Planting.** Seven more: the stepper's bound announcement and its silence on
mount, its refusal of a fraction, its two 44px targets in a real browser, the
wishlist name staying put, the sort select's silence on mount, the coupon's
Enter, and its alert-not-status. Two of the tests were also wrong where the
code was right. A stepper bounded to a single step has no value that is not a
bound, so the clearing half could never be seen, and the fraction guard turned
out to reject the decimal separator at the parser instead of rounding after it,
which is the stronger behaviour and a different claim.

**A review of the round found three more**, and one of them was a sentence
this slice had itself just written.

1. **A pressed toggle did not look pressed, and the reason is the layer
   contest.** `Button` gained `isSelected` with a comment claiming it renders
   "the appearance Crystal already specifies for a pressed action". Measured in
   a browser, it did not. `crystal.css` carries that rule as
   `:is(button[aria-pressed=true], …)` in `@layer crystal.component`, and a CSS
   module class in this package is unlayered, so the library's own `.button`
   outranks it without a specificity contest. That is what cascade layers are
   for, and it is what makes this easy to miss. The recipe is written here now,
   in the library's own layer, with Crystal's values: the reading pad in
   `--cr-primary`, `--cr-on-primary` ink, the label at weight 800. The wishlist
   pill's filled heart went with it, because two treatments for one state leave
   a reader hunting for a difference between them; the icon shape keeps the
   fill, having no label to weight.

   This is the second false header sentence in one slice, after
   `NumberInput`'s. Both were written from what a dependency or a stylesheet
   was expected to do and not from what it was seen doing, and both were caught
   by measuring. A `verify:appearance` check now compares the two states
   instead of checking that a token is spelled somewhere.
2. **The sort select announced before the list had moved.** Most orderings are a
   round trip, and the component does not own the list, so the only moment it
   can say the list has been reordered is when the handler that reorders it has
   finished. `onSelectionChange` may return a promise now and the announcement
   waits for it. If the promise rejects, nothing is said, because a sort that
   failed is the product's to report and this component claiming success would
   be worse than silence.
3. **The coupon field focused an input that did not exist.** Applied and
   unapplied are two different trees, so at the moment Remove is pressed the
   field the ref names has not been mounted yet. `field.current?.focus()` there
   focused nothing and left the reader on a control that had just removed
   itself. Bringing the field back and putting focus in it are two renders, and
   the focus belongs in the second.

**Done: the choice groups (3).** `variant-selector`, `payment-method`,
`shipping-selector`.

All three are the same thing, a radio group whose options are cards with a Haze
fill, so the card lives once, in `src/styles/_option.scss`, beside `_status.scss`
and `_field.scss` and for the same reason. All three are built on `RadioGroup`
and not on React Aria directly, which keeps the field shell that carries the
validity React Aria resolved: a server saying "choose a delivery method" has to
move the group exactly as a local rule would.

**Selection is label weight here, and that is Crystal's rule for this shape.**
`crystal.css` gives a selected button the primary reading pad and gives
`[role=tab][aria-selected=true]` only `font-weight: 800`. The difference is the
distinction: a pressed button is an action in its on state, an option is a
choice among peers. Both catalogue entries say the same ("selection is label
weight, never a check mark", "the selected one carries label weight"), so an
option painting itself primary would be shouting a choice the reader has just
made.

**The swatch is the case with no label**, and it cost two defects that only a
browser could see.

1. **A selected swatch disappeared into its own selected state.** With no label
   to weight, a swatch's selection is its pad, and the pad is `--cr-primary`, so
   a product whose brand colour is also one of its variant colours gets a swatch
   selected by being painted the colour it already was. Measured: pad and colour
   both `rgb(115, 56, 239)`. The fix is two rings, and the outer one does the
   work: a gap in the surface's colour, which works because it never has to
   contrast with either side. The colour is drawn against it on the inside and
   the pad on the outside. Where the gap and the colour match, which is white on
   white, the inner hairline separates them. Each ring covers the case the other
   cannot.
2. **Choosing a swatch changed its shape.** The card's selected rule thickens a
   rim and takes a pixel of padding back so the card does not grow. That is
   right for a card, and applied to a 44px circle it crushed a 34px colour into
   a 10 by 18 ellipse. The mixin is split now, so a shape only takes the
   selected treatment written for it. The gate written for the first defect
   found this one on its first run.

**Two boundaries stated.** An unavailable variant stays and says why. Removing
it means a shopper who cannot find the large sees a product that does not come
in large and goes elsewhere: the same information, and only one of the two
tells the reader anything. And `payment-method` renders no card field: one typed
into an input this library drew would put every product using Crystal inside
PCI scope, and the failure would not look like one. It would work, look right,
and pass everything in this repository.

**Planting.** Nine: the card field, the provider mounting only while chosen, the
unavailable variant surviving, the swatch's name, the absent check mark, and the
swatch's two halves in a browser (the gap ring and the roundness), each planted
on its own.

**Done: the cart (4).** `cart-item`, `cart-summary`, `order-summary`,
`checkout-steps`.

**`checkout-steps` is `Stepper` with a shape**, and the catalogue is why. It
gives `stepper` "circular markers; connector 2px" on a Haze track and
`checkout-steps` "steps are pills; connectors are hairlines": two drawings and
one set of semantics. Writing the semantics twice would give
`aria-current="step"` and the state wording two places to drift, and the
wording is what carries the meaning to anybody not looking at the markers. So
`Stepper` gained `shape`, and the check mark stays where it already was:
`complete` is the one place in Crystal the glyph is right, because there it
means validated.

**`cart-summary` is a description list, and that is the requirement.** A
summary built from rows of two spans is, to anything that is not a pair of
eyes, a stream of words and numbers in which "Shipping" and "£3.99" are two
unrelated pieces of text that happen to be adjacent. `<dl>` says which amount
belongs to which line. The total is marked with `<strong>` and not only drawn
larger, because size is what a sighted reader uses to find it and the rest need
the markup. And "updating" keeps its figures: a total being recalculated is
still a number, and a spinner over the top takes away the only thing the reader
had.

**`cart-item` announces the subtotal, not the quantity.** The stepper already
says the quantity, since it is the value of the control being operated. What
the reader does not have is what the change did to the money, which is why they
touched it. It announces the line's subtotal and not the order's, because this
component knows one and not the other, and announcing an order total it was
never given would be guessing. Removal takes a `returnFocusTo` for the reason
`Banner` does: the control they pressed is the control that has just been
unmounted.

**One defect, named because the test that caught it nearly did not.** The
announcement was written into a `useRef` from an effect, which changes nothing
on the page, so the live region held the empty string it first rendered with.
The test that found it asserts the text is in the document; a test that had
asserted on the component's own idea of what it would say would have passed.
The comment on the `useState` says so, because the next person to reach for a
ref there will have the same instinct.

**`order-summary`'s mapping is its one judgement.** `pending` is info, because
waiting is the ordinary outcome of placing an order. `shipped` and `delivered`
are both success, because a fifth colour for "even better" is a distinction
with no meaning. `cancelled` is danger, which deserves a second look; the word
is what is read, and a neutral cancelled order sitting in a list of live ones
is the state that misleads.

**Planting.** Six: the description list, the marked total, the quantity
announcement's silence on mount, the focus return, and both halves of the summary
structure.

**Done: the catalogue (7).** `product-card`, `product-gallery`, `review`,
`rating-summary`, `filter-panel`, `compare-table`, `recently-viewed`.

Four of the seven are mostly composition (`product-gallery` is `Gallery`,
`rating-summary`'s bars are a `MeterGroup`, `review`'s body is a `Spoiler` and
its rating a `Rating`, `recently-viewed` is a `ScrollArea`), and that is the
intent. `product-gallery` in particular is a rename with a narrower API,
because the temptation in a commerce slice is to build a second viewer with
"product" in its name and discover a year later that only one of the two had
the focus fix.

**`product-card` is exactly two tab stops**, which corrects what almost every
storefront does. A card wrapped in an anchor gives a screen reader one enormous
link whose name is every word on the card ("Harbour print A2 39.99 reduced from
49.99 four point five out of five in stock add to basket") and nests the Add
control inside it, which is invalid and behaves differently in every browser. It
also takes away the two things a reader wants as two decisions. The pointer
still gets a large target, because the name's hit area is stretched over the
card by the stylesheet: an affordance, and no second control.

**`compare-table` states its differences in text and computes them.** A reader
comparing four products across twelve attributes is looking for the rows where
they differ, and a table that marks those by tinting them has answered the
question for people who can see the tint and for nobody else. The mark is in
the row header's own words, and the tint is found through the mark with
`:has()` so the two cannot disagree. The difference is computed and never
declared, for the reason the discount badge refuses a percentage: a flag from
outside is a claim nobody can check, and it goes stale the moment a product
joins the comparison.

**`filter-panel` announces the set, not the checkbox.** Filtering is the one
interaction where the reader's action happens here and its whole effect happens
somewhere else. A checkbox going on says "checked" and nothing about the four
hundred products that just became eleven, so what is applied and how many
results it leaves are said together, in one region, because from the reader's
side they are one fact.

**`rating-summary` states the average and the count**, because either alone is a
different claim: 4.8 from three people and from three thousand are different
facts, and a bar at 60% could be six votes or six hundred. Nothing rated is the
absence of an average and never an average of nought: "0 out of 5" tells a
reader the product was rated badly.

**`recently-viewed` takes Resin**, which is read off Crystal's scroll contract:
Frost goes on panels and reading surfaces, Resin on compact or horizontal
scrollers. The test asserts it, because a rule like this goes the other way
when nobody writes down which sentence decided it.

**One gate guarded nothing and was found by planting it.** "Renders nothing at
all when there is nothing to show" asserted `textContent` was empty, and an
empty strip with a heading and an empty list has no text content either, so it
passed with the whole guard deleted. It asserts the structure now. This is
slice M's lesson from the other direction: the assertion was trivially true of
the failing case as well as of the passing one.

**Planting.** Nine: the card's link and its nested control, the action going with
availability, the difference in words, the difference being computed, zero
ratings not being a zero average, the Resin scrollbar, the silent filter panel,
and the empty strip, twice, once to find that the first version of its test was
worthless.

**Done: the address form (1).** `address-form`, last because it is the one with
a scope trap in it.

**The library ships the shape; the product ships the countries.** The catalogue
puts "countries supported and their field rules" on the product, and that line
is defended here. A design system that ships a table of countries has taken on
a data set that is wrong the week it is written and wrong differently every
year after: postcodes change, administrative divisions are renamed and
abolished, and which countries a shop delivers to is a commercial decision this
library has no view on. Worse, a wrong table is invisible: the form renders,
and one country's addresses are unusable.

So `commerce/address.ts` publishes `AddressDescriptor` and the renderer honours
it, and the reference descriptors live in the stories, where they are examples
and not a source of truth somebody might import. The division is real:
everything hard and general (field order being honoured, autofill tokens
reaching the controls, required-ness reaching them, validation landing on the
field it is about) lives in the library and is tested there.

**The country selector is first and is not one of the descriptor's fields.**
Everything below it is decided by it, so a country picked last is a form filled
in wrong and then rearranged under the reader's hands. The story shows three
countries that disagree, and Japan makes the case: addresses are written
largest-first with the postcode leading, so a single hard-coded form has that
country backwards for every reader in it.

**`autoComplete` is required on a descriptor field**, and it goes on selects as
well as inputs. Autofill that completes three of four fields and stops is worse
than none, because the reader has to find the one it missed. The order test
reads the tokens instead of the labels, which is the sturdier signal and the
more meaningful one: the tokens are a fixed vocabulary, so the test asserts what
each position is and not what a fixture happened to call it.

**Planting.** Four: the field order (against one fixed order for every country),
the tokens, the tokens on a select, and validating while the reader is still
typing, which is telling somebody off for not having finished.

---

**Slice N is complete: 24 of 24, and the library is at 247 of 285.**

Three things carry out of it.

1. **Two false header sentences, both caught by measuring.** `NumberInput`
   claimed React Aria gives a `spinbutton` with `aria-valuenow`; `Button`'s new
   `isSelected` claimed to render the appearance Crystal specifies for a pressed
   action. Neither was true, and the second has a cause to know: Crystal styles
   the element inside `@layer crystal.component`, and a CSS-module class in this
   package is unlayered, so the package's own rule wins without a specificity
   contest. That is what cascade layers are for, and it means any Crystal
   element-selector recipe loses here without a warning. Before writing
   "Crystal already does X", open it and measure.
2. **Crystal has two selection vocabularies and they are not interchangeable.** A
   selected button takes the primary reading pad and weight 800; a selected tab
   takes the weight alone. An action in an on state gets the fill; a choice
   among peers gets the weight. Where there is no label to weight at all (a
   thumbnail, a swatch) the pad is what is left, and it is never an outline,
   because an outline at an offset is how focus is drawn.
3. **R-22 is open and is Meridian's.** The catalogue calls the quantity stepper
   "a spin button" and React Aria removes that role on purpose, with its own
   comment: "we can't focus a spin button with VO". Crystal asks for a role the
   accessible primitive takes away.

**An export rule, from an asymmetry the review found.** The commerce slice's
vocabulary was public and the feedback slice's was not, which meant
`FeedbackStatus`, a public prop type of `Alert`, `Banner` and `StatusBadge`,
could not be named by the products that have to pass one. The rule is now
explicit: a type that appears in a component's public props is exported, and so
is the Crystal vocabulary beside it, so that a product building something
Crystal has no component for reaches for Crystal's own symbols instead of
picking four of its own.

**A sixth round, after the slice was already pushed.** Four of the slice's
headers made claims only a browser can be asked (sticky table heads, a `:has()`
rule naming a CSS-module class, a strip that scrolls itself and not the page, a
pill step carrying one material), and none of them had a gate. They were
measured. All four were true, which is when a gate matters: it keeps a true
claim from rotting unnoticed. `verify:appearance` goes from 41 to 45.

Three of the four planted red on the first try. The fourth would not, and that
was the finding:

1. **A gate that cannot be planted red against the component under test shows
   where the behaviour lives.** Removing `position: sticky` from
   `CompareTable` changed nothing, because `Table` already declares it, and so
   does Crystal's own `.cr-table`. The component was carrying a second copy of
   a rule at equal specificity, where the winner is decided by source order
   alone: a drift waiting for an import to be reordered. The duplicate is gone.
   What is left is the one thing only this component knows, which is that where
   the two sticky axes cross the column head is in front. The gate now plants
   red against `Table`'s declaration and against the stacking, which is where
   the two halves are.
2. **`PaymentMethod` had an uncontrolled mode that hosted nothing.** The provider
   slot was mounted on `value === newMethodValue`, reading a prop the group's
   own props make optional, so a consumer using `defaultValue` got a radio that
   was selectable, looked chosen, and mounted no payment element. It
   typechecked, it passed every existing test, and it failed with no error and
   nothing on screen. It now asks React Aria for the state both modes share. The
   new test fails against the old component and passes against the new one, and
   no other test moves, which is the shape of a bug that is invisible from the
   controlled path.
3. **Two live regions at a bound is the intended reading, and is now pinned.**
   Raising a quantity to the maximum updates the stepper's region and the cart
   line's in one tick: the constraint, then its consequence. Both are owed by
   different catalogue sentences, so merging them would drop one. What was
   missing was anything holding the order, which DOM position decides. A test
   now fails if the regions are reordered or if either falls silent.

### O: Screens (15), complete

`screen`, `page-header`, `view-stack`, `master-detail`, `split-view`,
`command-bar`, `status-bar`, `workspace`, `focus-mode`, `empty-screen`,
`error-screen`, `loading-screen`, `offline-screen`, `not-found-screen`,
`permission-screen`.

Whole views and their chrome, including the states a view can be in before it
has content: loading, empty, error, offline, not found and unauthorised.
Products otherwise improvise these states separately and inconsistently.

**Round one: the six state screens.** Every one is a composition, and the work
was deciding what they may not add.

- **They do not paint.** `Result` and `EmptyState` already carry the Haze fill
  and the content radius the catalogue asks of these screens. Painting them
  again would put a Haze pad inside a Haze pad, two materials deep for one piece
  of content, with the outer one visible only as a slightly wrong rectangle
  behind the inner one. This is the same case as the disc that was argued out of
  the pill step in slice N. A state screen owns the frame: the view's height,
  its safe areas, and a cap at the reading measure.
- **`ErrorScreen` is assertive and `OfflineScreen` is polite.** They are the
  same drawing and differ by that one word, which decides how the message
  arrives. `Result` sets no role of its own, because it is used for successes
  too, and a success must not be announced as an alert. `NotFoundScreen` is
  neither, because nothing failed: a missing thing is a fact about the address.
- **The catalogue's clauses became required props.** "Never only a code" is
  `title` required and `code` an extra, so the arrangement showing `0x80070005`
  and nothing else does not typecheck. "Offers a route onward" is `actions`
  required on `NotFoundScreen`, because that is the half products skip. "Which
  permission and why" is both.
- **`LoadingScreen` composes `Skeleton`, not `Loader`**, because "skeletons match
  the shape of what is coming", and it renders one skeleton holding every shape.
  `Skeleton` owns a live region, so the count of skeletons is the count of times
  the wait is announced: twelve shapes as twelve skeletons make a screen reader
  say the same sentence twelve times. "Announced once" is a claim about
  structure, and it is met by nesting every shape in one skeleton.

**Round two: the view and its chrome.**

- **`Screen` asks whether a `main` already exists rather than being told.**
  `AppShell` renders one, so a screen that always rendered its own would give a
  product two as soon as it used both. The shell publishes its scrolling region
  through `ShellScrollContext`, and the element it publishes is that `<main>`
  itself, the same node and no proxy. The screen therefore becomes a labelled
  `<section>` when there is one above it and the main when there is not. A prop
  would have hidden the failure.
- **The `h1` contest is settled in one direction.** Three components could claim
  it. `PageHeader` owns it. `Screen` draws no heading at all and only names its
  landmark. A state screen takes level 1 because it has replaced the view, and
  steps down when it has not. The test asserts "exactly one h1" across all three
  at once, which is the only arrangement where the rule can be wrong.
- **`useScrolledPast` was extracted rather than copied.** `PageHeader` condenses
  on the same signal `AppBar` uses for elevation, and inside a shell the window
  never scrolls. A second copy would have drifted into a header that condenses
  in a shell and not on a page, with nothing to say which was right. This
  applies the slice N finding before it became a defect.
- **`StatusBar` escalates by moving the message, not by changing a role.** The
  obvious implementation swaps `role="status"` for `role="alert"` on one element,
  and on several screen readers that does nothing: a live region's politeness is
  taken when it is inserted, not when its role attribute changes. The text
  updates and the urgency does not, and nobody who can see the bar notices the
  bug. The component renders two regions and puts the message in exactly one.
- **Stone uses core's recipe.** Core's `.cr-stone` puts the feather on an
  isolated `::before` beneath the content, which is what "text stays crisp"
  means. A mixin written in this library would have been that recipe a
  feather-width off.

**Round three: the multi-pane views.** Every one of the four composes something
that already existed, and composing them found defects that inventing them
would have shipped.

- **`SplitView` is `Resizable` plus one state.** The separator, its
  `aria-valuenow`, its keyboard travel and its 44px target are all already
  Crystal's. What is new is `collapsed`. It is a component rather than a prop
  because of what collapsing has to do to the divider: a separator between one
  region and nothing announces a value it cannot change, and a keyboard user who
  lands on it can press arrow keys to no effect. So collapsing removes it.
- **`CommandBar` is `Toolbar` plus `OverflowList`, and the pair had a defect
  neither half had.** `Toolbar` is a nowrap flex container, so the measuring row
  inside it was a flex item that never grew: it shrank to its own content and
  then read that as the space available. A 560px command bar rendered the words
  "7 more" and no commands at all. That looks like an overflow rule that is far
  too eager, and the cause was a row 102px wide inside a 558px bar. The gate
  found it, at a width, because a unit test has no width.
- **A fragment was one item, and the defect was in `OverflowList`.**
  `Children.toArray` counts `<>…</>` as a single child, so a caller who wrapped
  their row the way JSX invites handed the list one item. The row measured it,
  found it did not fit, and moved everything into the overflow. It typechecks,
  throws nothing, and leaves every command reachable, so the only symptom is a
  toolbar that looks empty. It was fixed where the behaviour lives:
  `OverflowList` now opens out a top-level fragment. The component that noticed
  was not changed, which applies the `CompareTable` lesson a second time.
- **`MasterDetail`'s one sentence is "only when the layout has collapsed"**, and
  the word that matters is *only*. In a wide layout, moving focus takes the
  reader out of the list they are still arrowing down. In a collapsed layout the
  detail has replaced the list, so leaving focus behind leaves it on nothing.
  The same action means two things depending on a media query. This environment
  implements no `matchMedia` at all, so a test written without noticing drives
  the wide path twice and passes. The unit test supplies the query explicitly,
  and `verify:behaviour` measures the layout itself at two viewports.
- **`Workspace`'s "focus order follows visual order" is a clause no type can
  enforce and no unit test can see**, because both orders are geometry: the tab
  order comes from the document and the visual order from the boxes. The gate
  walks one and compares it against the other. Planting `direction: rtl` turned
  the visual order round and left the document order and every unit test
  untouched. That is the drift the gate exists to catch.
- **The third `matchMedia` subscription was extracted rather than written.**
  `useMediaQuery` now has its own module, read by the preferred scheme, reduced
  transparency and this breakpoint. The breakpoint itself comes from the
  generated token export and is not retyped as `850`.

`verify:appearance` goes from 47 to 48 and `verify:behaviour` from 40 to 42.

**Round four: the two that touched core.**

- **Crystal had named the view stack and published nothing it could move with.**
  The catalogue has said since 2.0 that views "enter and leave along the reading
  direction", and the nearest recipe was `page-in`: a view arriving forward on
  the block axis, which is a different movement with a different meaning. A
  stack built on it says "new location" where it means "one step deeper". So
  `view-push-in` and `view-push-out` were authored in core, as the standing rule
  requires, and were not invented here. Core then checked them twice. Its build
  refused them until the catalogue claimed them (*every animation must belong to
  a documented component*), and its validator refused them again until each
  carried a spring fitted to its authored duration. Neither check exists in this
  repository.

  There are two recipes and not four, because a pop is a push mirrored and
  right-to-left is a push mirrored again. `reorient` already points an authored
  movement without copying it, and a second copy is a second fitted spring to
  keep in step with the first.

  **They were not reachable from here at first.** This library was pinned to
  `@crystal-ui/core@^2.0.0` and the recipes ship in 2.1.0, which is Meridian's to
  publish. `useMotion` throws on a recipe it does not have, because a movement
  that silently does nothing is worse than one that says so. So the stack asked
  `getRecipe` rather than assuming, and until the bump it behaved exactly as it
  does under `prefers-reduced-motion`: the state change in full, the decoration
  absent. Nothing about focus, the back control or the semantics waited for it.
  2.1.0 is now installed and the recipes are here, so the guard is gone and the
  stack plays them.

- **"Returns on pop" was implemented, found to be untrue, and replaced with what
  a stack can do.** The intended contract is that focus returns to the exact
  control the reader left. A stack cannot give that: it shows one view at a
  time, so the control was unmounted with its view, and a reference kept to it
  is a detached node that `focus()` accepts and silently ignores. The first
  implementation stored one. It would have looked right, passed a test that
  never unmounted anything, and put every reader at the top of the page in
  production. It now returns focus to the view, which is what it can restore,
  and the header says why.

- **Two components learned the same thing about effects.** `FocusMode` must know
  whether focus was in the chrome before the chrome unmounts. The obvious
  version reads `document.activeElement` in the effect that notices the change,
  by which point the chrome has gone and the answer is always `body`, so the
  check passes every time and never moves focus. There is no lifecycle point
  between "still focused" and "gone", and `useLayoutEffect` also runs after the
  mutation. Focus has to be followed as it moves. The naive version was written
  first here, and the test caught it.

- **`FocusMode`'s catalogue sentence contains a tension**, which the component
  resolves explicitly: "nothing becomes unreachable, only hidden". Chrome that
  is reachable has not been hidden, and chrome that is `visibility: hidden` is
  invisible and still in the tab order. The reading that makes both halves true
  is about the mode: nothing is lost because leaving is always available. So the
  chrome is not rendered, and the control that leaves belongs inside the task,
  where the thing it undoes cannot hide it.

**Two tests were found that could not fail**, both in the same file and both
found by strengthening the assertions rather than by running them. A page
header's description is hidden by a CSS-module rule, and jsdom applies no CSS,
so `toBeInTheDocument` on it passes when condensing is broken. A breadcrumbs
test that counted one navigation landmark was counting a landmark with nothing
in it, because the crumbs had been given `key` where the type asks for `id`; the
count was true either way. The first moved to `verify:appearance`, which goes
from 45 to 47. The second now asserts the crumbs as well as the landmark.

**A review pass after the slice was pushed found four more**, and two of them
are the same defect the slice had just written a component to prevent.

- **`ViewStack` played the arrival with the push's orientation on a pop.** There
  was one motion hook, whose `reorient` was computed from the reading direction
  alone, so a pop would have animated the returning view in from the edge it was
  leaving towards. It was inert at the time, because the recipe was unreachable
  until 2.1.0, and it would have been wrong from the day the recipe arrived.
  There are two hooks now, with fixed orientations. The header also claimed
  `view-push-out` was used, and it cannot be: the covered view is unmounted, so
  there is nothing left to play a departure on. The header says so now.
- **`Workspace` dropped focus to the document body**, which is what `FocusMode`
  had been built that morning to prevent. Turning focus mode on unmounts the
  other panes, and a reader whose focus was in one of them lands on the body
  with nothing said. The fix is the same continuous focus tracking, with the
  same "only when the pane focus was in has gone" condition.
- **`SplitView` spread `Resizable`'s vocabulary onto a plain `div`** when
  collapsed. React puts an unrecognised prop straight onto the DOM node, so it
  rendered `<div minsize="200" orientation="horizontal">`: invalid markup, a
  warning in development, silence in production. Nothing caught it because no
  test and no story passed one of those alongside `collapse`. The defect needs
  two props at once to appear.
- **"One tab stop" was asserted in `CommandBar`'s header and measured nowhere.**
  It is a claim about what a reader reaches with the Tab key, which is a browser
  question; `verify:behaviour` goes from 42 to 43. Its first plant was a false
  green: replacing `Toolbar` with a `div` removed `role="toolbar"` too, so the
  locator never resolved and the run failed under a different name. The faithful
  plant keeps the role and removes only the roving tab index.

**Slice O is complete: 15 of 15, and the library is at 262 of 285.**

### P: Blocks (20), complete

`dashboard-shell`, `metrics-row`, `analytics-panel`, `data-table-block`,
`crud-form-block`, `settings-block`, `auth-block`, `profile-block`,
`activity-feed`, `notification-centre`, `player-shell`, `playlist-block`,
`storefront-block`, `product-detail-block`, `checkout-block`, `cart-drawer`,
`pricing-block`, `onboarding-block`, `search-block`, `editor-block`.

The catalogue's own framing is the constraint: "a component is a primitive with
one job and a contract, while a block is **opinionated by design** — and a design
system that cannot tell the two apart ships opinions as if they were primitives."
So the question in every one of these is what the opinion is, and whether
anything else in it should have been left to the component underneath.

**Round one: the dashboard.**

- **`AppShell` promised a landmark it had no slot for.** Its header listed
  `banner`, `navigation`, `main` and `contentinfo`; the file rendered `div`,
  `nav` and `main`, and there was no footer prop at all. The sentence was true of
  the design and false of the file, and a reader looking for the slot concluded
  it was theirs to build. `dashboard-shell` is the first thing in the catalogue
  that needs all four, so the slot was added to the shell, where it belongs, and
  was not improvised in the block. The header now says which of the four the
  shell draws, which it delegates, and to what.
- **`DashboardShell`'s opinion is one line long**: the content is a grid that
  reflows by container width. Everything else is passed through, because a block
  that intercepted the shell's props would be a second API for the same regions,
  drifting from the first. It reads the container and not the viewport because a
  dashboard inside a split view is narrower than the window, and a media query
  would give it three columns in a 300px pane.
- **`MetricsRow` is a list, which is all the semantics clause asks.** The clause
  is "A labelled list of figures". A screen reader saying "list, four items"
  before the first one tells the reader how much is coming, which is most of
  what a summary band is for. Four sibling divs say nothing. Its loading state
  announces once for the band and not once per tile, as `LoadingScreen` does.
  Its empty state is a state and not an absent row, because a bare `map` over
  nothing renders a gap where a band should be.
- **`AnalyticsPanel` replaces the chart in three of its four states.** A chart
  that is loading, empty or failed is usually drawn as an empty plot with axes,
  which says "zero" to anyone reading it, and the data did not say zero. Each
  state replaces the plot and says in words which state it is, while the heading
  and controls stay, because they are how the reader changes the range that
  might fix it. `error` is an alert and `empty` is not, for the reason
  `ErrorScreen` is and `EmptyScreen` is not.
- **An axe assertion passed against the state that had no defect in it.**
  `MetricsRow`'s live region was a direct child of its `ul`, which may contain
  only `li`. The violation is a real one, because it makes a screen reader
  disagree with the browser about how many items the list has. The unit test
  asserted no violations against the at-rest render, which has no live region in
  it at all, so it passed while the loading render was malformed. The browser
  run on the loading story caught it. The assertion now runs over both states,
  and the region sits outside the list.

- **The table equivalent is left to `ChartSurface`, and this block adds none of
  its own.** `ChartSurface` takes `table` as a required prop, so a chart in this
  library cannot exist without the same data as text. A panel that accepted a
  bare `<svg>` as its chart would be a way around that requirement.

**Round two: commerce, activity and the queue.**

- **A block's container query was on its own container.** `CheckoutBlock` set
  `container-type` on the element its own `@container` rule was meant to size,
  and an element cannot query itself: the rule never matched and the summary
  never moved beside the form. The container is now the block, and the query
  applies to its inside.
- **Heading order is a block's problem, and a component has to let it solve
  it.** `StorefrontBlock` puts `ProductCard`s under an `h2`, and each card drew
  its own `h2`; the axe run on the story found the skip. `ProductCard` gained
  `headingLevel` rather than the block restyling a heading it did not own.
- **React Aria rebuilds a collection's rows when the order changes**, so a
  playlist row cannot see its own move from the inside: it is a new row. The
  block knows the old order and the new. It plays `drag-settle` on the row that
  was carried and `reorder` on the rows it pushed along, through a registry of
  players the rows join as they mount. Measured by keyboard in a browser.
- **`NotificationCentre`'s rows step down to Haze.** Frost inside Frost is two
  panes of the same glass. The surface context makes a notification Haze inside
  the centre and Frost on the page, without a prop.
- **The undo is a control that stays.** A toast leaves, and a keyboard or
  screen-reader user cannot rely on reaching an undo that has to be caught
  before it goes.
- **The blocks entry was guarded by a test that could not run.** `src/blocks.ts`
  is checked against the main barrel so a block cannot be exported from one and
  not the other. The first version read `import.meta.url`, which is not a file
  URL under jsdom, so the file failed to collect, and "1 failed" was missed in
  filtered output and committed. It reads from the working directory now, and
  was watched failing on a block left out.

**Round three: forms, overlays and media.**

- **Every React dialog opened off-centre**, with its top-left corner at the
  middle of the screen and half of it past a phone's edge. R-24 put the surface
  on Crystal's `.cr-dialog`, whose `position: fixed` centres a native `<dialog>`
  because the browser gives a modal one `inset: 0` and auto margins; React
  Aria's surface is not a `<dialog>`. The material gate passed throughout,
  because the material was right and only the position was wrong.
  `verify:appearance` now measures the open dialog at a desktop and a phone
  width.
- **Every slider's thumb sat 13px above its rail**: `Slider`, `RangeSlider`, the
  media transport and `ColorPicker`'s colour sliders. React Aria translates the
  thumb by −50% on both axes and leaves its top to the stylesheet; the track
  centred it with flex as well, so both applied. It was found because
  `PlayerShell`'s screenshot looked wrong, and the same screenshot showed
  `MediaControls` drawing "Seek …" and "Volume" above the pill while its
  stylesheet said the labels were hidden. `Slider` gained `hideLabel`; the thumb
  takes `inset-block-start: 50%`; `verify:appearance` measures each thumb
  against its track.
- **A property that does not exist passed every unit test.** `PricingBlock`
  used `--cr-primary-ink`; `verify:theme` found it resolving to nothing on the
  themed scope and on the overlay container. The label keeps the text ink,
  because Crystal's emphasis is weight and not colour, and the marks take
  `--cr-primary`.
- **`AuthBlock`'s failures cannot name a factor, by construction.** `AuthBlock`
  has no way to attach a sign-in failure to a field and takes no field errors
  for a reset, so a product cannot say "no account uses that address" by
  accident. Registration may still say what is wrong with the shape of a field.
- **A confirmation cannot say nothing.** `ProfileBlock`'s destructive actions
  are destructive because they are given `removes`, the sentence the dialog
  shows. Focus lands on Cancel, as in `Popconfirm`.
- **Two announcements the platform already makes were not duplicated.** React
  Aria's combobox announces its option count through an announcer its own
  `aria-hidden` sweep leaves reachable; a region of `SearchBlock`'s would have
  been hidden by that sweep while the list was open. `EditorBlock` says a format
  change only when it was made from the text, with Ctrl+B, since on the toolbar
  `aria-pressed` has already said it.
- **`aria-keyshortcuts` never reached the button.** React Aria passes only
  labelling and `data-` attributes through, so the attribute was dropped without
  a warning. The shortcut is printed beside Save instead and describes it, and a
  sighted keyboard user can also read it there.
- **An accessible name is built from trimmed pieces.** "Team, Recommended" was
  computed as "Team,Recommended" because the space was inside the visually
  hidden comma. It sits between the two now.
- **`Tour` could not tell finishing from leaving**, so an onboarding sequence
  could not either. `onClose` now receives `'finished'` or `'dismissed'`;
  callers that ignore it are unaffected.
- **The manifest credited eighteen components with a collection's motion**: a
  dialog's hint, a banner, a tour, the error screens. It followed
  `motion/ListPresence` for anything importing from it, including
  `usePresenceMotion`, which plays whatever its caller names. `virtualizer` read
  as not started because the catalogue lists it twice and the export was mapped
  to one id. Its two promises, set counts across recycling and a focused row
  kept, are now measured in a browser rather than asserted.

**Slice P is complete: 20 of 20, and the library is at 283 of 285.** The other
two are `not-applicable` in the catalogue itself.

### P: Blocks (20)

`dashboard-shell`, `metrics-row`, `analytics-panel`, `data-table-block`, `crud-form-block`, `settings-block`, `auth-block`, `profile-block`, `activity-feed`, `notification-centre`, `player-shell`, `playlist-block`, `storefront-block`, `product-detail-block`, `checkout-block`, `cart-drawer`, `pricing-block`, `onboarding-block`, `search-block`, `editor-block`.

Blocks come last, because every block is an arrangement of components that must
already exist. They are a separate tier with a different promise: a component's
API is stable, and a block is a starting point products are expected to fork.
See §4.2.

### Q: Documentation website

The site is built alongside the slices rather than after them. A component is
not done until its page exists, which keeps the documentation from becoming a
separate project nobody finishes.

- [ ] `apps/docs` as a pnpm workspace package; Next.js App Router; library by `workspace:*`
- [ ] Vercel project rooted at `apps/docs`, preview deployment per pull request
- [ ] The demo registry: source read from disk at build time, so the code shown is the code that runs
- [ ] The isolated demo frame, with palette, mode, density, direction and reduced-effects controls
- [ ] Generated props tables from the TypeScript types
- [ ] The component page template, fed from the catalogue
- [ ] Guides: getting started per framework, theming, tokens, materials, motion, accessibility, forms
- [ ] Migration notes from Mantine, MUI, Ant Design and PrimeReact
- [ ] Local search; `llms.txt` and the component manifest served from the site

<!-- slice-r:start (generated by scripts/sync-slice-r.mjs; edit tasks.json in Crystal) -->
### R: Media, text and recipe parity

Added 2 October 2026 from Meridian's brief of that day. The proposal is
[`proposals/2026-10-02-media-text-and-recipe-parity.md`](proposals/2026-10-02-media-text-and-recipe-parity.md);
Crystal's half, with the findings, the core recipes and the decisions D-30 to D-35, is
`crystal-design-system/proposals/2026-10-02-media-text-and-recipe-parity.md`. The tasks
below are generated by `pnpm run sync:slice-r` from that proposal's `tasks.json` and
`rulings.json`, where each also carries its acceptance checks; the IDs are shared with
Crystal's task board, where rulings are recorded.

The slice changes no component count. It gives the media players, the rich text
surface and `Prose` the anatomy the catalogue now specifies, makes every motion
recipe visible, credits motion a child plays, and measures the library against
the catalogue so the remaining material work can be counted.

Rulings in force: D-30 (a), 2026-10-02; D-31 (a), 2026-10-02; D-32 (a), 2026-10-02; D-33 (a), 2026-10-02; D-34 (a), 2026-10-02; D-35 (a), 2026-10-02; D-37 (a), 2026-10-02; D-39 (a), 2026-10-03. The record is `crystal-design-system/proposals/2026-10-02-rulings.md`.

**Media**

- [x] **R-M1** (P1) Playback rate and picture in picture on useMediaElement. Both read from the element and set on it.
- [x] **R-M2** (P1) useMediaTracks: caption, audio and video tracks. Tracks read from the element, one audio track at a time, a missing list offers nothing, Crystal draws captions.
- [x] **R-M3** (P1) MediaSettings: speed, subtitles, audio, quality. Radio items, selection by weight, a submenu per choice when there are several, every change announced.
- [x] **R-M4** (P1) VideoPlayer: aspect ratio, fit, settings, captions on Stone, picture in picture, full screen. The catalogue's video-player anatomy.
- [x] **R-M5** (P1) AudioPlayer: the Haze card, subtitle, speed. The catalogue's audio-player anatomy.
- [x] **R-M6** (P1) MediaControls: transport padding, readouts on Haze, sliders inset by half a thumb. The .cr-resin.transport recipe.
- [x] **R-M7** (P2) PlayerShell uses the player's own full screen. One full-screen control, announced however full screen is left.
- [x] **R-M8** (P2) Real media fixtures for stories and gates. Every media story plays real media with no network.
- [ ] **R-M9** (P1) Wear the published media recipes and delete the copies. VideoPlayer, AudioPlayer and MediaControls wear .cr-media, .cr-media-bar, .cr-resin.transport and .cr-media-caption. Waits on C-R1.
- [ ] **R-M10** (P1) Prove audio-track switching in Safari. The audio group appears and switches the track in an engine with audioTracks.
- [x] **R-M11** (P3) Draw the first cue before playback starts. A cue active at 0:00 shows without a time update.
- [x] **R-M12** (P2) Caption appearance settings (size and backing). A reader can enlarge captions and make the backing opaque, as broadcast caption rules require.

**Text**

- [x] **R-T1** (P1) RichTextSurface wears .cr-field-shell, carries the vocabulary, places the toolbar by pointer. The rich-text-surface anatomy, engine-agnostic.
- [x] **R-T2** (P1) The format vocabulary, exported from the main entry. A product binding any engine reads names, shortcuts and glyphs from one list.
- [x] **R-T3** (P1) RichTextEditor at @crystal-ui/react/editor. Headings, lists, checklists, every mark, indent and outdent, undo and redo, a selection toolbar, Alt+F10, Markdown input rules, form value.
- [x] **R-T4** (P1) Text decorations and the edit elements. Text renders u, s, ins, del, mark, kbd, code, sub, sup and a meaning-free decoration.
- [ ] **R-T5** (P1) Prove the touch toolbar on real devices. The toolbar stays above the keyboard on iOS Safari and Android Chrome.
- [x] **R-T6** (P2) Mentions popover wears .cr-frost. The suggestion popover's hand-written Frost goes.
- [x] **R-T7** (P2) EditorBlock offers the bound editor in a story. The editor block shown with RichTextEditor, save state and announcements together. Waits on D-30.
- [ ] **R-T8** (P3) Screen-reader pass on the editor. VoiceOver and NVDA read the toolbar state, the block type, the checklist and the announcements as designed.
- [ ] **R-T9** (P1) Wear the published prose and editor recipes and delete the copies. Prose and RichTextSurface wear .cr-prose, .cr-editor and .cr-editor-toolbar; the selection toolbar wears .cr-frost.bar. Waits on C-R1.

**Motion**

- [x] **R-A0** (P1) Motion catalogue story. Every recipe and preset playable on demand, on its own material.
- [x] **R-A3** (P2) Cascader plays the field recipes. field-focus, field-invalid and field-valid on the cascader's shell.
- [x] **R-A4** (P2) Product gallery and playlist block play their assigned motion. media-in on the product gallery; list-in and list-out on the playlist block.
- [x] **R-A5** (P3) The view stack plays view-push-out. The view a push covers stays beneath the arrival and plays view-push-out before it unmounts; the stack had never made that movement, so crediting the recipe would have been false.
- [ ] **R-A8** (P2) The travelling selection pill on strips (D-37). Tabs, the segmented control, the dock, bottom navigation and toggle button groups render one selection pill from styles/_strip.scss, measured against the selected segment and moved by the new recipe when a person changes the selection; instant under reduced motion; label weight unchanged. Waits on C-M3, C-R1. Blocked. By the ruling on D-37.

**Materials**

- [ ] **R-A1** (P1) Sort the hand-written material (re-evaluation rec. 6). Each of the 29 directories with hand-written backdrop-filter and the 49 using material mixins either wears a surface or is filed upstream as a composition the vocabulary lacks.
- [ ] **R-A2** (P2) Confirm the 105 entries whose surface is not worn in their own markup. Each is either worn through a child (recorded) or fixed.

**Audit**

- [x] **R-A9** (P2) The Haze reading fill in the popover, the pop-confirm and the menu. Popover and Popconfirm content, and Menu rows, sit on the Haze reading fill their catalogue entries specify inside the Frost panel, measured against the .cr-haze recipe; core then assigns the haze surface and removes the three from UNMEASURED in build-catalogue.cjs.
- [ ] **R-A10** (P2) The Resin thumb on the colour area, slider and wheel. The colour controls draw the Resin thumb their catalogue entries specify (today the thumb is the picked colour), measured against the .cr-resin recipe; core then assigns the resin surface and removes the three from UNMEASURED.

**Docs**

- [ ] **R-Q1** (P2) Documentation site from the surfaces (re-evaluation rec. 7, Slice Q). One page per surface with its recipe values and every component made of it. Waits on C-R1.
<!-- slice-r:end -->

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
  component `parity.json` reports as `implemented`. A component claiming to exist
  with no page is not done.
- Every demo compiles. Since the source shown is read from the file that renders,
  a broken example breaks the build rather than misleading a reader.

---

## 7. Standing constraints

From `libraries/CONTRACT.md`. Each one is a requirement of the contract.

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
