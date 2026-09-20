# Open issues — Crystal React

Things noticed while building this library that are not fixed. Each says what is
wrong, why it matters, where it is, and what closing it would take.

**Two entries.** R-17's first item is done — all 27 story
files declare `meta.component` — and its third is answered as far as it can be,
with the nine action args declared by hand because `react-docgen` cannot resolve
the React Aria interfaces this library's callbacks are inherited from.

What is left is the second item, half done: 79 `render:` closures take no
arguments, so moving a control changes nothing on screen, and only `Tabs` was
converted. Finishing it is mechanical but not small, and the entry names the
thing worth deciding first — whether to keep hand-declaring inherited props or
wait for a docgen that can see them.

R-18 is the other half of the same surface: slice I's twelve components have no
stories at all, which quietly takes them out of the three gates that reach a
component by navigating to one. The two are worth closing together.

Closed entries are in [`closed-issues.md`](closed-issues.md), with the reasoning
intact.

Crystal's own tracker — material decisions, the visual gate, the blocked
deployment — is `crystal-design-system/proposals/open-issues.md`.

---

## R-17 · Storybook has almost no Controls, no Actions and no Interactions

**Reported by Meridian, 19 September 2026. Largely closed 19 September 2026; one
part deliberately left open and named below.**
**Severity: high — this is the review surface, and three of its four panels are
empty.**

Meridian opened the Tab Strip story and Storybook said, in its own words:

> This story has no controls. Storybook couldn't find or generate any controls
> for this story. Define `args` or `argTypes`, or configure docgen to let
> Storybook generate controls automatically.

That is not one story. Counted across the library:

| | count |
|---|---|
| Story files | 27 |
| Exported stories | 92 |
| Files declaring a real `meta.component` | **19 of 27** |
| Files with any `args` | **12 of 27** |
| Files with `argTypes` | **0** |
| Stories with a `play` function | **0** |
| Files importing `fn()` from `storybook/test` | **0** |
| `render:` closures that ignore args entirely | **79** |

So the **Controls** panel is empty or near-empty for most of the library, the
**Actions** panel is empty for all of it, and the **Interactions** panel has
nothing to run anywhere.

### Why there are no controls

Three causes, and they stack.

**1. Eight story files declare no `meta.component`.** Without it, docgen has
nothing to read and Storybook cannot generate a single control — which is exactly
the message above. Every one of the eight is a file written in the last two days:
`Links`, `Palette`, `Panels`, `Overlays`, `Navigation`, `Hierarchies`, `Form`,
`Parity`. The Tab Strip in Meridian's screenshot lives in `Navigation`.

An earlier count of "27 files with `component:`" was wrong and worth naming: it
matched `docs: { description: { component: … } }`, which is a documentation
string and not a component reference. The real count is 19.

**2. Almost every story is a `render:` closure.** 79 of them. A closure that
takes no arguments cannot be driven by args, so even where `meta.component` is
set and docgen produces argTypes, moving a control changes nothing on screen.
The stories were written to *demonstrate* rather than to be *operated*, which is
half a review surface.

**3. No `argTypes` anywhere.** Docgen can infer a type from a prop's TypeScript
signature but not the intent: which props deserve a control, what a sensible
range is, which belong in a "Material" group rather than beside `className`.
Nothing in the library says.

### Why there are no actions

No story imports `fn()` from `storybook/test`, and no `meta` sets
`argTypes: { onPress: { action: 'onPress' } }`. Every callback Crystal React
exposes — `onPress`, `onAction`, `onSelectionChange`, `onOpenChange`,
`onExpandedChange`, `onNavigate`, `onSubmit` — fires into nothing a reviewer can
see. For a library whose whole job is behaviour, the panel that shows behaviour
happening is blank.

### Why there are no interactions

Zero `play` functions, and `@storybook/addon-vitest` is not installed — in
Storybook 10 that addon is what supplies the Interactions panel and its
step-through debugger. The panel Meridian saw is present and will always be
empty.

This one compounds a gap already recorded. R-10 and R-11 exist because jsdom
cannot answer questions about geometry, layout or resolved colour; a `play`
function runs the same interaction *in a real browser*, and would let a reviewer
watch focus containment, arrow-key movement through a tree, or a drawer's
modality behave — the very things whose unit tests were found to be checking
nothing.

### The environment controls are the wrong shape

The toolbar added yesterday carries every axis Crystal's own "Make it yours"
panel has, but as **dropdown lists of discrete values**. Crystal's panel is
continuous. Meridian's screenshot is the specification:

| Crystal's control | Shape | Range | Currently |
|---|---|---|---|
| Product palette | Swatch row, six circles, active ringed | six palettes | dropdown |
| Appearance | Segmented: Light / Dark / Auto | three | dropdown, and **no Auto** |
| Color atmosphere | Slider with live `%` | 15–90 | dropdown of four |
| Frost base tint | Slider with live `%` | 35–85 | dropdown of three |
| Elevation | Slider with live `%` | 60–150 | dropdown of four |
| Corner radius | Slider with live `px` | 14–28 | dropdown of three |
| Content density | Segmented: Comfortable / Compact | two | dropdown |
| Typeface | Select with a preview toggle | `manrope`, system | **absent** |
| Animation speed | Slider with live `×` | 0.25–2 | dropdown of four |
| Reduce motion | Checkbox | boolean | dropdown of `true`/`false` |
| Reduce transparency | Checkbox | boolean | **conflated with `effects`** |

Two of those are more than cosmetic. **Typeface is missing entirely** — the
resolver takes `s.font` and `preferences.js` clamps it, and neither the provider
nor the toolbar exposes it. And **reduce transparency is not the same axis as
`effects`**: `effects: opaque` is a Crystal scheme value, while reduced
transparency is a user preference the provider reads from
`prefers-reduced-transparency`. The toolbar currently offers the first and calls
it the second, so a reviewer cannot simulate the media query the library actually
branches on.

**A constraint worth recording before anyone tries:** Storybook's `globalTypes`
toolbar supports only discrete `items`. There is no slider, no swatch row and no
checkbox in it. Matching Crystal's panel means either a **custom Storybook addon
with its own panel**, or surfacing the environment as **per-story args with
`control: { type: 'range' }`**, which renders real sliders in the Controls panel.

The second is probably right, and not only because it is cheaper: Meridian asked
on 19 September for the environment options to be "available per-component to
test with and against", and args are per-component by construction. The toolbar
would stay for taking any story through an axis quickly; args would give the
sliders, the live values and a fixed environment a gate can measure.

### What closing it needs

1. `meta.component` on the eight files missing it.
2. `args` and `argTypes` per component — every prop that is a real choice gets a
   control, grouped, with ranges where Crystal states one. The `render:`
   closures become arg-driven so moving a control moves the component.
3. `fn()` spies on every callback, so the Actions panel shows what fired and
   with what.
4. `@storybook/addon-vitest`, and `play` functions on the stories whose subject
   is behaviour — focus containment in a modal drawer, arrow-key movement in a
   tree, type-ahead in the command palette, the scroll spy.
5. The environment as args with the shapes above, plus the two genuinely missing
   axes: typeface, and reduced transparency as its own preference.
6. A gate. This is the third time a review surface has been broken in a way no
   check could see, so: every story file declares a `meta.component`; every
   component with callbacks has action args; no story is render-only unless it
   says why. A count in CI that only ever goes up.

**Confirmed by Meridian, 19 September 2026**, with a second screenshot: the Tab
Strip story with the **Controls** panel open and reading "This story has no
controls". Their words — "this is where and what we were talking about in terms
of how Crystal's controls should be translated to Storybook". So the destination
is settled and it is not the toolbar: Crystal's "Make it yours" axes belong in
the **Controls panel, as per-story args**, which is the second of the two options
weighed above. The toolbar stays for sweeping one axis across many stories.


### Closed

| | before | after |
|---|---|---|
| Files declaring a real `meta.component` | 19 of 27 | **26 of 27** |
| Files with `argTypes` | 0 | **10** |
| Stories with a `play` function | 0 | **4** |
| Callbacks wired to the Actions panel | 0 | **12** |
| Stories run as tests in a browser | 0 | **92** |
| Total tests | 466 across 82 files | **558 across 109** |

**The environment is in the Controls panel, declared once.** `.storybook/environment.ts`
carries every axis of Crystal's "Make it yours" panel with the right shape —
sliders for atmosphere, Frost tint, elevation, radius and animation speed, an
inline radio for the palettes, checkboxes for the two reduction preferences —
and `preview.ts` declares it for every story, so it is per-component without
twenty-seven authors having remembered. Every range and choice is read from
Crystal's own `RANGES` and `CHOICES`; typing `min: 15` here would be the
CONTRACT §1 defect this library exists to avoid.

The decorator honours an environment arg only once it differs from the story's
`initialArgs`. Every story now carries the whole environment, so `args.atmosphere`
is always set; reading it directly would make args win permanently and the
toolbar would have stopped working the moment this shipped.

**The two genuinely missing axes are added.** Typeface did not exist anywhere in
this library: Crystal has supported `font: manrope | system` since the headless
core was written, and the provider never forwarded it, so a product asking for
the system face got Manrope with no error. Reduce transparency is now its own
control, separate from the product's `effects`, and its description says exactly
what it can and cannot do — it resolves the provider the way the real preference
does, and it cannot make a media query true, so the stylesheets' own
`@media (prefers-reduced-transparency: reduce)` branch stays a browser gate's
job. Appearance also gained `system`, which `CrystalModePreference` has allowed
all along.

**The Interactions panel exists and runs in CI.** `@storybook/addon-vitest`, and
`vitest.config.ts` split into two projects: `unit` in jsdom, `storybook` in a
real Chromium. All four `play` functions this entry asked for are written — the
tab strip's arrow keys, the tree's arrow keys and collapse, the palette's
type-ahead and focus containment, and the drawer's modality in both directions.

Running the stories as tests also executed `addon-a11y`'s `test: 'error'`, which
had been configured for some time and never run. It failed five things on its
first pass, every one of them real, and they are fixed in the same commit:
`ColorPicker` rendered nothing at all (an RGB colour handed to a saturation
channel); `AppShell` shipped a `<main>` no keyboard could scroll; the scroll-spy
story hand-rolled the same defect; `ColorPicker`'s hex field had no accessible
name; and the typography story jumped from a level-two heading to a level-four.

**The gate.** `scripts/verify-stories.mjs` — a ratchet over `meta.component`,
`args`, `argTypes`, `play` functions and action args, plus the one line in
`preview.ts` that puts the environment on every story. Proven to bite before
being trusted: stripping `meta.component` from `Button`, renaming the tab
strip's `play`, and removing `args: environmentArgs` each fail it, and
restoring each returns it to green. `Parity` is exempted by name, not by
pattern, because it renders one specimen per *material* and has no component to
point docgen at.

Two gates needed repair once the stories became real, and both had been brittle
rather than wrong: `verify-behaviour` found the scroll column with
`[style*="overflow"]`, which only worked while the story set it inline, and now
finds it by asking the page what actually scrolls; `verify-theme` clicked open a
palette the story's own `play` function had already opened, and now opens one
only if none is there.

### Left open, deliberately

**Item 2 is half done.** 79 `render:` closures ignore args, and only `Tabs` was
converted to be arg-driven. So most components' Controls panels show the
environment and their action args but not their own props as live controls.

Finishing it is mechanical but not small, and it interacts with something worth
deciding first: this Storybook uses `react-docgen` rather than
`react-docgen-typescript`, because the latter builds a TypeScript program
through a plugin that does not support TypeScript 7 and fails the build
outright. react-docgen reads a component's own interface and does not resolve
what it extends — and nearly every callback in this library is inherited from a
React Aria interface. That is why the nine action args are declared by hand and
checked against the compiler rather than generated. Converting all 79 renders
while docgen still cannot see inherited props would mean hand-writing an
`argTypes` entry for most props in the library, which is a large amount of
retyped specification and exactly the kind of thing that goes stale.

The ratchet holds the floor in the meantime, so this cannot quietly get worse.


---

### R-16, where it stands — 19 September 2026

The design system's half is written: the package boundary is drawn, the release
gates exist, and `.github/workflows/publish.yml` publishes on a tag with Trusted
Publishing and provenance. The proposal is
`crystal-design-system/proposals/2026-09-19-crystal-core-as-a-library.md`.

**This library's half has deliberately not started, and the dependency line is
unchanged.** `"@crystal-ui/core": "^2.0.0"` cannot be committed until something has
been published to the `@crystal-ui` scope: a committed range pointing at a version
nobody can install is worse than an honest `file:` path, because it fails for
every contributor rather than for one. `optimizeDeps.force` stays with it — it is
R-14's workaround, and `pnpm link` is its cure, but only once there is a
published package to link *away from*.

What changes here on the day `@crystal-ui/core@2.0.0` exists, in one commit:

```
- "@crystal-ui/core": "file:../crystal-design-system/design-system/core"
+ "@crystal-ui/core": "^2.0.0"
```

plus removing the `viteFinal` hook in `.storybook/main.ts` and its comment,
documenting `pnpm link ../crystal-design-system/design-system` for local work
against an unreleased Crystal, and dropping the sibling checkout from
`.github/workflows/verify.yml` — which also removes the push-ordering trap
recorded there, where pushing this repository before the design system fails as
`[sass] Undefined variable`.

---

## R-18 · Slice I's twelve components have no stories, so three gates cannot see them

**Found 20 September 2026.**

Slice I added `Portal`, `NavRail`, `Dock`, `BottomNavigation`, `Affix`, `Burger`,
`Pagination`, `Stepper`, `HoverCard`, `Menubar`, `NavigationMenu` and
`FloatingWindow`. All twelve have unit tests — 71 between them, all passing — and
none has a story. That is not unusual on its own; 27 story files cover about a
hundred components, so stories were never one-per-component. What makes it worth
recording is which gates it silently removes.

Three of the six gates reach a component **by navigating to a story URL**, so a
component with no story is not measured rather than measured and passing:

- `scripts/verify-targets.mjs` — its `CASES` is a hand-written list of story IDs
  and selectors, deliberately so (a blanket sweep would fail on links in running
  prose). Nothing in it refers to the twelve. `NavRail`, `Dock`,
  `BottomNavigation`, `Pagination`, `Stepper`, `Burger` and `Menubar` all present
  finger targets that the catalogue holds to the 44px floor, and none of them has
  ever been measured. This is the exact shape of the defect that gate was written
  for: the tab strip shipped at 36px with green unit tests, because **jsdom
  reports every box as zero**.
- The rendered half of `scripts/verify-theme.mjs`, and the visual frames.

One gate does cover them, and the distinction matters: `verify-theme.mjs` finds
its token names by walking `src/**/*.scss` on disk, so every `var(--cr-…)` the
twelve read **is** checked against the published theme. Their token usage is
gated; their geometry and their appearance are not.

**Closing it** is a story per component that carries a target, added to
`CASES` with the selector and the catalogue line that sets its floor. Worth doing
before the count grows again — and worth doing as part of R-17 rather than
beside it, since a new story written with `render:` args costs nothing extra and
a new story written without them adds to the 79.
