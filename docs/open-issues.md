# Open issues — Crystal React

Things noticed while building this library that are not fixed. Each says what is
wrong, why it matters, where it is, and what closing it would take.

**Two entries.** R-17 has one part left, and it is not in this repository's hands.
R-24 is the rest of the adoption of Crystal 2.2.0: the release is installed, its
new motion is played, and what remains is wearing its surface classes and deleting
the local copies — the migration in
`docs/proposals/2026-09-28-adopting-crystal-2.2-recipes.md`, phase B.

**R-21 and R-22 closed on 28 September 2026**, both by rulings Meridian made on
Crystal's side. Charts now arrive with `mark-in`, a recipe authored in core —
critically damped so that no bar ever shows a value it does not have — and the
catalogue now describes the reachable number field this library always shipped,
rather than a spin button VoiceOver cannot focus. D-19's continuous indicators
closed with them: the loader, the progress indicators and the skeleton play
Crystal's `activity-turn`, `activity-travel` and `skeleton-sweep` instead of
loops of this library's own.

**R-20 and R-23 closed on 24 September 2026**, when `@crystal-ui/core@2.1.0` was
published and this library's dependency moved to `^2.1.0`. Both were designed to
announce their own obsolescence and both did: the chart shim carried a test
whose only job was to fail the day the installed core began publishing the
series scale, and it was the single failure in a suite of 1692 on the bump. All
thirteen transcribed values matched their published tokens exactly, which is the
only reassuring way for a transcription to end. `chartTokens.ts` is gone;
`chartGeometry.ts` reads the same numbers from the generated export, where they
cannot go stale. The view stack's `getRecipe` guard is gone with it, and the
check it was waiting for — that a pop is a push mirrored, and right-to-left a
push mirrored again — is in `verify:behaviour`, read from the running
animation's first keyframe across all four combinations.

**R-17** has one part left and it is not in this repository's hands. All three
of its items are answered: every story file declares `meta.component`; the
`render:` closures were counted properly and converted where converting is
right, with a gate holding the line; and the inherited React Aria props are
described once with the compiler enforcing which component has which. What
remains is that `react-docgen` cannot resolve a component's *own* inherited
props, and both routes to an extractor that can are closed until one runs on
TypeScript 7.

Closed entries are in [`closed-issues.md`](closed-issues.md), with the reasoning
intact.

Crystal's own tracker is `crystal-design-system/proposals/open-issues.md`. As of
28 September 2026 it holds D-4, which needs hardware, D-17, a flake that needs
its next occurrence with the artifact kept, and D-21, a hover treatment that is
Meridian's to rule on.

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

### Item 2, closed 21 September 2026 — and its premise was wrong

This entry said 79 `render:` closures ignore their args and asked for all of
them to be converted, calling the job "mechanical but not small". Counted
properly the premise does not hold, and the correction is worth more than the
number.

Of the 69 no-arg closures left, **only 15 render exactly one instance of their
own `meta.component`.** The other 54 are **compositions**: a tab strip beside a
segmented control, the same destinations in three shells, seven gaps of the
spacing scale at once, a card inside a Resin frame to show the recess. A
composition is not a story you drive by args — the subject is the *relationship*,
and giving one of several components live controls would make it disagree with
its neighbours while a reviewer watched. Converting all 79 would have been 54
changes for the worse.

Ten of the fifteen are converted: `Card/InsideResin`, `Container/Shell`,
`Container/ReadingColumn`, `Divider/Plain`, `Toolbar/Vertical`,
`Watermark/Marked`, `Tabs/WithADisabledTab`, `TreeView/Files`,
`TreeView/Keyboard` and `Watermark`'s text. The remaining five are compositions
that happen to contain one instance, and each now carries a written reason.

**The gate is the part that lasts.** `verify-stories.mjs` fails a story that
renders exactly one of its own `meta.component`, hard-codes its props and takes
no args — a Controls panel that moves nothing, which is the actual complaint
this entry opened with. It is not a floor: a floor lets this get worse one story
at a time. Exceptions go in `RENDER_ONLY_BY_DESIGN` with a sentence saying why
the story is a composition rather than a subject, and an entry naming a story
that no longer exists fails too, so an exemption cannot outlive its story and
silence a real finding later. Both halves were proven by mutation.

### What is left of R-17, which is not this

The docgen constraint below is unchanged and is the reason the *other* half of a
Controls panel — a component's own props, described — is still hand-written.
`.storybook/react-aria.ts` closed the inherited half on 21 September. Nothing is
outstanding on this entry that is not waiting on an extractor that runs on
TypeScript 7.

### The docgen constraint, 21 September 2026 — both routes measured and closed

This entry previously said the Storybook uses `react-docgen` rather than
`react-docgen-typescript` "because the latter builds a TypeScript program
through a plugin that does not support TypeScript 7". That was the right
conclusion for the wrong reason, and both halves have now been tried rather
than inferred.

**What the current extractor actually returns.** Run the way
`@storybook/react-vite` runs it — `parse()` with `makeFsImporter()`, which the
preset does pass — `react-docgen` reports five props for `Button`: `children,
variant, shape, className, style`. Not `onPress`, not `isDisabled`. It reads a
component's own interface and does not resolve `extends Omit<AriaButtonProps,
…>`, and an importer does not change that: the importer follows *module*
imports, and this is a *type* relationship into a `.d.ts`.

**Route 1 — `reactDocgen: 'react-docgen-typescript'`.** Not the plugin.
`react-docgen-typescript@2.4.0` evaluates `ts.JsxEmit.React` at module scope,
and TypeScript 7's main entry exports exactly two things, `version` and
`versionMajorMinor` — the compiler API moved behind `typescript/unstable/*`.
It throws `TypeError: Cannot read properties of undefined (reading 'React')` on
`require`, before any option is read.

**Route 2 — pin TypeScript 5.x for those packages only.** `typescript` is a
*peer* of both `react-docgen-typescript` and the Vite plugin, auto-installed
from the root. pnpm's `overrides` and `packageExtensions` both act on dependency
resolution, not peer resolution: after each attempt `node_modules/.pnpm` still
held one TypeScript, `7.0.2`, and both packages still resolved to it.

**Writing our own extractor** is closed by route 1's cause: there is no stable
compiler API in TypeScript 7 to write it against.

### What was done instead

`.storybook/react-aria.ts` — the inherited props described **once**, with the
compiler supplying the link docgen cannot. The whole design rests on one
observation: **`tsc` does resolve `extends` even though docgen does not**, so
`Extract<keyof P, AriaProp>` is the component's real inherited surface.

```ts
argTypes: {
  ...ariaArgTypes<ButtonProps>({ onPress: true, isDisabled: true, autoFocus: false,
                                 onFocusChange: false, onHoverChange: false }),
}
```

The parameter type is `Record<Extract<keyof P, AriaProp>, boolean>`, which does
both halves of docgen's job:

- **Refuses a prop the component does not have.** `onSelectionChange` on a
  `Button` fails to compile — and the error *enumerates* the real surface, so
  filling one of these in is a matter of reading what `tsc` printed.
- **Refuses to let one be forgotten.** Every prop must be mentioned; `false` is
  the deliberate omission. A control cannot quietly go absent, which is the
  actual complaint in this entry.

Both were verified by mutation rather than asserted. `IconButton.label` was
found this way — the compiler demanded it, and for an icon-only button that
prop *is* the accessible name.

The nine hand-declared action args are gone into it. That removed a repeated
`{ action: 'onPress', table: { category: 'Events' } }` from nine files and
raised the real count from 15 to 17, because the migration also switched on
callbacks the stories had never declared.

**One gate had to be repaired to see that**, and it is worth recording because
it is the pattern this repository keeps meeting. `verify-stories.mjs` counted
action args by matching `action: '` and `: fn()` **in story files**. Moving the
declarations into a shared table made that count fall from 15 to 6 — a ratchet
reporting a *reduction* in the very thing that had just increased, because it
counted the spelling rather than the substance. It now also counts event props
switched on through `ariaArgTypes`, reads the callback list from
`ARIA_EVENTS` in the table rather than keeping a second copy, and refuses to run
at all if it reads fewer than nine names out of it — the failure that mattered
was never a wrong count, it was finding none and blaming the stories. The first
version of that reader was itself wrong, matching seven of nine because a lazy
regex over one single-line entry swallowed the two after it, which is why the
list is a flat array rather than something to be inferred from the table's
shape. The table asserts at load that the array and the `Events` category agree
in both directions.

`ariaArgTypes` is narrower than real docgen in one way worth stating plainly: it
can refuse a claim, but it cannot *discover*. Nothing tells a story that `Button`
has `onPress` until somebody writes it and `tsc` agrees. Discovery comes back
the day either route above opens.

---

## R-24 · Crystal 2.2.0 publishes the recipes this library restates, and the sweep's second half is due when it lands

*(Opened 28 September 2026, with the proposal in
`docs/proposals/2026-09-28-adopting-crystal-2.2-recipes.md`. Unblocked the same
day: 2.2.0 is published and installed.)*

**Where it stands.** 2.2.0 is installed and the dependency is `^2.2.0`. The version
guard failed on the bump as it was written to, and is now the opposite check — a
floor, because this library plays recipes that exist only from 2.2.0 (the three
continuous indicators and `mark-in`), and on anything older `useMotion` throws for
an unknown recipe. The surface sweep below is what remains.

**What changed upstream.** The R-19 sweep stopped where Crystal had no recipe:
`NavLink` kept a weight of 550 because `.cr-button`'s 750 would destroy it, the
nav rail item and the drag handle had nothing to wear, eighteen controls took a
local `bare-control` mixin because `.cr-button.quiet` is not a bare control, and
`FloatingWindow` and `MediaControls` kept `material.resin` on their shells. Those
were the recipes "to author in core, not classes to wear here". Crystal 2.2.0
authors them — `.cr-nav-item` (and `.stacked`), `.cr-bare`, `.cr-drag-handle`,
`.cr-resin.panel`, the native switch — and, more than that, names every
component's **surface** from a closed vocabulary (`@crystal-ui/core/surfaces`),
so what each component is made of is now data this library can be checked
against rather than prose it interprets.

**What this library does on the day.** Phase B of the proposal: each component
wears Crystal's class and deletes its local copy, measured the way R-19 was —
plant Crystal's element beside the library's, diff computed style to zero, then
plant it red. `bare-control` goes; `field.shell`'s hand-written recipe goes;
`NavLink` and the rail item wear `cr-nav-item`; `DragHandle` and `Resizable`
wear `cr-drag-handle`; `FloatingWindow` and `MediaControls` wear `cr-resin panel`;
`Switch` wears the native switch recipe or proves its own equal to it. The
component manifest gains each component's `surface`, read from the catalogue,
and `verify:appearance` gains one check per surface.

**Why it waited.** This library resolves `@crystal-ui/core` from npm, not from
the local checkout, and wearing a class the installed stylesheet does not define
leaves a component unpainted — the mistake R-19 warned about.

**What is not blocked, and shipped alongside this entry.** Phase A of the
proposal — everything the installed 2.1.0 already publishes and this library was
not using: transient overlays moved to Frost (R15e, which the specification had
not caught up with either); the dialog, drawer and command palette scrims play
Crystal's `mirage` and `mirage-out` and the dialog surface plays `dismiss`, none
of which had ever played; checkbox and radio play `check` and `check-off`; menu,
popover, tooltip and hover card play their arrivals. The exits those four owe
(`menu-out`, `popover-out`, `tooltip-out`) are still not played — React Aria
unmounts the popover as it closes, and holding it for an exit needs
`AnimatePresence` around React Aria's own overlay lifecycle, which is the one
piece of this that is not a binding but a structure, and is written up in the
proposal rather than done in passing.
