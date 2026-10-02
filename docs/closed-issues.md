# Closed issues: Crystal React

Everything here is done. The entries are kept because the code they produced and
Crystal's own tracker refer to their reasoning, and because an entry that says
why a rule exists stops someone who sees only the rule's cost from removing it.

Two pairs of entries explain how the library is set up now:

- **R-13 and M-4.** This library's materials had drifted from Crystal's and
  nothing compared them. The parity gate that closed it is `verify-materials`,
  and it is why `crystal-preview` is checked out in CI.
- **R-14 and R-16.** Crystal was a path on a disk. Both closed when
  `@crystal-ui/core` was published, and the workarounds they needed
  (`optimizeDeps.force`, a sibling checkout, a push-ordering preflight) were
  removed with them.

The live tracker is [`open-issues.md`](open-issues.md).

---

## R-24 · Crystal 2.2.0 publishes the recipes this library restates, and the sweep's second half is due when it lands

*(Opened 28 September 2026, with the proposal in
`docs/proposals/2026-09-28-adopting-crystal-2.2-recipes.md`. Unblocked the same
day: 2.2.0 is published and installed.)*

**Where it stands.** 2.2.0 is installed and the dependency is `^2.2.0`. The version
guard failed on the bump, as it was written to do. It is now the opposite check,
a floor, because this library plays recipes that exist only from 2.2.0 (the three
continuous indicators and `mark-in`), and on anything older `useMotion` throws for
an unknown recipe.

Phase B has landed component by component, each measured against Crystal's
class planted beside it: bare controls wear `.cr-bare` and `bare-control` is
gone; navigation links and rail destinations wear `.cr-nav-item`; the drag
handle wears `.cr-drag-handle`; the floating window and media controls are the
Resin plane; the tables stop restating their frame; the card is Crystal's Haze;
badges, keys and the overlaid caption wear their surfaces; every transient
overlay is Frost; the dialog is Crystal's over Mirage; the switch is Crystal's
native switch.

The field shell landed last, after Meridian ruled D-24 on 28 September 2026 that
the library adopts `.cr-field-shell` as written, rim included. Every field shell
wears it, `field.shell` keeps only layout, the `shell-fallbacks` mixin is gone
because Crystal publishes all three routes, and the control inside takes
Crystal's 44px floor and 12px radius. A single-line field is therefore Crystal's
62px rather than 58, and a pin well is square at that height.
`verify:appearance` plants a Crystal field beside every field in the six input
stories and fails on any material difference or a single-line height that is not
Crystal's. It was seen red on the previous build in all six.

The docks followed, once Crystal's catalogue named them (D-23). The tab strip,
the segmented control, a floating toolbar (and so the command bar and the action
bar), the dock and the bottom navigation wear `.cr-dock` (the dock with
`.cr-dock-inner` for its Stone backing), and their local Resin, Haze and
fallbacks are gone. A floating toolbar's buttons had each kept their own Resin
coat, which put Resin inside Resin, and are bare now. The bottom navigation is
the catalogue's pill, with one Haze fill rather than one per destination.

Tabs and segments now take the primary fill when selected, not primary-soft. The
catalogue entries, `.cr-dock`'s selected rule and the documentation site all
say primary, and the soft fill was this library's. Crystal keys a dock's
controls on `button`, and a tab, a radio label and a link are not buttons, so the
pills restate `.cr-dock button` (52px, 13/18 padding, 700 over 800) and are
compared with a planted one. The button group and split button keep their
touching segments and hairline, which `.cr-dock` does not draw, and gain the
dock's rim, which was the one property they lacked. Both gaps are filed
upstream as D-26. `verify:appearance` plants a `.cr-dock` beside every one of
these. It was red on the previous build in all seven stories.

The manifest carries `surface` (§3.3), with the vocabulary itself beside
the components and in `llms.txt`, and the build fails closed on a surface the
vocabulary does not define. `verify:appearance` has one check per surface:
seventeen rows, one component each, planted beside an element wearing the
surface's class, plus the field, dock and switch blocks above. Two differences
are named as decisions: the count badge's Haze inset and a bare control that
kept `border: 0`. Anything else fails. `VERIFY_PLANT_RED=1` sabotages every
row's fill and all seventeen fail, so every row has been seen red. Writing the
check found three components wearing nothing. The authored bubble now wears
`.cr-bubble` (it had restated it "value for value" and differed in two values).
The app shell wears `.cr-plastic` (it painted the flat canvas over the
provider's atmosphere) and its destinations wear `.cr-dock`. The third,
`Indicator`, is R-25. The image comparison's handle wears `.cr-resin`. The
resizable handle does not, because its 44px target is its `::after`, which
`.cr-resin` paints. §3.5, deleting `coreVersion.test.ts`, is superseded: the
file was a reminder and became a floor, and a floor is still needed.

What remains is the motion bindings (§3.4).

**What changed upstream.** The R-19 sweep stopped where Crystal had no recipe:
`NavLink` kept a weight of 550 because `.cr-button`'s 750 would overwrite it, the
nav rail item and the drag handle had nothing to wear, eighteen controls took a
local `bare-control` mixin because `.cr-button.quiet` is not a bare control, and
`FloatingWindow` and `MediaControls` kept `material.resin` on their shells. Those
were the recipes "to author in core, not classes to wear here". Crystal 2.2.0
authors them: `.cr-nav-item` (and `.stacked`), `.cr-bare`, `.cr-drag-handle`,
`.cr-resin.panel` and the native switch. It also names every component's
surface from a closed vocabulary (`@crystal-ui/core/surfaces`), so what each
component is made of is now data this library can be checked against, where
before it was prose the library interpreted.

**What this library does on the day.** Phase B of the proposal. Each component
wears Crystal's class and deletes its local copy, and is measured the way R-19
was: plant Crystal's element beside the library's, diff computed style to zero,
then plant it red. `bare-control` goes; `field.shell`'s hand-written recipe goes;
`NavLink` and the rail item wear `cr-nav-item`; `DragHandle` and `Resizable`
wear `cr-drag-handle`; `FloatingWindow` and `MediaControls` wear `cr-resin panel`;
`Switch` wears the native switch recipe or proves its own equal to it. The
component manifest gains each component's `surface`, read from the catalogue,
and `verify:appearance` gains one check per surface.

**Why it waited.** This library resolves `@crystal-ui/core` from npm, not from
the local checkout, and wearing a class the installed stylesheet does not define
leaves a component unpainted, which is the mistake R-19 warned about.

**What is not blocked, and shipped alongside this entry.** Phase A of the
proposal, which is everything the installed 2.1.0 already publishes and this
library was not using: transient overlays moved to Frost (R15e, which the
specification had not caught up with either); the dialog, drawer and command
palette scrims play Crystal's `mirage` and `mirage-out` and the dialog surface
plays `dismiss`, none of which had ever played; checkbox and radio play `check`
and `check-off`; menu, popover, tooltip and hover card play their arrivals. The
exits those four owe (`menu-out`, `popover-out`, `tooltip-out`) are still not
played. React Aria unmounts the popover as it closes, and holding it for an exit
needs `AnimatePresence` around React Aria's own overlay lifecycle. That is a
change of structure, where the rest of this work is bindings, so it is written
up in the proposal and was not done alongside them.

**Closed 28 September 2026.** The motion bindings (§3.4) are done, shape by
shape. Each is bound to state and not to an event, none plays on the render
that first shows a thing, and each is checked in a browser by `verify:behaviour`
and was seen red with its binding removed. There are 100 checks where there
were 50.

- **State entered** (`useChangeMotion`): `selection` on every control that picks
  one of several, `slider-step` on readouts, `highlight` on replaced figures and
  changed cells (on a Haze layer beneath the content, because the recipe fades
  opacity), `attention` and `success` on status, `progress-change`,
  `copy-confirm`, `icon-turn`, `accordion-in` on a spoiler, `page-in` on a
  master-detail's detail.
- **Arrival and departure of overlays**: every React Aria overlay now leaves
  with its exit. The exits were recorded as needing `AnimatePresence` around
  React Aria's lifecycle. They needed nothing new: React Aria holds an exiting
  overlay, and a disclosure panel, until `getAnimations()` settles, checked from
  a layout effect that runs after its children's. `Departure` registers the hold
  and starts the recipe first.
- **Presence**: collections, and surfaces a product shows and hides
  (`ListPresence`, `usePresenceMotion`, `PresenceExit`): `list-in` and
  `list-out`, `drawer-in`/`-out`, `toast-in`/`-out`, `hint-in`/`-out`, `page-in`/
  `-out` on the state screens and focus mode's chrome. Each is inert while it
  leaves, and none plays outside a presence.
- **Media and drag**: `media-in` on media ready, `caption-in`, `drag-pickup` and
  `drag-settle`, `resize-settle`, `reorder`.

Binding them found three defects: `DropZone` discarded every dropped file (it
gave React Aria's zone no `onDrop`, and its own `onDrop` prop was never read);
`Breadcrumbs` would have replayed every crumb, because React Aria rebuilds its
items when the trail changes; and five empty directories were hiding
components from the manifest's motion scan.

**What is not bound, and why.** These assignments in the installed catalogue
are not played, each for a stated reason:

| Assignment | Components | Why |
|---|---|---|
| `page-in`, `page-out` | NavLink, NavRail, Dock, BottomNavigation, Stepper, CheckoutSteps | The view a destination opens is the product's; the navigation does not render it. Crystal D-28. |
| `page-out` | MasterDetail | The detail it replaces is gone in the same render; there is no departing view. |
| `list-out` | DataTable, ResizableTable, Transfer | A removed item leaves React Aria's collection at once; there is nothing to hold. |
| `accordion-out` | TreeView, OrganizationChart, NavigationTree | The same: collapsed rows leave React Aria's tree at once. |
| `accordion-out` | Spoiler | Collapsing truncates rather than hides, so an exit that ends with the content gone has nothing honest to end on. |
| `slider-step` | ColorArea, ColorSlider, ColorWheel | No readout, and the thumb's transform is React Aria's position. Crystal D-28. |
| `menu-in`, `menu-out` | Menubar, SplitButton | Their menus are the product's `Menu`s, which play both. |
| `field-*` | Cascader | Its trigger is a button, which marks its own focus (`Select`'s rule), and it has no validation. |
| `field-*`, `media-in` | JsonInput, ProductGallery | Played, through `TextArea` and through `Gallery` → `Lightbox`; composition the count does not credit. |
| `list-in` | ComboBox | Filtering reveals options that exist; the recipe is for "real added" items. |
| `busy`, `activity-turn` | Progress, Loader | D-19's continuous recipes play instead; `busy`'s "one cycle" predates them. Crystal D-28. |
| `resin-confluence` | FloatingAction | Its own text: "a visual study, not an application action". Crystal D-28. |
| `reaction` | AuthoredBubble | There are no reactions in the component to toggle. Crystal D-28. |
| `view-push-out` | ViewStack | The covered view is unmounted; see the component's own note. |
| `selection`, `page-in` | MonthPicker, YearPicker, DigitalClock | Implemented as segment fields; there is no grid of months or times to select in. |
| `selection` | ColorSwatch | A static swatch; `ColorSwatchPicker` plays it. |

## R-0 · Everything visual before slice G was reviewed without Crystal's materials

**No longer a defect. It is a caveat on the evidence.**

`-webkit-backdrop-filter` was written by hand beside `backdrop-filter` in every
stylesheet that used it. The build pipeline (autoprefixer followed by esbuild's
CSS minifier) then collapsed the pair and kept only the prefixed one. Chromium
does not understand the WebKit alias, which is Safari's, so Frost and Resin
rendered as flat translucent fills with no diffusion, in every story, from the
first component to slice F.

This was reproduced directly. Two rules were built through the real pipeline,
one writing both properties and one writing only the standard:

```
._probe_…        { -webkit-backdrop-filter: blur(40px) saturate(125%); background: red }
._onlyStandard_… { -webkit-backdrop-filter: blur(40px) saturate(125%);
                   backdrop-filter: blur(40px) saturate(125%) }
```

Autoprefixer alone does not do this: running it over the same declaration keeps
both. The hand-written pair is what causes the loss.

Fixed in slice G: the library writes the unprefixed property once and lets
autoprefixer add the prefix. Every visual judgement recorded before that was
made against a Crystal without its materials, and the screenshots in earlier
commit messages show that state. The finished components need a pass with the
materials on.

**The pass is done and found one defect.** `Select`'s trigger is one element
carrying both the shell and the control. `control` has `border-radius: inherit`
so that an input inside a well does not square off, and on the trigger that
inheritance reached past the shell to the field, which has no radius. The
trigger rendered with square corners while every other field in the library was
a 28px well. No test could see it, because `border-radius` is geometry and jsdom
has none.

Fixed by giving the combination its own mixin, `field.trigger`, which is
`control` without the inherited radius. `Cascader` was doing the same thing and
is moved onto it too.

Everything else surveyed with the materials on renders as intended: buttons,
comboboxes, the scroll areas, cards, the temporal family and the dialog over its
Mirage scrim. There was one false alarm. A dialog screenshot taken two seconds
after opening looked washed out and blurred. It was a frame of the entrance
animation, which is a second long. The settled state is crisp.

## R-1 · A slider's unit is shown but not announced

**Severity: high. The component's own comment claims otherwise.**

`Slider`'s `formatValue` reaches the visible output and does not reach
`aria-valuetext`. Confirmed: a slider with `formatValue={(v) => \`£${v}\`}` at
2400 renders `£2400` on screen and announces `2,400`.

That is the failure `Slider.tsx` says it prevents, in the words "a number without
its unit is the difference between a usable control and a guess", so the code
and its documentation disagree.

`src/components/Slider/Slider.tsx`. React Aria derives `aria-valuetext` from its
own `formatOptions`, so the fix is to pass `formatOptions` through rather than
formatting in the render, or to set `aria-valuetext` on the thumb explicitly. The
existing test asserts only that `aria-valuetext` is non-empty, which is why it
passes. It should assert that the unit appears in it.

**Closed.** `formatValue` is replaced by `formatOptions`, which React Aria uses
for both the visible output and `aria-valuetext`, so the two cannot drift. The
test now asserts that the unit appears in the announcement. It used to assert
only that the attribute was non-empty, which is how the defect passed.

## R-2 · Two mask inputs with the same mask share an id

**Severity: high. The second field's label points at the first field.**

`MaskInput` falls back to `` `mask-${mask.length}-${name ?? 'field'}` `` when no
`id` is given. Two phone fields on one form with no `name` both get
`mask-14-field`, so both `<label for>` attributes resolve to the first input:
clicking the second label focuses the first, and a screen reader announces the
wrong name.

`src/components/MaskInput/MaskInput.tsx`. `useId()` is the fix. The fallback
was written before anyone noticed that `react-imask` accepts an `id`.

**Closed.** The component uses `useId()`. The test renders two unnamed phone
fields and asserts their labels resolve to different inputs.

## R-3 · `AngleSlider` and `Knob` are unnamed when the label is not a string

`aria-label` is set only when `label` is a `string`, so `<Knob label={<>Gain</>}>`
produces a `role="slider"` with no accessible name. Every other component in the
library handles this by rendering a visually-hidden real label.

`src/components/AngleSlider/AngleSlider.tsx`. The same pattern as
`SegmentedControl`'s `labelHidden`, which already does it correctly.

**Closed.** `aria-labelledby` points at the label already on screen, so any
`ReactNode` works. Writing the test found a second defect in the same component:
`onKeyDown` was set after `{...moveProps}` and so replaced `useMove`'s own key
handling, and arrow keys did not move the dial. The handlers are now merged with
`mergeProps`, and a keyboard delta is one `step`, where it was one pixel scaled
by the pointer ratio.

## R-4 · The character count's live region appears rather than updates

`TextArea` adds `role="status"` to the count only once the remaining characters
drop to 20, which means the live region is inserted at that moment. A live
region that appears at the same time as its content is not reliably announced.
The region has to exist before the text changes.

`src/components/TextArea/TextArea.tsx`. The region should be present and empty
from the start, with only its text changing.

**Closed.** There are two elements: an `aria-hidden` figure and a permanently
mounted, initially empty live region. The region announces words,
"18 characters remaining", and not "18 / 30", which a reader renders as a date.

## R-4b · Overlay containers accumulate with nested providers

Each `CrystalProvider` appends its own overlay container to `document.body`, so a
page with a provider at the root and a themed island inside it has two. That is
correct, because each carries its own palette. But nothing dedupes an unmounted
one beyond its own cleanup, and a provider whose props change identity on every
render would churn them.

`src/theme/CrystalProvider.tsx`. Noticed while building the portal fix. It was
not observed misbehaving.

**Closed, with a different defect found.** The container itself never churned,
because the mount effect has always had empty dependencies. But the effect that
writes the theme onto it only ever added properties. Moving from Harbor dark,
which declares `contentOwnSurface`, to a palette that does not declare it left
Harbor's value on the overlay container permanently. The written properties are
now tracked and removed.

## R-4c · `UploadZone` renders an empty label

It composes `Upload` with `label=""` to suppress the second heading, which leaves
an empty `span` where a label would be. Harmless to look at and untidy in the
accessibility tree.

`src/components/FileInput/FileInput.tsx`. `Upload` wants an optional label rather
than an empty string.

**Closed, and it was worse than untidy.** `UploadZone` composed `Upload` with
`label=""`, which also gave the zone a second "Choose a file" button, a second
copy of the description, and a second `role="alert"`, so the same error was
announced twice. The file list is now its own piece that both components draw on.

## R-4d · A cascader's columns are named by depth

Each column is announced as "Top level", "Level 2", "Level 3". A reader moving
into the third column learns its position and not its subject. "Regions of
Scotland" would be the useful name, and only the product knows it.

`src/components/Cascader/Cascader.tsx`. It needs an optional per-level name from
the caller, defaulting to the parent option's label.

**Closed.** `columnLabels` takes the product's own names and defaults to the
label of the option the column hangs from.

## R-5 · `usePreset` has no direct test

It is exercised only through `Dialog`, so a change to the preset geometry that
happens not to affect a dialog's movement would pass everything. It is the one
motion primitive without its own suite.

`src/motion/usePreset.ts`.

**Closed.** Six tests cover what this file owns rather than what the core
module computes: it names the movement, it reports finishing, it settles the
promise instantly under reduced motion and for materials whose signature is paint
(an exit awaiting it must never hang), it clamps measured travel and depth to
Crystal's ceiling, and it passes the caller's anchoring through.

The clamp test uses a ceiling of 30 rather than Crystal's own 50, because depth's
fallback is 50, and a ceiling equal to the fallback would let a hook that never
clamped pass. Verified by removing the clamp and watching the test fail with
4000.

## R-6 · `MultiSelect` is a select pretending to be a combobox

It drives React Aria's `Select` with `selectedKey={null}` and reads the selection
out of a `ListBox` beneath it, which works but is not the shape React Aria
intends. The catalogue calls it "combobox anatomy", and slice G brings the real
`Combobox`. This should be rebuilt on it in slice G and not before.

`src/components/MultiSelect/MultiSelect.tsx`. **Fix during slice G.**

**Closed. The defect was more than the shape: the component announced nothing as
selected.** This was probed: React Aria's `Select` and its `ComboBox` each own
the selection of the listbox they contain, and each replaces it. A
`ListBox selectionMode="multiple"` nested inside either renders with no
`aria-multiselectable` and every option `aria-selected="false"`, silently and
with no warning. The shipped component did that, so nothing was announced as
chosen, and `.option[data-selected]`, which carries Crystal's label weight,
never matched either. The selection was neither announced nor shown, and there
was no test file to notice.

Rebuilt on a standalone `ListBox` inside `DialogTrigger`, then `Popover`, then
`Dialog`, where it keeps its own multiple selection. **Do not re-nest it in a
field wrapper.** The trigger reports `aria-haspopup="dialog"`, which is what it
opens.

Filtering came with it, which is what "combobox anatomy" was asking for, along
with the catalogue's `at-limit` state (`maxSelected`) that the component had
never had. A filter hides options and must not deselect them, so keys the filter
has hidden are carried across by hand. There are nine tests, including axe with
the popover open.

## R-7 · Neither repository has continuous integration

`pnpm verify` and the design system's gate set are run by hand. Every gate in
this project exists because something passed review and broke anyway, and none
of them runs unless somebody remembers.

Storybook's accessibility addon is configured to fail rather than inform
(`test: 'error'`), which is only meaningful inside a test runner that executes
the stories. Nothing currently does.

Root of both repositories. A workflow running `pnpm verify`, the design system's
`npm test` / `validate.py` / `verify:visual` / `verify:scroll`, and Storybook's
test runner would close it.

**Closed.** `.github/workflows/verify.yml` is in both repositories. It adds no
new checks: every step is a script that already existed. The scripts now run on
a clean checkout, on somebody else's machine, before a change lands.

Crystal React's workflow lays out both checkouts as siblings, because
`@crystal-ui/core` resolves to `file:../crystal-design-system/design-system` and the
layout on disk is part of the build. Crystal is private, so the Crystal checkout
needs a repository-scoped `CRYSTAL_READ_TOKEN` secret. Without one the run stops
at that step.

Both add one gate that had no hand-run equivalent: a build must not change a
committed file. When generated output has drifted from its source, every check
that runs on it is evidence about the wrong thing. Crystal's own copy exempts
the `date` in `validation/token-checks.json`, which records when the evidence
was produced, and holds the rest of that file to the same rule.

## R-8 · The docs website does not exist yet

Slice M in `implementation-plan.md`. Meridian asked for a documentation site
deployable to Vercel, with isolated visual and code examples per component, in
line with MUI, Mantine, PrimeReact and Blueprint. Nothing is built.

**Scheduled, not overdue.** It is recorded here so that it is visible alongside
everything else and not only inside the plan.

**Not an issue: scheduled work.** This is slice M of `implementation-plan.md`
and belongs to the plan's status, not to a defect tracker. It is recorded here
only so the number is not reused.

## R-10 · Nothing in the library measured a target

**Closed.**

Crystal's floor is 44px and the catalogue states it per component: "Pill tabs
inside a pill strip; 44px minimum", "44px targets on touch". No check in this
library measured one, for reasons that apply beyond this defect:

- **jsdom reports every box as zero.** A `getBoundingClientRect` assertion in a
  vitest test passes on a control of any size, including one that is not there.
- **axe does not measure.** SC 2.5.8's floor is 24px, which is not what Crystal
  claims, and axe carries no rule for it in any case.
- **A screenshot shows the paint, not the hit area.** The two differ on purpose
  in Crystal: a breadcrumb in a line of caption text is 21px tall and 44px to a
  finger.

So a control could be half the size it promises, in every story, with the unit
tests green and the frames blessed. One was: a tab measured 36px inside a 45.6px
strip, and the segmented control's pills had been the same since they shipped.
It was found by opening the component in a browser and measuring.

`scripts/verify-targets.mjs` probes the four edges of a 44px box centred on each
control and asks the document what is there. It checks the hit area, not the
box, because Crystal reaches the floor two ways: some controls are 44px, and
some are shorter with a pseudo-element restoring the target. A box measurement
sees only one of them.

It also checks ownership: the topmost element at each probe point has to be
that control. Growing a hit area is how a small target reaches the floor and also
how one target starts taking another's taps. The check found a case at once, the
vertical tab list, where pills are stacked and each grown area reached into the
tab below. Vertical pills are now 44px in their own right.

Proved by planting the defect: removing the pseudo-element failed six controls
across two stories.

The gate is a named list of stories and selectors, not a sweep of every
interactive element, because a link in running prose is text rather than a
target and a blanket sweep would need an exclusion list longer than the
inclusion one. It runs in CI against the static Storybook build rather than the
dev server, which removes the stale-transform class of false defect that has
twice sent this project chasing something not in the source.

Building it showed that for React Aria's radio the element ARIA names and the
element a finger meets are different nodes: the radio is a visually-hidden 1px
input inside the label. Probing the named one reports every segmented control in
Crystal as a 1px target.

## R-11 · A rule that lives in CSS has no gate in this library

**Severity: medium. The pattern matters more than any one instance.**
**Closed 19 September 2026.**

Three checks written this cycle could not be written where they belonged:

- ~~**A link is underlined at rest.**~~ **Withdrawn. This one was checkable and
  is now checked.** The claim here was that jsdom loads no stylesheet. That is
  false: Vitest is configured with `css: true` and the module stylesheet is
  applied. jsdom does not derive longhands from a shorthand, so
  `textDecoration` answers `"underline"` on the same element where
  `textDecorationLine` answers `"none"`. The first attempt read the longhand and
  drew the wrong conclusion. `Anchor.test.tsx` now asserts the shorthand and the
  underline offset.

  The boundary, as measured: jsdom applies the rules and reports lengths, but
  does not resolve custom properties. `color` on that same element reads back as
  the literal text `var(--cr-primary)`. So anything about a Crystal colour still
  needs a browser, and anything about a length, a shorthand or a keyword does
  not.
- **Every interactive control shows a focus ring.** This has happened.
  `--cr-focus-core` and `--cr-focus-ring` were read by every field in this
  library and defined by nothing, so Crystal's focus ring painted on no control
  anywhere, through an entire slice, with every test green. It was found by
  opening a component in a browser. `published-properties.test.tsx` now catches
  the undefined property. Nothing catches a control that has no rule.
- **A state is distinguishable without colour.** Selection is weight, current
  location is a dot, an error is weight plus a symbol. Each is a CSS fact.

What remains: jsdom tests semantics and the parts of CSS that are not colours,
axe tests the tree, the target gate measures geometry and the behaviour gate
drives the page. Nothing checks what a state looks like, because every Crystal
state is expressed through a custom property and jsdom hands those back
unresolved.

`scripts/verify-behaviour.mjs` was built out of this entry and closed the
behavioural half. It found three defects in the scroll spy on its first run.

### Closed: `scripts/verify-appearance.mjs`

The appearance half is 18 checks, run in a real browser against resolved
computed style. There are three rules, and every assertion is a relationship
rather than a value. This entry named the reason ("a gate that asserts a colour
is a gate that fails on a palette change"), and the design follows from it:

- **A focus ring exists.** The control is focused and compared with itself at
  rest. The ring is looked for on the control and up to three ancestors,
  because a Crystal text field puts `outline: 0` on the bare `<input>` and draws
  the ring on the field shell around it, and the shell is the control a person
  sees. The question is "does focusing this show a ring", not "is the ring on
  this exact node".
- **Selection is carried by weight.** The selected row's computed `font-weight`
  must exceed its neighbour's, and its text must contain no check mark. If the
  weights are equal, whatever marks the selection is doing it with colour or
  with a shape, and both are withdrawn.
- **Disabled is more than opacity.** Opacity lowers contrast against whatever is
  behind, and on Resin that is a coloured atmosphere gradient, so it is the one
  signal whose legibility depends on the artwork.

Each rule was seen to fail before it was trusted. Removing `Button`'s focus ring
fails two checks, making the selected pill the same weight as its neighbour
fails one, and leaving opacity as the only disabled difference fails one.

The disabled check had to be rewritten during that exercise, for a reason that
recurs in this project. The first version compared the disabled button with the
first enabled button in the story. That is a different variant, a quiet button
beside a Resin one, so `color` and `backgroundColor` always differed and the
check passed on anything. It could not fail. It now removes the disabled
attributes from the one element, re-reads it, and puts them back, which isolates
the single variable.

## R-12 · A stale dev server is indistinguishable from a broken theme

**Closed as a gate. The hazard itself is inherent.**

Meridian looked at the running Storybook and reported that "many of Crystal's
specifications seem to be absent from the components". What they saw was real,
and the cause was the dev server, not the components. It had been running
across several hours of source changes and was serving a stale copy of
`@crystal-ui/core`, so `--cr-overlay-max-width`, `--cr-overlay-tooltip-max-width`
and both arrow properties resolved to nothing. A command palette with no maximum
width rendered 1160px wide.

Before the report arrived, the same stale bundle had already led to a diagnosis
in progress that read "the provider does not publish the overlay properties".
That was false, and it would have produced a fix for a defect that did not
exist. Clearing `node_modules/.vite` resolved all four.

This is the third time. The two earlier cases cost a chase after
`useInvalidMotion is not defined` and a chase after missing focus properties.
Both were in the source the whole time.

**What is new: `scripts/verify-theme.mjs`.** It collects every `var(--cr-…)` in
the library's stylesheets and asks a real browser whether each one resolves, on
the themed scope and on the container React Aria portals every overlay into.
That is sixty properties on both elements. It then computes the three materials
and fails if any of them is `none`. A `backdrop-filter` built from a property
that does not resolve is a syntax error, so the surface renders flat and not
with a weaker blur.

`published-properties.test.tsx` already mounted a provider and checked that each
property read is one the provider writes. It is a real check: it caught the
focus-ring outage. It cannot see the overlay container, a value that is present
but not usable, or a served bundle that is not the source. The new script adds
those three.

The failure message names the cache, so that the next person to meet this does
not spend the same hour:

> If the source looks right, clear the dev server's cache before believing this.

**A second artifact, recorded but not gated.** The same session's palette looked
washed out in the in-app preview browser: 59% opacity, and motion state still
`running` a second and a half after a 620ms recipe. That is
`requestAnimationFrame` throttling in a hidden tab and is not a defect. The same
story in a visible Chromium reaches full opacity in 300ms and settles by 700ms.
Measurements of motion or opacity taken in a backgrounded pane are not
reliable.

## R-13 · Crystal React's materials had drifted, and nothing compared them

**Closed for the library. The remaining half is a decision for Meridian (see below).**

Meridian sent a screenshot of Crystal's own playground and said none of the
components looked like it, "even in their hover state". There were two separate
causes, and no existing gate could see either.

### The foundation was flat

Crystal's materials are defined by what is behind them: Frost diffuses the
foundation, Resin transmits its colour, Haze fills over it. The Storybook
decorator painted `background: var(--cr-canvas)`, a flat colour, so every
material in every story had nothing to diffuse and rendered as white. Storybook
is where a reviewer looks at the material hierarchy, and the hierarchy was not
visible there.

Crystal's own scene marks itself `class="stage cr-plastic"`, and `.cr-plastic`
carries the three radial atmosphere washes. The decorator uses that class now,
so there is no second recipe.

Colour atmosphere was a provider input with no way to reach it. It is a
toolbar control now, with Frost base tint, elevation, corner radius, animation
speed and the ground. These are the controls of Crystal's own "Make it yours"
panel, in the same order with the same defaults. Any of them can also be pinned
per story through `parameters.crystal`, so a component whose subject is an
environment can show it, and a browser gate measures a fixed environment
instead of whatever the last reviewer left in the toolbar.

### Resin had no optical rims and half its elevation

Crystal paints Resin with `--cr-shadow-float`, which has four layers: two inset
optical rims over a two-part elevation. Crystal React painted
`--cr-shadow-content`, which has two layers, no rims and roughly half the
elevation. It did so in eight component stylesheets plus the field and strip
mixins. AGENTS.md lists optical rims among the qualities the approved baseline
exists to protect. With the rims Resin reads as a raised piece of glass, and
without them it reads as a rounded rectangle.

`styles/_material.scss` now holds one definition per material. `Button`'s hover
no longer cross-fades a second float shadow in. The cross-fade was right while
the rest state was the content shadow, and it doubled the shadow once the rest
state was corrected. Crystal's own Resin control does not lift on hover:
`:is(button,a.cr-button):hover` reads `filter: none`. The resting state is
already the floating state.

### `scripts/verify-materials.mjs`

This is the aesthetic check. It renders the same material in Crystal's preview
and in this library and compares the computed style: diffusion, shadow, fill and
edge. Neither side's values are written down, so the expectation follows Crystal
and not a copy of it.

It had to learn two things. First, it picks the first match that paints.
`controls.css` puts the Resin recipe on `.cr-resin-haze`, `.cr-control` and every
bare `button`, so the first `.cr-haze` in Crystal's preview is a control wearing
Haze's class, and comparing against it reports a drift that comes from a
mismatched specimen. Second, geometry is excluded. Crystal's preview and a
Storybook specimen are different compositions, so a radius difference is a
layout choice and says nothing about the material.

Frost matches exactly. Haze has no clean specimen in Crystal's preview to compare
against. That gap is recorded here and has not been worked around.

## M-4 · Crystal's exported Resin shadow does not produce Crystal's approved Resin

**A decision for Meridian. Found by R-13's parity gate; not fixed here, because
fixing it changes the material every platform renders.**

There are two Resin shadows in Crystal and they disagree:

| | recipe |
|---|---|
| `--cr-shadow-float`, the exported token | `inset 0 1px 1px` highlight, `inset 0 -1px 1px` **contact**, `0 5px 8.75px`, `0 25px 50px`, both **palette-tinted** |
| what the preview renders, via `controls.css` | `inset 0 2px 1px` highlight, `inset 0 -1px 1px` **highlight**, `0 5px 9px`, `0 16px 30px`, both **near-black ink** `#080b24` |

The second is what the approved baseline shows, because the baseline was captured
from the preview. The first is what every platform library gets, because
`controls.css` is not exported. That was D-1's fix.

So a platform library that follows the token cannot reproduce the approved
appearance, and `libraries/CONTRACT.md`'s parity bar cannot be met by following
Crystal's own tokens. The token gives a deeper, softer, palette-tinted shadow
(50px of spread against 30px) and a shallower top rim.

This is the D-1 hazard again: `controls.css` shaped the appearance that was
blessed, and the exported surface says something else.

**Closed. Meridian gave full approval to make whatever changes aesthetic parity
needs, so this was fixed rather than allowed.**

Each side was right about one part, and both parts are kept. The rims are the
blessed ones: 2px of light along the top where it catches, and a light edge
returning underneath. The token's lower inset used the contact colour, which
reads as an inner shadow at the bottom of a control and not as the underside of
glass. The elevation is the token's: palette-tinted like every other Crystal
shadow, and scaled by the elevation control. The literal did neither. Before
this change, moving the elevation slider did nothing to any control in the
playground.

`controls.css` now reads `var(--cr-shadow-float)` in both the places it had
written its own copy, so there is one recipe. The coefficients are the blessed
distances over the default 125% elevation (`4e`/`7.2e` and `12.8e`/`24e`), so the
default renders what was approved and the slider now moves it.

Twelve of eighteen frames moved, the largest at 3.2% of pixels with a worst
channel delta of 19 of 255. Side by side the playgrounds are the same picture.
Re-blessed with the reason in
`validation/captures/2026-09-19-one-resin-shadow/`. 1,788 contrast cases still
pass, and `verify-materials` reports ten comparisons, no allowances, no failures.

## R-14 · A `file:` dependency was pre-bundled once and served stale for hours

**Closed.**

`@crystal-ui/core` is `file:../crystal-design-system/design-system`, the design
system itself, edited in the same sitting as this library. Vite's dependency
optimiser caches a pre-bundled copy, so a change to Crystal's resolver does not
reach the served page until somebody clears the cache.

It cost three investigations in one day. The first went far enough to begin a
wrong diagnosis of the theme provider. The second was Meridian looking at the
Storybook and reporting, correctly, that Crystal's specifications were missing
from every component. The third came while fixing M-4, when the parity gate kept
reporting the old shadow after the token had already changed.

Excluding the package from optimisation was the first attempt and it fails:
`core/preferences.js` and the resolver are CommonJS, so the browser receives a
module with no default export and every story renders blank. They have to be
pre-bundled, and the defect is that they were pre-bundled once and then cached.
`optimizeDeps.force` in `viteFinal` costs a few seconds of startup and removes
this class of defect.

Killing the dev server and restarting it is not enough on its own, which made
the defect harder to see. A lingering process keeps port 6006, the new one fails
to bind, and the measurement lands on the old server. That looks the same as a
cache that will not clear.

## R-15 · Resin surfaces are missing their Haze content fill

**Severity: high. A readability defect before it is an aesthetic one.**
**Reported by Meridian, 19 September 2026. Closed 19 September 2026.**

Crystal paints a protective Haze fill inside every Resin surface, under the
content. Crystal React paints it on four surfaces out of twenty.

References, captured side by side, in
[`references/2026-09-19-resin-haze-fill/`](references/2026-09-19-resin-haze-fill/README.md).

### What Crystal does

Crystal uses three mechanisms. They are different things, and the fix needs all
three.

First, every Resin control carries a feathered Haze fill. From `controls.css`:

```css
:is(button, a.cr-button, .cr-control, .cr-field-shell, .cr-resin-haze, .cr-status)::before {
  content: ''; position: absolute; inset: 8px; z-index: -1;
  border-radius: inherit; pointer-events: none;
  background: var(--cr-haze-fill);          /* the 80% content fill */
  filter: blur(var(--cr-haze-feather));     /* 1.95px */
}
```

The fill is inset by 8px so that it stops short of the rim and the glass edge
still reads. It is feathered, and so it sits on its own layer behind the content,
because feathering an element that contains text blurs the text. `site.css`
states the purpose in one line:
*"`.cr-control` paints an 80% white protective fill under its label so
text stays legible on Resin."*

There is a second layer, `::after` at `inset: 2px` with a 2px blur, carrying the
optical sheen.

Second, a Resin strip carries the fill for the pills inside it, and the pills
carry no material at all. `:is(.cr-dock, .segmented, .suite-tabs)` takes the
same `::before`, and then:

```css
:is(.cr-dock, .segmented, .suite-tabs) button {
  background: transparent; box-shadow: none; backdrop-filter: none;
}
:is(.cr-dock, .segmented, .suite-tabs) button::before,
:is(.cr-dock, .segmented, .suite-tabs) button::after { display: none; }
```

This is structural. In Crystal the strip is the material and the pills are bare.
In Crystal React every pill styles itself and the strip has no fill, which is
why the tab strip reads as one flat wash.

Third, the dock adds `.cr-dock-inner` at `--cr-label-fill`. That is the 55%
label veil, a different token from the Haze fill, and it is the bright inner
band visible in `standard-crystal-dock.png`.

### What Crystal React does

Sixteen of twenty Resin surfaces paint no Haze fill. Only `NavLink`,
`OverlayArrow`, `RichTextSurface` and the overlay row mixin do, and the first of
those was written yesterday.

Missing it: `Button`, `IconButton`, `_field.scss` (which is every text input,
textarea, select, combobox, date picker and tags input in the library),
`_strip.scss` (tabs and the segmented control), `Toolbar`, `ButtonGroup`,
`Slider`, `AngleSlider`, `Switch`, `Checkbox`, `AppShell`, `FloatingAction`,
`Resizable`.

### Why it is not only appearance

Resin is a 20% fill with a 20px backdrop blur, so it transmits whatever is
behind it. On Crystal's Plastic foundation that is a coloured atmosphere
gradient, so a label on bare Resin is read against a surface that changes across
the control and between palettes. The Haze fill puts a stable 80% ground under
the text. Without it the material is flatter, and the label's contrast depends
on the artwork behind the control.

Crystal's contrast evidence is measured against the composition with the fill.
Nothing in this library's checks measures it. The contrast gate lives in the
design system, and `verify-materials` compares the surface's own computed style
and does not look at what a pseudo-element paints behind its content.

### What closing it needs

The Haze fill belongs in `styles/_material.scss` beside the `resin` mixin, as one
definition. That includes the strip variant, since it is the same fill at a
different inset with the children deliberately bare. `verify-materials` should
also grow a comparison for the `::before` layer. The defect was invisible because
the gate only asked the element about itself.

### Closed

The inset became a token first. `--cr-haze-fill` and `--cr-haze-feather` were
always exported, and the composition was not. "Held back 8px from the rim, on
an isolated layer behind the content" lived only as a literal in Crystal's
`controls.css`, which is deliberately unexported. This library could therefore
carry every Haze token, pass every token gate, and paint nothing.
`component.haze.inset` now sits in Crystal's DTCG source, the resolver emits
`--cr-haze-inset`, `controls.css` reads it and no longer holds its own copy, and
the Swift and Kotlin exports picked it up with no further work. The recipe now
reaches every platform library, where before it reached only the renderer that
knew it.

The gate was built before the fix and proven red. It is a new `resin-control`
pair in `verify-materials`, with a `pseudo` field, comparing
`content, backgroundColor, filter, top, right, bottom, left`. It could not be
added to the existing `resin` pair. That pair's Crystal selector is
`.cr-resin:not(button):not(.cr-control):not(.cr-field-shell)`, which excludes the
controls the fill lives on, so a `::before` comparison there would have compared
nothing against nothing and passed. Run before the fix, the new pair reported
seven differences, the first being `content: none` against Crystal's `""`. A
pseudo-element with no `content` does not exist, and every other property on it
still computes to a plausible value, so `content` is the property that shows the
layer is absent, where the others would show only a colour mismatch. The gate
now reports 17 comparisons, 0 failures.

There is one definition, in `styles/_material.scss`. `@mixin haze-fill($inset)`
sets `position: relative` and `isolation: isolate` itself and does not trust the
host. `z-index: -1` without a stacking context puts the fill behind the element,
and a Resin control's own background is a translucent fill, so the Haze fill
disappears underneath it. The result looks the same as never having written the
rule. The mixin is applied to nine surfaces: `Button`, `IconButton`,
`FloatingAction` (both the action and its bar), `ButtonGroup`, `Toolbar`,
`AppShell`'s destination strip, `_field.scss`'s shell (which carries every text
input, textarea, select, combobox, date picker and tags input in the library)
and `_strip.scss`. `NavLink` was rewritten onto the mixin at `haze-fill(0)`.

This was verified by rendering: all nine paint `rgba(255,255,255,0.8)` at
`blur(1.95px)`, inset `8px`, and a tab pill correctly paints none.

### Three things this entry had wrong, found by measuring Crystal instead of reading it

1. Mechanism 3 was attributed to the wrong file and the wrong material. The
   dock's inner band is Stone, not Haze, and it is in the exported
   `crystal.css`, not in `controls.css`. Measured in Crystal's preview:
   `rgba(255, 255, 255, 0.55)`, `blur(1.95px)`, inset `0`. `docs/materials.md`
   already says so: "the dock's `.cr-dock-inner` uses the same recipe" as
   `.cr-stone`. It is a separate material with its own token and is not part of
   this defect.

2. "The same fill at a different inset" was wrong. A Resin strip uses the
   same inset as a Resin control, 8px in both. This was measured.

3. Four of the surfaces listed as missing the fill are correct without it.
   `Checkbox`, `Switch`, `Slider` and `AngleSlider` were named above. Crystal
   gives none of them a Haze `::before`: `input[type=checkbox]`, `.switch-track`
   and `input[type=range]` are not in the `:is(...)` list the recipe applies to,
   and each has its own. Measured in Crystal's preview: checkbox `no ::before`,
   range `no ::before`. Adding the fill there would have been a regression
   against Crystal. The error came from working from a selector list instead of
   from what the browser renders. `Resizable`'s drag handle has no Crystal
   analogue and was left alone.

   Relatedly, "only four surfaces have it" counted loosely: `OverlayArrow` and
   `RichTextSurface` use `--cr-haze-fill` as an element background, which is
   Haze as a material and a different mechanism from the protective layer.
   `NavLink` was the only surface in the library using the `::before` mechanism.

## R-16 · Crystal is a path on a disk, not a dependency

**Requested by Meridian, 19 September 2026. Blocked on publication (see the end
of this entry).**
**The consumer's half of D-10 in the design system's tracker, which holds the
detail, the proposed shape and the steps only Meridian can take.**

This library declares:

```json
"@crystal-ui/core": "file:../crystal-design-system/design-system/core"
```

*(It said `…/design-system` until 19 September, when Meridian asked for the
library's files to be separated from the preview website into their own folder.
The path now points at a directory that is only the library. That is an
improvement, and it is still a path.)*

The declaration is a path on one contributor's disk. It points at a directory
that is at once the design system, its documentation website and its build
machinery. Everything that has gone wrong between the two repositories this week
traces back to it.

There is no version to target. Crystal React cannot say it is built against
Crystal 2.0.1. It resolves whatever is checked out beside it, so a material
token can change under this library with no range to pin, no changelog to read,
and no way to stay on a known-good Crystal while upgrading deliberately. CI
reproduces this: it checks Crystal out at its default branch, which is why
pushing this repository before the design system fails as
`[sass] Undefined variable`. That failure is a defect in neither repository.

A path cannot be cached correctly. This is R-14: Vite pre-bundles it once, and a
change to Crystal's resolver never reaches the served page. It cost three
investigations in one day, one of which was Meridian reporting that Crystal's
specifications were missing from every component. `optimizeDeps.force` is a
workaround for a package manager being asked to treat live source as a release.

A path has no export boundary. This is R-13 and D-9: the drift this library had
could only be found by running two servers and diffing computed styles, because
there is no artefact stating what Crystal's Resin is. Crystal's own website
could also shape a blessed appearance with a stylesheet it does not export,
which no consumer could have matched.

Everything above applies to every other platform library, and is worse there. A
SwiftUI or Compose library cannot install an npm path at all. The Swift and
Kotlin exports are generated and then stranded inside a package only npm can
reach, so those libraries would retype values. CONTRACT §1 forbids that, and the
packaging makes it unavoidable.

What this library needs from the resolution: a published version to depend on, a
range to pin it with, and a local development story so Crystal can still be
edited in the same sitting without going back to a path.

**Answered by Meridian, 19 September 2026**, and recorded in full in D-10. For
this library specifically:

- The dependency becomes `"@crystal-ui/core": "^2.0.0"`, from the public npm
  registry under the `@crystal-ui` scope. The history: D-10
  wrongly called a scope "almost certainly taken" against Meridian's word, then
  "verified" the opposite with a check that could not answer the question. A
  404 on `@crystal/core` proves the package was never published and says
  nothing about who holds the scope, which npm reserves separately. Meridian
  checked directly on 20 September: `@crystal` is taken, and the scope Meridian
  holds is `@crystal-ui`. This library keeps the name `@crystal-ui/react`.
- Local work against an unpublished Crystal uses `pnpm link`, which makes a
  symlink and not a copy, so an edit is live and there is no cache to clear. That
  retires `optimizeDeps.force` in `.storybook/main.ts`, which is R-14's
  workaround and not its cure. The `viteFinal` hook and the comment explaining
  it can go once the dependency is a real one.
- CI stops checking Crystal out beside this repository and installs the
  published version. That removes the push-ordering trap recorded in the
  workflow: pushing this repository first will no longer fail as
  `[sass] Undefined variable`, because the Crystal it builds against will be a
  pinned version and not whatever `main` is at the time.

---
## R-18 · Slice I's twelve components have no stories, so three gates cannot see them

**Found 20 September 2026.**

Slice I added `Portal`, `NavRail`, `Dock`, `BottomNavigation`, `Affix`, `Burger`,
`Pagination`, `Stepper`, `HoverCard`, `Menubar`, `NavigationMenu` and
`FloatingWindow`. All twelve have unit tests (71 between them, all passing) and
none has a story. That is not unusual on its own: 27 story files cover about a
hundred components, so stories were never one per component. It is recorded
because of the gates it removes without any report.

Three of the six gates reach a component by navigating to a story URL, so a
component with no story is not measured at all:

- `scripts/verify-targets.mjs`. Its `CASES` is a hand-written list of story IDs
  and selectors, because a blanket sweep would fail on links in running
  prose. Nothing in it refers to the twelve. `NavRail`, `Dock`,
  `BottomNavigation`, `Pagination`, `Stepper`, `Burger` and `Menubar` all present
  finger targets that the catalogue holds to the 44px floor, and none of them has
  ever been measured. The gate was written for this kind of defect: the tab
  strip shipped at 36px with green unit tests, because jsdom reports every box
  as zero.
- The rendered half of `scripts/verify-theme.mjs`, and the visual frames.

One gate does cover them. `verify-theme.mjs` finds its token names by walking
`src/**/*.scss` on disk, so every `var(--cr-…)` the twelve read is checked
against the published theme. Their token usage is gated. Their geometry and
their appearance are not.

Closing it takes a story for each component that carries a target, added to
`CASES` with the selector and the catalogue line that sets its floor. It should
be done before the count grows again, and as part of R-17, since a new story
written with `render:` args costs nothing extra and a new story written without
them adds to the 79.

**Closed 20 September 2026.** Five story files, covering all twelve. Writing
them turned three gates red on three real defects:

- A collapsed `NavRail` was a 32px-wide target. `.item` carried
  `min-block-size: $cr-action-min-target` and no inline floor, so the label
  gave the row its width, and hiding the label removed the hit area with it.
  Collapsing must not do that. The item now has
  `min-inline-size: $cr-action-min-target` as well, so it is square.
- `FloatingWindow`'s title bar was `<header role="button">`. HTML-AAM does
  not let a sectioning element be overridden into a widget, so axe fails it as
  `aria-allowed-role`. It is a real `<button>` now, with the user-agent's
  styling reset so Crystal's rim is still the bar's only border.
- `Menubar` produced an invalid tree: `button[aria-haspopup]` children under
  `role="menubar"`, with a generic wrapper in between, which fails
  `aria-required-children` twice. The bar sets `role="menuitem"` on its
  triggers and `role="none"` on the wrapper itself, so callers do not have to
  remember. A test pins both, because a role set from a ref callback can come
  undone without any error.

All three were invisible to the unit tests. For two of them the reason was the
same: the element did report the role each test asked for, and the fault was in
the tree around it, which only axe over a rendered story can see. The third
needed a real browser, because jsdom reports every box as zero.

`verify-targets.mjs` gained nine cases and 34 probes, and `LEAST_PROBES` went
from 29 to 63. The old floor was exactly the old probe count, so it would not
have caught a drop until the suite lost a probe it never had.

One correction to the entry as written: it said `verify-theme.mjs` covers the
twelve, and that is true only of its static half. It finds token names by
walking `src/**/*.scss`, so their token usage was gated all along. The values it
reads at runtime come from a rendered story, so that half was in the gap too.

**Closed 21 September 2026.** Every line of the "what changes here on the day
`@crystal-ui/core@2.0.0` exists" list has happened, and each was checked:

| Promised | Where it landed |
|---|---|
| `file:…` → `"^2.0.0"` | `72acb61`, *Consume Crystal as a published package* |
| Remove the `viteFinal` hook in `.storybook/main.ts` | gone; the comment left in its place explains R-14's cure rather than its workaround |
| Document `pnpm link` for cross-repository work | implementation plan §2.5, with `--force` on Storybook for the session and "do not commit the linked range" |
| Drop the sibling checkout from `.github/workflows/verify.yml` | gone; the only surviving mention is the comment recording what its failure looked like |

One correction: this entry said to document
`pnpm link ../crystal-design-system/design-system`. The library is at
`../crystal-design-system/core`, because `design-system/` was the nesting the
restructure removed. The plan documents the real path. The stale path would have
sent a reader to a directory that no longer exists.

The push-ordering trap this entry named was not fixed as such. It went away with
the sibling checkout: there is no order to get wrong, because CI no longer reads
the design system from disk. It installs the same published package a
contributor does.

## R-19 · The control surface is implemented twice, and one of them can go

**Found 21 September 2026. Blocked on `@crystal-ui/core@2.1.0` being published.**

Crystal 2.1.0 ships the Resin interaction surface: the fill, the rim, the
`::before` Haze layer, the `::after` optical sheen, `--cr-control-color` and
`--cr-control-light`, and the reduced-transparency and forced-colours
adaptations of all of it. It also ships `.cr-control`, `.cr-field-shell`,
`.cr-indicator`, `.cr-resin-haze` and `.cr-tag`. Until then it shipped none of
that. The surface lived only in the documentation site's own stylesheet, which
has never been in the package, and `components.md` told a consumer to load it.

That is why this library has its own copy. The copy was not a design decision.
The specification described a surface no consumer could obtain, so the surface
was rebuilt here in SCSS from the same prose. `libraries/CONTRACT.md` §1 exists
to forbid that duplication. The alternative was shipping components that did not
look like Crystal.

Closing it is a judgement for each case and not a sweep. For each place this
library paints a Resin control, decide whether the library's own declaration is
still needed or whether `crystal.css` now supplies it. Some will be needed: a
React component styling a shell that wraps a native input is not the same
problem as a stylesheet styling `button`. Those that are needed should say so.
The rest are a second copy of a specification and drift from the day they were
written.

Do not start before 2.1.0 is installed here. The dependency is `^2.0.0` today.
Deleting a rule this library needs because the library "now ships it" would make
a component stop looking like Crystal in a version nobody is running yet.

The measurement is done for `Button`, and it changes the question. On
24 September 2026, against 2.1.0 installed, a computed-style diff was taken
between this library's `Button` and a `.cr-button.primary` planted into the same
page. They agree on background, colour, radius, border, padding, box-shadow,
backdrop-filter, the `::before` reading pad and the `::after` sheen, which is
everything the Resin recipe is made of. They differ on two properties:

| | this library | core 2.1.0 renders |
| --- | --- | --- |
| `min-height` | 44px | 48px |
| `font-weight` | 700 | 750 |

Both differences come from core disagreeing with itself, and neither is drift in
this library. `.cr-button` in `@layer crystal.reset` sets 44px and 750.
`:is(button, a.cr-button)` in `@layer crystal.component` sets 48px, and a later
layer wins regardless of specificity, so the reset rule never renders. The
published token says 44px, this library reads it, and the web preview has always
drawn 48px. That is filed against the design system as D-20, and R-19 should not
move until it is answered, because adopting a value that core's own token
contradicts would be adopting the bug.

Meridian chose the gate over the sweep on 24 September 2026, and the gate is in.
`verify:appearance` renders one of this library's buttons and one of Crystal's
into the same page under the same theme and requires them to agree across
eighteen properties: the whole Resin recipe plus the geometry the catalogue
names. A rule added to either side that the other does not have fails there, on
the property, with both values printed. 48 checks became 49.

The two differences it found on its first run are closed. The `font-weight` was
this library's, and 750 is adopted. It is a literal on both sides, because
Crystal publishes `radius`, `minTarget`, `padding*`, `gap` and `disabledOpacity`
for an action and no weight. It is the one action value that cannot come from a
token yet, and it needs one. The `min-height` was D-20, now answered at 48px in
core and awaiting a release. It is the gate's single exception, written as the
exact pair `44px` against `48px` so that it stops applying as soon as either
side moves.

That exception was too broad on the first attempt, and planting showed it.
Written as "the library differs from Crystal's 48px" it also excused a
library button that had drifted to 60px for reasons of its own. An exception
that wide would have covered the next defect.

The sweep was not chosen, and it is still open. Having components wear
Crystal's class names as well as their own would make core the painter and leave
this library only what is genuinely React-shaped, and it remains the better end
state. It is a change across roughly twenty components that alters what ships.
It belongs with the larger extension of Crystal's component recipes and should
not come ahead of it: most of what this library implements is outside the scope
of what Crystal has recipes for, and the recipes should be decided before the
painter.

The premise was that this library carries a second copy of a surface core now
ships, and that one of them can go. It cannot go by deletion: this library's
components render `<button class="_button_hash">` and core's control surface is
keyed on `.cr-button`, so deleting the library's rules leaves the components
unpainted, and they do not fall through to Crystal's. There are two options. The
first is to have components wear Crystal's class names as well as their own,
which makes core the painter and leaves this library only what is genuinely
React-shaped. The second is to keep both and add a gate that diffs them so they
cannot part. The first is a sweep across roughly twenty components and changes
what ships. The second is cheap and catches the next D-20 automatically.

Measure first, as D-11's third divergence finally was: render a story with and
without this library's own control CSS, against 2.1.0, and diff computed style.
A static read of two stylesheets could not answer the same question about the
preview, and it will not answer it here, because the library's
`@layer crystal.component` and this library's CSS modules do not compete
textually.

---

**Closed 24 September 2026, by the sweep, at Meridian's direction.** "Perform the
R-19 sweep and undo the gate we chose, as we had meant the sweep initially."

Measurement showed that the premise above is wrong. It says core's control
surface is keyed on `.cr-button`, so a component rendering
`<button class="_button_hash">` cannot fall through to it. Crystal's Resin recipe
is keyed on the element:

    :is(button, a.cr-button, .cr-control, .cr-field-shell, .cr-resin-haze, .cr-status)

A bare `<button>` with no class, planted beside this library's in the same page,
already resolves to the Resin fill, the rim, the float shadow, the 20px backdrop
blur, `position: relative`, `isolation: isolate` and both feathered
pseudo-layers. A bare button lacks the geometry, and the geometry is what
`.cr-button` adds. Deleting the library's rules would not have left the
components unpainted. It stops this library painting over a coat that was
already there.

The class going on is not enough by itself, and that half of the reasoning held.
A module class is unlayered and Crystal styles inside `@layer crystal.component`,
so the duplicate has to come out as the class goes in. Both were done for each
component, and each was measured against a planted Crystal element, with the
target at zero differences and a plant pass to prove the zero could move.

The sweep found more than it removed.

- Every `<button>` in this library that declared itself transparent was
  transparent in exactly one property. Crystal paints the coat by element, so
  `background: transparent` takes off one layer of five and leaves the backdrop
  blur, the float shadow and both feathered layers. Across all 488 stories there
  were eighteen distinct controls and a hundred and twenty-seven instances,
  every one leaking all four: accordion triggers, tree chevrons, quantity
  steppers, chip remove buttons, calendar navigation, the dismiss button of all
  four feedback surfaces, carousel indicators, table sort headers and chart
  legend toggles. Closed with one `bare-control` mixin, because Crystal has no
  recipe to adopt. `.cr-button.quiet` keeps the Resin shell and drops only the
  reading pad, which is what makes a quiet button quiet, and none of these is a
  Resin control that has been quietened.
- The Select was the only field in a form of five with no fill.
  `field.trigger` included `field.control`, whose `background: transparent` and
  `border: 0` are right for a control inside a shell and wrong for one that is
  the shell. One class was doing both jobs, and they are separate now.
- The sweep resolves D-20 for each control it reaches. A swept control stops
  reading `action.minTarget` and starts wearing the class, so it renders
  Crystal's 48px without waiting for the core release. Every control still at
  44px is one the sweep has not reached, and `verify:targets` cannot see it,
  because its floor is exactly 44px.
- `line-height` was 25.6px against Crystal's 20.8px, from `font: inherit`
  resetting a value core sets. The gate could not have caught it, because
  `lineHeight` was not among the eighteen properties it compared.

What the library kept answers what "genuinely React-shaped"
means here: the motion engine's transform origin, the card radius Crystal
documents in prose but publishes no rule for, reduced transparency for a control
(Crystal flattens its containers and carries no control rule), the forced-colours
system pair, and the ink for a quiet toggle that is on. Crystal tints a reading
pad and a quiet control has none.

The gate is gone, and `verify:appearance` is back to 48 checks. It was kept
until last because it was the instrument each component was proved through,
and removing it first would have removed the evidence. Its D-20 exception went
unused from the first swept component onward, as it was written to.

The sweep did not reach every surface. Crystal has no recipe for a floating
Resin panel, so `FloatingWindow`, `Toast`, `Notification` and `MediaControls`
keep `material.resin` on their shells. It has none for a navigation link, so
`NavLink` keeps a weight of 550 that `.cr-button`'s 750 would destroy, and none
for a nav rail item or a drag handle. Those are recipes to author in core,
not classes to wear here (`extend-crystal-not-the-library`), and they are the
larger extension that this entry said comes first. The field family is the other
part the sweep did not reach: seventeen components reach `.cr-field-shell`'s
recipe through `field.shell`, which re-declares it by hand under a comment that
correctly says Crystal owns it.

## R-21 · No chart has an enter motion, and the catalogue asks three of them for one

*(Opened 23 September 2026, closing out slice K.)*

**What is missing.** `core/tokens/catalogue/10-charts.json` lists "enter motion"
on `bar-chart` and `pie-chart` and "draw-on motion" on `line-chart`. None of the
twenty-four components has any. Every chart in this library appears fully drawn
in one frame and stays that way.

**Why it was left.** Crystal has no recipe for it. `core/docs/motion.md`
publishes fifty-four recipes, and none of them is a mark growing from a baseline
or a path drawing itself. `--cr-motion-*` carries durations and easings, and
nothing that says how long a hundred bars should take between them or whether
they stagger. `extend-crystal-not-the-library` forbids inventing that here. A
badly invented recipe is also worse than none: in a chart, motion is read as
data, and a bar that eases past its value before settling has shown the reader a
number that is not true.

**The deferral is deliberate.** It is consistent with the rest of Crystal 2.0:
nothing moves at rest, and a chart that has finished drawing is at rest. The
only thing missing is the one-shot motion a person starts by causing the chart
to appear.

**What it is not.** It is not an accessibility gap. `prefers-reduced-motion`
already resolves to "no motion" here. Every value is on its mark and in the
table, and no state in any chart is carried by movement.

**Closing it needs** the recipe authored in core first: a named enter for a
mark, with a duration, an easing, a stagger and a stated maximum number of marks
past which it does not stagger at all. After that it needs one implementation
here that every chart composes, and a `verify:behaviour` check that it is gone
under `prefers-reduced-motion: reduce`.

**Closed 28 September 2026.** Meridian adopted the recipe this entry asked for,
in core: `mark-in` (Crystal 2.2.0). A mark grows from its baseline when a chart
first appears. It takes 500ms, staggered 24ms per mark up to 24 marks and all
together past that. It declares `overshoot: "never"`, so Crystal fits it
critically damped whatever its material. The reasoning behind the deferral makes
that a requirement.

There is one implementation, `src/charts/useMarkArrival.ts`, composed by
`BarChart`, `LineChart` and `PieChart`. Marks carry `data-mark-in` and their
baseline as `transform-origin`. The baseline is the zero line for a bar or a
series (the floor of the plot when zero is not in it) and the centre for a
segment. The arrival plays once, on the first render that has marks in it, and
never when the data changes.

`verify:behaviour` holds it, measured frame by frame with the page's animation
clock slowed tenfold. Every bar keeps one edge on the zero line (a bar below
zero keeps its top), no mark is ever drawn past its value, the last one is held
at its first frame until its turn, and under `prefers-reduced-motion: reduce`
every mark is at its value from the first frame. Each was planted red (an origin
at the top of the plot, the reduced-motion branch removed) except the third. The
third stayed green with this library's own code for it removed, because Motion's
`fill: both` already holds a delayed mark at its first frame. The code was
deleted and the check kept for what it guards.

## R-22 · The catalogue asks the quantity stepper for a role React Aria removes

**What the catalogue says.** `core/tokens/catalogue/12-commerce.json`, on
`quantity-stepper`: "**A spin button**: the value is typable, and the bounds are
announced when reached."

**What ships.** `QuantityStepper` is not a spin button. It is built on React
Aria's `NumberField`, which computes the spin-button props and then strips every
one of them before they reach the input:

```js
// override the spinbutton role, we can't focus a spin button with VO
role: null,
'aria-roledescription': !isIOS() ? stringFormatter.format('numberField') : null,
'aria-valuemax': null,
'aria-valuemin': null,
'aria-valuenow': null,
```

That is `@react-aria/numberfield`'s own source and its own comment. It was read
from the package and was not inferred from the rendered output. The input that
arrives is an ordinary text input with `inputmode="numeric"` and
`aria-roledescription="Number field"`, whose value is read as its text.

**Why it is not only a defect here.** React Aria's reason holds: a `spinbutton`
cannot be focused with VoiceOver, so honouring the catalogue's wording would
produce a control that some readers cannot reach at all. Trading reachability
for a role name is not an improvement, and "material specifications may improve,
never regress" applies to the accessible surface as much as to the visual one.

**What it costs, and what was done about it.** Stripping `aria-valuemin` and
`aria-valuemax` takes the bounds off the control entirely, so the primitive
cannot deliver the second half of the catalogue's sentence, "the bounds are
announced when reached", either. The component announces them itself, in a
polite live region, on a change and not on mount. That part is implemented. Only
the role is absent.

**Where it also matters.** `NumberInput` has the same primitive underneath and
the same absence. Until this was found, its header claimed the opposite: a stale
sentence asserted `aria-valuenow`, and nobody had checked it against the
rendered output. That header misled the author of this component.

**Closing it needs a decision from Meridian.** No change here closes it. Either
the catalogue's wording moves to what an accessible number field is, a typable
numeric field whose bounds are announced, or Crystal states that the role is
required and accepts what it costs on VoiceOver. The first is very likely right,
but it is a change to a published specification, and this library cannot make
one by shipping something else and saying nothing.

**Closed 28 September 2026.** Meridian ruled for the reachable control. Crystal
2.2.0's catalogue describes `quantity-stepper` as "a typable numeric field: the
value is read as its text, and the bounds are announced when reached. Not
role=spinbutton", and `number-input` the same way. The old sentences are quoted
in Crystal's `tools/extend-catalogue-5.cjs`. Nothing changed here, because this
library already shipped what the catalogue now says. The headers of both
components record the ruling in place of the disagreement.

## R-17 · Storybook has almost no Controls, no Actions and no Interactions

**Ruled 29 September 2026:** the compiler-checked `ariaArgTypes` table is the answer, and R-17 closes. See [`2026-09-29-rulings.md`](https://github.com/boomerbowser/crystal/blob/main/proposals/2026-09-29-rulings.md) in Crystal.

**Reported by Meridian, 19 September 2026. Largely closed 19 September 2026; one
part deliberately left open and named below.**
**Severity: high. This is the review surface, and three of its four panels are
empty.**

Meridian opened the Tab Strip story and Storybook said:

> This story has no controls. Storybook couldn't find or generate any controls
> for this story. Define `args` or `argTypes`, or configure docgen to let
> Storybook generate controls automatically.

The problem is wider than that story. Counted across the library:

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

So the Controls panel is empty or near-empty for most of the library, the
Actions panel is empty for all of it, and the Interactions panel has nothing to
run anywhere.

### Why there are no controls

There are three causes, and they stack.

**1. Eight story files declare no `meta.component`.** Without it, docgen has
nothing to read and Storybook cannot generate a single control, which is the
message above. All eight are files written in the last two days: `Links`,
`Palette`, `Panels`, `Overlays`, `Navigation`, `Hierarchies`, `Form`, `Parity`.
The Tab Strip in Meridian's screenshot lives in `Navigation`.

An earlier count of "27 files with `component:`" was wrong. It matched
`docs: { description: { component: … } }`, which is a documentation string and
not a component reference. The real count is 19.

**2. Almost every story is a `render:` closure.** There are 79 of them. A
closure that takes no arguments cannot be driven by args, so even where
`meta.component` is set and docgen produces argTypes, moving a control changes
nothing on screen. The stories were written to demonstrate a component and
cannot be operated, which is half of what a review surface is for.

**3. No `argTypes` anywhere.** Docgen can infer a type from a prop's TypeScript
signature. It cannot infer the intent: which props deserve a control, what a
sensible range is, which belong in a "Material" group rather than beside
`className`. Nothing in the library says.

### Why there are no actions

No story imports `fn()` from `storybook/test`, and no `meta` sets
`argTypes: { onPress: { action: 'onPress' } }`. Every callback Crystal React
exposes (`onPress`, `onAction`, `onSelectionChange`, `onOpenChange`,
`onExpandedChange`, `onNavigate`, `onSubmit`) fires into nothing a reviewer can
see. The library's job is behaviour, and the panel that shows behaviour
happening is blank.

### Why there are no interactions

There are zero `play` functions, and `@storybook/addon-vitest` is not installed.
In Storybook 10 that addon supplies the Interactions panel and its step-through
debugger. The panel Meridian saw is present and will always be empty.

This one compounds a gap already recorded. R-10 and R-11 exist because jsdom
cannot answer questions about geometry, layout or resolved colour. A `play`
function runs the same interaction in a real browser, and would let a reviewer
watch focus containment, arrow-key movement through a tree, or a drawer's
modality. Those are the behaviours whose unit tests were found to be checking
nothing.

### The environment controls are the wrong shape

The toolbar added yesterday carries every axis Crystal's own "Make it yours"
panel has, but as dropdown lists of discrete values. Crystal's panel is
continuous. Meridian's screenshot is the specification:

| Crystal's control | Shape | Range | Currently |
|---|---|---|---|
| Product palette | Swatch row, six circles, active ringed | six palettes | dropdown |
| Appearance | Segmented: Light / Dark / Auto | three | dropdown, and **no Auto** |
| Color atmosphere | Slider with live `%` | 15 to 90 | dropdown of four |
| Frost base tint | Slider with live `%` | 35 to 85 | dropdown of three |
| Elevation | Slider with live `%` | 60 to 150 | dropdown of four |
| Corner radius | Slider with live `px` | 14 to 28 | dropdown of three |
| Content density | Segmented: Comfortable / Compact | two | dropdown |
| Typeface | Select with a preview toggle | `manrope`, system | **absent** |
| Animation speed | Slider with live `×` | 0.25 to 2 | dropdown of four |
| Reduce motion | Checkbox | boolean | dropdown of `true`/`false` |
| Reduce transparency | Checkbox | boolean | **conflated with `effects`** |

Two of those are more than cosmetic. Typeface is missing entirely: the resolver
takes `s.font` and `preferences.js` clamps it, and neither the provider nor the
toolbar exposes it. Reduce transparency is a different axis from `effects`:
`effects: opaque` is a Crystal scheme value, while reduced transparency is a
user preference the provider reads from `prefers-reduced-transparency`. The
toolbar currently offers the first and calls it the second, so a reviewer cannot
simulate the media query the library branches on.

**A constraint.** Storybook's `globalTypes` toolbar supports only discrete
`items`. It has no slider, no swatch row and no checkbox. Matching Crystal's
panel means either a custom Storybook addon with its own panel, or surfacing the
environment as per-story args with `control: { type: 'range' }`, which renders
real sliders in the Controls panel.

The second is probably right. It is cheaper, and Meridian asked on 19 September
for the environment options to be "available per-component to test with and
against", which args are by construction. The toolbar would stay for taking any
story through an axis quickly. Args would give the sliders, the live values and
a fixed environment a gate can measure.

### What closing it needs

1. `meta.component` on the eight files missing it.
2. `args` and `argTypes` per component. Every prop that is a real choice gets a
   control, grouped, with ranges where Crystal states one. The `render:`
   closures become arg-driven so moving a control moves the component.
3. `fn()` spies on every callback, so the Actions panel shows what fired and
   with what.
4. `@storybook/addon-vitest`, and `play` functions on the stories whose subject
   is behaviour: focus containment in a modal drawer, arrow-key movement in a
   tree, type-ahead in the command palette, the scroll spy.
5. The environment as args with the shapes above, plus the two missing axes:
   typeface, and reduced transparency as its own preference.
6. A gate. This is the third time a review surface has been broken in a way no
   check could see. The gate requires that every story file declares a
   `meta.component`, that every component with callbacks has action args, and
   that no story is render-only unless it says why. It is a count in CI that
   only ever goes up.

**Confirmed by Meridian, 19 September 2026**, with a second screenshot: the Tab
Strip story with the Controls panel open and reading "This story has no
controls". Their words: "this is where and what we were talking about in terms
of how Crystal's controls should be translated to Storybook". That settles the
destination. Crystal's "Make it yours" axes belong in the Controls panel, as
per-story args, which is the second of the two options weighed above, and not in
the toolbar. The toolbar stays for sweeping one axis across many stories.


### Closed

| | before | after |
|---|---|---|
| Files declaring a real `meta.component` | 19 of 27 | **26 of 27** |
| Files with `argTypes` | 0 | **10** |
| Stories with a `play` function | 0 | **4** |
| Callbacks wired to the Actions panel | 0 | **12** |
| Stories run as tests in a browser | 0 | **92** |
| Total tests | 466 across 82 files | **558 across 109** |

**The environment is in the Controls panel, declared once.**
`.storybook/environment.ts` carries every axis of Crystal's "Make it yours"
panel with the right shape: sliders for atmosphere, Frost tint, elevation,
radius and animation speed, an inline radio for the palettes, and checkboxes for
the two reduction preferences. `preview.ts` declares it for every story, so it
is per-component without twenty-seven authors having to remember it. Every range
and choice is read from Crystal's own `RANGES` and `CHOICES`. Typing `min: 15`
here would be the CONTRACT §1 defect this library exists to avoid.

The decorator honours an environment arg only once it differs from the story's
`initialArgs`. Every story now carries the whole environment, so
`args.atmosphere` is always set. Reading it directly would make args win
permanently, and the toolbar would have stopped working the moment this shipped.

**The two missing axes are added.** Typeface did not exist anywhere in this
library: Crystal has supported `font: manrope | system` since the headless core
was written, and the provider never forwarded it, so a product asking for the
system face got Manrope with no error. Reduce transparency is now its own
control, separate from the product's `effects`, and its description says what it
can and cannot do. It resolves the provider the way the real preference does. It
cannot make a media query true, so the stylesheets' own
`@media (prefers-reduced-transparency: reduce)` branch stays a browser gate's
job. Appearance also gained `system`, which `CrystalModePreference` has allowed
all along.

**The Interactions panel exists and runs in CI.** `@storybook/addon-vitest` is
installed, and `vitest.config.ts` is split into two projects: `unit` in jsdom,
`storybook` in a real Chromium. All four `play` functions this entry asked for
are written: the tab strip's arrow keys, the tree's arrow keys and collapse, the
palette's type-ahead and focus containment, and the drawer's modality in both
directions.

Running the stories as tests also executed `addon-a11y`'s `test: 'error'`, which
had been configured for some time and never run. It failed five things on its
first pass. All five were real, and they are fixed in the same commit:
`ColorPicker` rendered nothing at all (an RGB colour handed to a saturation
channel); `AppShell` shipped a `<main>` no keyboard could scroll; the scroll-spy
story hand-rolled the same defect; `ColorPicker`'s hex field had no accessible
name; and the typography story jumped from a level-two heading to a level-four.

**The gate.** `scripts/verify-stories.mjs` is a ratchet over `meta.component`,
`args`, `argTypes`, `play` functions and action args, plus the one line in
`preview.ts` that puts the environment on every story. It was seen to fail
before it was trusted: stripping `meta.component` from `Button`, renaming the
tab strip's `play`, and removing `args: environmentArgs` each fail it, and
restoring each returns it to green. `Parity` is exempted by name, not by
pattern, because it renders one specimen per material and has no component to
point docgen at.

Two gates needed repair once the stories became real. Both had been brittle, and
neither had been wrong. `verify-behaviour` found the scroll column with
`[style*="overflow"]`, which only worked while the story set it inline. It now
finds the column by asking the page what scrolls. `verify-theme` clicked open a
palette the story's own `play` function had already opened. It now opens one
only if none is there.

### Left open, deliberately

### Item 2, closed 21 September 2026, and its premise was wrong

This entry said 79 `render:` closures ignore their args and asked for all of
them to be converted, calling the job "mechanical but not small". Counted
properly, the premise does not hold.

Of the 69 no-arg closures left, only 15 render exactly one instance of their own
`meta.component`. The other 54 are **compositions**: a tab strip beside a
segmented control, the same destinations in three shells, seven gaps of the
spacing scale at once, a card inside a Resin frame to show the recess. The
subject of a composition is the relationship between its parts, so it is not a
story you drive by args. Giving one of several components live controls would
make it disagree with its neighbours while a reviewer watched. Converting all 79
would have been 54 changes for the worse.

Ten of the fifteen are converted: `Card/InsideResin`, `Container/Shell`,
`Container/ReadingColumn`, `Divider/Plain`, `Toolbar/Vertical`,
`Watermark/Marked`, `Tabs/WithADisabledTab`, `TreeView/Files`,
`TreeView/Keyboard` and `Watermark`'s text. The remaining five are compositions
that happen to contain one instance, and each now carries a written reason.

**The gate.** `verify-stories.mjs` fails a story that renders exactly one of its
own `meta.component`, hard-codes its props and takes no args. Such a story has a
Controls panel that moves nothing, which is the complaint this entry opened
with. The gate is not a floor, because a floor lets this get worse one story at
a time. Exceptions go in `RENDER_ONLY_BY_DESIGN` with a sentence saying why the
story is a composition rather than a subject. An entry naming a story that no
longer exists fails too, so an exemption cannot outlive its story and silence a
real finding later. Both halves were proven by mutation.

### What is left of R-17, which is not this

The docgen constraint below is unchanged. It is the reason the other half of a
Controls panel, a component's own props and their descriptions, is still
hand-written. `.storybook/react-aria.ts` closed the inherited half on 21
September. Everything still outstanding on this entry is waiting on an extractor
that runs on TypeScript 7.

### The docgen constraint, 21 September 2026: both routes measured and closed

This entry previously said the Storybook uses `react-docgen` rather than
`react-docgen-typescript` "because the latter builds a TypeScript program
through a plugin that does not support TypeScript 7". The conclusion was right
and the reason was wrong. Both halves have now been tried, where before they
were inferred.

**What the current extractor returns.** Run the way `@storybook/react-vite` runs
it, which is `parse()` with `makeFsImporter()` (the preset does pass it),
`react-docgen` reports five props for `Button`:
`children, variant, shape, className, style`. It does not report `onPress` or
`isDisabled`. It reads a component's own interface and does not resolve
`extends Omit<AriaButtonProps, …>`. An importer does not change that: the
importer follows module imports, and this is a type relationship into a `.d.ts`.

**Route 1: `reactDocgen: 'react-docgen-typescript'`.** The plugin is not what
fails. `react-docgen-typescript@2.4.0` evaluates `ts.JsxEmit.React` at module
scope, and TypeScript 7's main entry exports exactly two things, `version` and
`versionMajorMinor`, because the compiler API moved behind
`typescript/unstable/*`. It throws
`TypeError: Cannot read properties of undefined (reading 'React')` on `require`,
before any option is read.

**Route 2: pin TypeScript 5.x for those packages only.** `typescript` is a peer
of both `react-docgen-typescript` and the Vite plugin, auto-installed from the
root. pnpm's `overrides` and `packageExtensions` both act on dependency
resolution and not on peer resolution. After each attempt `node_modules/.pnpm`
still held one TypeScript, `7.0.2`, and both packages still resolved to it.

**Writing our own extractor** is closed by route 1's cause: there is no stable
compiler API in TypeScript 7 to write it against.

### What was done instead

`.storybook/react-aria.ts` describes the inherited props once, with the compiler
supplying the link docgen cannot. The design rests on one observation: `tsc`
does resolve `extends` even though docgen does not, so
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
  `Button` fails to compile, and the error enumerates the real surface, so
  filling one of these in is a matter of reading what `tsc` printed.
- **Refuses to let one be forgotten.** Every prop must be mentioned, and `false`
  is the deliberate omission. A control cannot go absent unnoticed, which is the
  complaint in this entry.

Both were verified by mutation. `IconButton.label` was found this way: the
compiler demanded it, and for an icon-only button that prop is the accessible
name.

The nine hand-declared action args moved into it. That removed a repeated
`{ action: 'onPress', table: { category: 'Events' } }` from nine files and
raised the real count from 15 to 17, because the migration also switched on
callbacks the stories had never declared.

**One gate had to be repaired to see that.** `verify-stories.mjs` counted action
args by matching `action: '` and `: fn()` in story files. Moving the
declarations into a shared table made that count fall from 15 to 6. The ratchet
reported a reduction in the thing that had just increased, because it counted
how a declaration was spelled and not what was declared. It now also counts
event props switched on through `ariaArgTypes`, reads the callback list from
`ARIA_EVENTS` in the table rather than keeping a second copy, and refuses to run
at all if it reads fewer than nine names out of it. It refuses because the
failure that mattered was finding none and blaming the stories, more than a
wrong count. The first version of that reader was itself wrong: it matched seven
of nine, because a lazy regex over one single-line entry swallowed the two after
it. That is why the list is a flat array and is not inferred from the table's
shape. The table asserts at load that the array and the `Events` category agree
in both directions.

`ariaArgTypes` is narrower than real docgen in one way: it can refuse a claim,
but it cannot discover one. Nothing tells a story that `Button` has `onPress`
until somebody writes it and `tsc` agrees. Discovery comes back the day either
route above opens.

---

**Closed 29 September 2026, by Meridian's ruling.** The compiler-checked
`ariaArgTypes` table in `.storybook/react-aria.ts` is the answer, and is not a
stand-in for one. `tsc` refuses a prop the component does not have and refuses
one left unmentioned, which is the half of docgen that matters for a review
surface. Discovery, which is Storybook finding an inherited prop nobody wrote
down, returns if an extractor ships that runs on TypeScript 7. Nothing waits on
it.

## R-25 · `Indicator` is a colour dot, and Crystal's `.cr-indicator` is a glyph its host decides

**Ruled 29 September 2026:** adopt `.cr-indicator` with `data-kind` and replace the `state` API, once D-27 (b) is published. See [`2026-09-29-rulings.md`](https://github.com/boomerbowser/crystal/blob/main/proposals/2026-09-29-rulings.md) in Crystal.

*(Opened 28 September 2026, found by the per-surface check.)*

The catalogue names `Indicator` and `Timeline` as the `indicator` surface, and
no component here wears `.cr-indicator`. Planted beside this library's mark, the
two differ in ten of twenty-three properties. The cause is not drift: they are
different designs.

- **This library's** is a 20px Resin disc, 24px on a field, whose fill colour is
  the state: primary for selection and current, muted for busy, attention for
  required, danger for invalid. It is set by a `state` prop.
- **Crystal's** is a 20px Haze disc with a 1px feathered fill, positioned at its
  host's top end corner, carrying a glyph: ● for current, … for busy, and on a
  field ○ idle, ● focused, * required, ! invalid. It is shown or hidden by the
  host's own state (`[aria-current] > .cr-indicator[data-kind=current]`,
  `[aria-busy=true] > …[data-kind=busy]`), and the selection kind is never
  shown, because selection is weight.

Crystal's is the better design on this library's own terms: shape rather than
colour carries the state, and the host's semantics decide the mark rather than a
prop that can disagree with them. Two things stop adopting it as written:

- Its field glyphs are keyed on `span.cr-field-shell`, and every field shell
  here is a `div` (a `span` cannot hold the field's block content). Filed as
  Crystal's D-27.
- `state="selection"` would render nothing at all, which is correct under
  Crystal's rule and a breaking change to anyone passing it. The prop should be
  removed, so that it does not silently draw nothing.

Closing it: wear `.cr-indicator` with `data-kind` from the host's semantics,
remove the `state` prop's colour vocabulary and `selection`, and take the field
glyphs once D-27 lets them reach a `div` shell.

**Closed 29 September 2026, on Crystal 2.3.0.** Meridian ruled that the library
adopts Crystal's indicator and replaces its own API. `Indicator` is now
`<span class="cr-indicator" data-kind>` with the kinds Crystal draws (`current`,
`busy`, `field`), shown or hidden by its host's own state. The `state` prop, its
colour vocabulary, the `selection` kind and the component's stylesheet are gone.
The field glyphs reach a `div` shell because D-27 was ruled the same day and is
in 2.3.0. `verify:appearance` checks the relationship on the vocabulary story:
each mark shows the glyph its host calls for and nothing on a host without the
state. It was seen red with a host's `aria-busy` taken away.

## R-26 · Adopt Crystal 2.3.0 when it is published

**Ruled 29 September 2026:** the day's Crystal rulings fold into 2.3.0; it is tagged from here once green and adopted here in one pass. See [`2026-09-29-rulings.md`](https://github.com/boomerbowser/crystal/blob/main/proposals/2026-09-29-rulings.md) in Crystal.

*(Opened 29 September 2026.)*

Crystal 2.3.0 is prepared and not yet tagged. It carries two things this library
has been standing in for, and one of them would collide with the stand-in:

- **The navigation entry's location dot** (D-22). `.cr-nav-item` draws it from
  2.3.0: a flat primary mark on `aria-current`, inside the entry's own padding.
  `NavLink` draws its own, in a slot of its own, because 2.2.0 did not. Under
  2.3.0 both would draw and the current link would show two dots.
- **`component.overlay.tooltipRadius`**, 18px, which `Tooltip.module.scss` holds
  as a literal (`$tooltip-radius`, allowed with the catalogue's words beside
  it).

So the dependency range is `~2.2.0` rather than `^2.2.0`. A caret would let a
fresh install take 2.3.0 the day it is published, under a `NavLink` that has not
yet let go of its dot. `src/styles/coreVersion.test.ts` also has a ceiling (the
R-20 pattern) that fails the day 2.3 is installed regardless, and names these
steps.

**Closing it**, once `@crystal-ui/core@2.3.0` is on the registry:

1. The range to `^2.3.0`; `pnpm install`; `pnpm run build:tokens`, which brings
   `$cr-overlay-tooltip-radius`.
2. `NavLink` removes its `.dot` element, its reserved slot and their
   forced-colours rule, and says in its header that the dot is Crystal's. Its
   tests assert the dot on `aria-current` through the class (present on the
   current link, absent on a selected one) rather than through the element.
3. `Tooltip` reads `$cr-overlay-tooltip-radius` and drops the literal.
4. The ceiling test goes; the floor moves to 2.3 if anything here then depends
   on it (the dot does).
5. Every gate, `verify:appearance` with `VERIFY_PLANT_RED=1`, and a look at the
   navigation stories in both directions and under forced colours.

**Closed 29 September 2026.** Crystal 2.3.0 carries the rulings of that day as
well as D-22's dot and the tooltip token, and was verified here twice. The first
time it was packed from core and swapped into `node_modules` before it was
tagged. Every gate was green, which is also what cleared the tag. The second
time was on the published package, whose tarball is identical to the packed one.
The range is `^2.3.0`, NavLink draws no dot of its own, Tooltip reads
`$cr-overlay-tooltip-radius`, and the ceiling in `coreVersion.test.ts` is gone
with the floor at 2.3. The same adoption put the strips, the group, the dialog
body, the recessed overlay, the count badge and the indicator on Crystal's
classes (R-25).
