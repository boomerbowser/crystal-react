# Open issues — Crystal React

Things noticed during implementation and deliberately not fixed yet, so they are
not carried in anybody's head. Each says what is wrong, why it matters, where it
is, and what closing it would take.

Ordered by consequence, not by discovery. Nothing here is blocking the slices in
`implementation-plan.md`; several would be fixed most cheaply *as part of* a later
slice, and that is noted where it applies.

---

## R-0 · Everything visual before slice G was reviewed without Crystal's materials

**Not a defect any more — a caveat on the evidence.**

`-webkit-backdrop-filter` was written by hand beside `backdrop-filter` in every
stylesheet that used it. The build pipeline — autoprefixer followed by esbuild's
CSS minifier — then collapsed the pair and kept only the prefixed one, and
Chromium does not understand the WebKit alias, which is Safari's. So Frost and
Resin rendered as flat translucent fills with no diffusion at all, in every
story, from the first component to slice F.

Reproduced directly rather than inferred. Two rules built through the real
pipeline, one writing both properties and one writing only the standard:

```
._probe_…        { -webkit-backdrop-filter: blur(40px) saturate(125%); background: red }
._onlyStandard_… { -webkit-backdrop-filter: blur(40px) saturate(125%);
                   backdrop-filter: blur(40px) saturate(125%) }
```

Autoprefixer alone does not do this — running it over the same declaration keeps
both. It is the pair that is fatal.

Fixed in slice G: the library writes the unprefixed property once and lets
autoprefixer add the prefix. But every visual judgement recorded before that was
made against a Crystal without its materials, and the screenshots in earlier
commit messages show that state. Worth a pass over the finished components with
the materials actually on.

---

**The pass is done, and it found one.** `Select`'s trigger is one element
carrying both the shell and the control, and `control`'s `border-radius: inherit`
— which exists so an input inside a well does not square off — reached past the
shell to the field, which has no radius. The trigger rendered with square corners
while every other field in the library was a 28px well. Nothing in the tests
could see it; `border-radius` is geometry, and jsdom has none.

Fixed by giving the combination its own mixin, `field.trigger`, which is
`control` without the inherited radius. `Cascader` was doing the same thing and
is moved onto it too.

Everything else surveyed with the materials on — buttons, comboboxes, the scroll
areas, cards, the temporal family, the dialog over its Mirage scrim — renders as
intended. One false alarm worth recording: a dialog screenshot taken two seconds
after opening looked washed out and blurred. It was a frame of the entrance
animation, which is a second long. The settled state is crisp.

## R-1 · A slider's unit is shown but not announced

**Severity: high — the component's own comment claims otherwise.**

`Slider`'s `formatValue` reaches the visible output and does **not** reach
`aria-valuetext`. Confirmed: a slider with `formatValue={(v) => \`£${v}\`}` at
2400 renders `£2400` on screen and announces `2,400`.

That is precisely the failure `Slider.tsx` says it prevents — "a number without
its unit is the difference between a usable control and a guess" — so the code
and its documentation currently disagree, which is worse than either being wrong
alone.

`src/components/Slider/Slider.tsx`. React Aria derives `aria-valuetext` from its
own `formatOptions`, so the fix is to pass `formatOptions` through rather than
formatting in the render, or to set `aria-valuetext` on the thumb explicitly. The
existing test asserts only that `aria-valuetext` is non-empty, which is why it
passes — it should assert the unit appears in it.

**Closed.** `formatValue` replaced by `formatOptions`, which React Aria uses for
both the visible output and `aria-valuetext`, so the two cannot drift. The test
now asserts the unit appears in the announcement rather than that the attribute
is non-empty — the weakness that let this through.

## R-2 · Two mask inputs with the same mask share an id

**Severity: high — the second field's label points at the first field.**

`MaskInput` falls back to `` `mask-${mask.length}-${name ?? 'field'}` `` when no
`id` is given. Two phone fields on one form with no `name` both get
`mask-14-field`, so both `<label for>` attributes resolve to the first input:
clicking the second label focuses the first, and a screen reader announces the
wrong name.

`src/components/MaskInput/MaskInput.tsx`. `useId()` is the fix; the fallback
predates noticing that `react-imask` accepts an `id` fine.

**Closed.** `useId()`. The test renders two unnamed phone fields and asserts
their labels resolve to different inputs.

## R-3 · `AngleSlider` and `Knob` are unnamed when the label is not a string

`aria-label` is set only when `label` is a `string`, so `<Knob label={<>Gain</>}>`
produces a `role="slider"` with no accessible name. Every other component in the
library handles this by rendering a visually-hidden real label.

`src/components/AngleSlider/AngleSlider.tsx`. Same pattern as
`SegmentedControl`'s `labelHidden`, which already does it correctly.

**Closed.** `aria-labelledby` pointing at the label already on screen, so any
`ReactNode` works. Writing the test found a second defect in the same component:
`onKeyDown` was set after `{...moveProps}` and so replaced `useMove`'s own key
handling — arrow keys moved the dial by nothing at all. Merged with `mergeProps`,
and a keyboard delta is now one `step` rather than one pixel scaled by the
pointer ratio.

## R-4 · The character count's live region appears rather than updates

`TextArea` adds `role="status"` to the count only once the remaining characters
drop to 20, which means the live region is *inserted* at that moment. A live
region that appears at the same time as its content is not reliably announced —
the region has to exist before the text changes.

`src/components/TextArea/TextArea.tsx`. The region should be present and empty
from the start, with only its text changing.

**Closed.** Two elements: an `aria-hidden` figure and a permanently mounted,
initially empty live region. It announces words — "18 characters remaining" —
rather than "18 / 30", which a reader renders as a date.

## R-4b · Overlay containers accumulate with nested providers

Each `CrystalProvider` appends its own overlay container to `document.body`, so a
page with a provider at the root and a themed island inside it has two. That is
correct — each carries its own palette — but nothing dedupes an unmounted one
beyond its own cleanup, and a provider whose props change identity on every render
would churn them.

`src/theme/CrystalProvider.tsx`. Noticed while building the portal fix; not
observed misbehaving.

**Closed, and it was hiding something.** The container itself never churned; the
mount effect has always had empty dependencies. But the effect that writes the
theme onto it only ever *added* properties, so moving from Harbor dark — which
declares `contentOwnSurface` — to a palette that does not left Harbor's value on
the overlay container permanently. Now tracked and removed.

## R-4c · `UploadZone` renders an empty label

It composes `Upload` with `label=""` to suppress the second heading, which leaves
an empty `span` where a label would be. Harmless to look at and untidy in the
accessibility tree.

`src/components/FileInput/FileInput.tsx`. `Upload` wants an optional label rather
than an empty string.

**Closed, and it was worse than untidy.** `UploadZone` composed `Upload` with
`label=""`, which also gave the zone a second "Choose a file" button, a second
copy of the description, and a second `role="alert"` — the same error announced
twice. The file list is now its own piece that both components draw on.

## R-4d · A cascader's columns are named by depth

Each column is announced as "Top level", "Level 2", "Level 3". A reader moving
into the third column learns its position and not its subject — "Regions of
Scotland" would be the useful name, and only the product knows it.

`src/components/Cascader/Cascader.tsx`. Wants an optional per-level name from the
caller, defaulting to the parent option's label.

**Closed.** `columnLabels` for the product's own names, defaulting to the label
of the option the column hangs from.

## R-5 · `usePreset` has no direct test

It is exercised only through `Dialog`, so a change to the preset geometry that
happens not to affect a dialog's movement would pass everything. It is the one
motion primitive without its own suite.

`src/motion/usePreset.ts`.

**Closed.** Six tests covering what this file owns rather than what the core
module computes: it names the movement, it reports finishing, it settles the
promise instantly under reduced motion and for materials whose signature is paint
(an exit awaiting it must never hang), it clamps measured travel *and* depth to
Crystal's ceiling, and it passes the caller's anchoring through.

The clamp test uses a ceiling of 30 rather than Crystal's own 50, because depth's
fallback is 50 — a ceiling equal to the fallback would let a hook that never
clamped pass. Verified by removing the clamp and watching it fail with 4000.

## R-6 · `MultiSelect` is a select pretending to be a combobox

It drives React Aria's `Select` with `selectedKey={null}` and reads the selection
out of a `ListBox` beneath it, which works but is not the shape React Aria
intends. The catalogue calls it "combobox anatomy", and slice G brings the real
`Combobox` — this should be rebuilt on it then, not before.

`src/components/MultiSelect/MultiSelect.tsx`. **Fix during slice G.**

**Closed, and it was not a shape quibble — the component announced nothing as
selected.** Probed rather than assumed: React Aria's `Select` *and* its
`ComboBox` each own the selection of the listbox they contain, and each replaces
it. A `ListBox selectionMode="multiple"` nested inside either renders with no
`aria-multiselectable` and every option `aria-selected="false"`, silently and
with no warning. The shipped component did that, so nothing was announced as
chosen — and `.option[data-selected]`, which carries Crystal's label weight,
never matched either. The selection was invisible in both directions at once,
and there was no test file at all to notice.

Rebuilt on a standalone `ListBox` inside `DialogTrigger` → `Popover` → `Dialog`,
where it keeps its own multiple selection. **Do not re-nest it in a field
wrapper.** The trigger reports `aria-haspopup="dialog"`, which is what it opens.

Filtering came with it, which is what "combobox anatomy" was asking for, along
with the catalogue's `at-limit` state (`maxSelected`) that the component had
never had. A filter hides options and must not deselect them, so keys the filter
has hidden are carried across by hand. Nine tests, including axe with the
popover open.

## R-7 · Neither repository has continuous integration

`pnpm verify` and the design system's gate set are run by hand. Every gate in
this project exists because something passed review and broke anyway; none of
them runs unless somebody remembers.

Storybook's accessibility addon is configured to fail rather than inform
(`test: 'error'`), which is only meaningful inside a test runner that executes
the stories — and nothing currently does.

Root of both repositories. A workflow running `pnpm verify`, the design system's
`npm test` / `validate.py` / `verify:visual` / `verify:scroll`, and Storybook's
test runner would close it.

**Closed.** `.github/workflows/verify.yml` in both repositories. No new checks —
every step is a script that already existed; what changes is that they run on a
clean checkout, on somebody else's machine, before a change lands.

Crystal React's workflow lays out both checkouts as siblings, because
`@crystal/core` resolves to `file:../crystal-design-system/design-system` and the
layout on disk is part of the build. Crystal is private, so the Crystal checkout
needs a repository-scoped `CRYSTAL_READ_TOKEN` secret; without one the run stops
there, which is the honest place for it.

Both add one gate that did not exist by hand: **a build must not change a
committed file.** Generated output that has drifted from its source makes every
check beneath it evidence about the wrong thing. Crystal's own copy exempts the
`date` in `validation/token-checks.json` — it records when the evidence was
produced — and holds the rest of that file to the same rule.

## R-8 · The docs website does not exist yet

Slice M in `implementation-plan.md`. Meridian asked for a documentation site
deployable to Vercel, with isolated visual and code examples per component, in
line with MUI, Mantine, PrimeReact and Blueprint. Nothing is built.

**Scheduled, not overdue** — recorded here so it is visible alongside everything
else rather than only inside the plan.

**Not an issue — scheduled work.** This is slice M of `implementation-plan.md`
and belongs to the plan's status rather than to a defect tracker. Recorded here
only so the number is not reused.

## R-10 · Nothing in the library measured a target

**Closed.**

Crystal's floor is 44px and the catalogue states it per component — "Pill tabs
inside a pill strip; 44px minimum", "44px targets on touch". No check in this
library measured one, and the reason generalises past this defect:

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
Found by opening the component in a browser and measuring, not by reading it.

`scripts/verify-targets.mjs` probes the four edges of a 44px box centred on each
control and asks the document what is there. It checks the **hit area**, not the
box, because Crystal reaches the floor two ways — some controls are 44px, some
are shorter with a pseudo-element restoring the target — and a box measurement
sees only one of them.

It also checks **ownership**: the topmost element at each probe point has to be
that control. Growing a hit area is how a small target reaches the floor and also
how one target starts stealing another's taps, and that check earned itself
immediately — the vertical tab list, where pills are stacked and each grown area
reached into the tab below. Vertical pills are now 44px in their own right.

Proved by planting the defect: removing the pseudo-element failed six controls
across two stories.

Two things it is not. It is a **named list of stories and selectors**, not a
sweep of every interactive element, because a link in running prose is text
rather than a target and a blanket sweep would need an exclusion list longer than
the inclusion one. And it runs in CI against the **static** Storybook build
rather than the dev server, which removes the stale-transform class of false
defect that has twice sent this project chasing something not in the source.

One thing it taught, worth carrying: for React Aria's radio the element ARIA
names and the element a finger meets are **different nodes** — the radio is a
visually-hidden 1px input inside the label. Probing the named one reports every
segmented control in Crystal as a 1px target.

## R-11 · A rule that lives in CSS has no gate in this library

**Severity: medium, and the shape matters more than any one instance.**
**Closed 19 September 2026.**

Three checks written this cycle could not be written where they belonged:

- ~~**A link is underlined at rest.**~~ **Withdrawn — this one was checkable and
  is now checked.** The claim here was that jsdom loads no stylesheet. It is
  false: Vitest is configured with `css: true` and the module stylesheet really
  is applied. What jsdom does not do is derive longhands from a shorthand, so
  `textDecoration` answers `"underline"` on the same element where
  `textDecorationLine` answers `"none"`. The first attempt read the longhand and
  concluded the wrong thing. `Anchor.test.tsx` now asserts the shorthand and the
  underline offset.

  The real boundary, measured rather than assumed: jsdom applies the rules and
  reports lengths, but **does not resolve custom properties** — `color` on that
  same element reads back as the literal text `var(--cr-primary)`. So anything
  about a Crystal *colour* is still a browser question, and anything about a
  length, a shorthand or a keyword is not.
- **Every interactive control shows a focus ring.** This is not hypothetical.
  `--cr-focus-core` and `--cr-focus-ring` were read by every field in this
  library and defined by nothing, so Crystal's focus ring painted on no control
  anywhere, through an entire slice, with every test green. What found it was
  opening a component in a browser. `published-properties.test.tsx` now catches
  the *undefined property*; nothing catches a control that simply has no rule.
- **A state is distinguishable without colour.** Selection is weight, current
  location is a dot, an error is weight plus a symbol. Each is a CSS fact.

The pattern that remains: **jsdom tests semantics and the parts of CSS that are
not colours, axe tests the tree, the target gate measures geometry, the behaviour
gate drives the page — and what a state *looks like* is checked by nobody**,
because every Crystal state is expressed through a custom property and jsdom
hands those back unresolved.

`scripts/verify-behaviour.mjs` was built out of this entry and closed the
behavioural half; it found three defects in the scroll spy on its first run.

### Closed: `scripts/verify-appearance.mjs`

The appearance half, 18 checks, in a real browser against resolved computed
style. Three rules, and **every assertion is a relationship rather than a
value** — this entry named the trap ("a gate that asserts a colour is a gate that
fails on a palette change") and it shaped the whole design:

- **A focus ring exists.** The control is focused and compared with itself at
  rest. The ring is looked for on the control *and up to three ancestors*,
  because a Crystal text field puts `outline: 0` on the bare `<input>` and draws
  the ring on the field shell around it — the shell is the control a person
  sees. The question is "does focusing this show a ring", not "is the ring on
  this exact node".
- **Selection is carried by weight.** The selected row's computed `font-weight`
  must exceed its neighbour's, and its text must contain no check mark. If the
  weights are equal, whatever marks the selection is doing it with colour or
  with a shape, and both are withdrawn.
- **Disabled is more than opacity.** Opacity lowers contrast against whatever is
  behind, and on Resin that is a coloured atmosphere gradient — so it is the one
  signal whose legibility depends on the artwork.

Proven to bite before being trusted. Removing `Button`'s focus ring fails two
checks; making the selected pill the same weight as its neighbour fails one;
leaving opacity as the only disabled difference fails one.

**The disabled check had to be rewritten during that exercise, and the reason is
this project's recurring theme.** The first version compared the disabled button
with the first *enabled* button in the story — which is a different variant, a
quiet button beside a Resin one, so `color` and `backgroundColor` always
differed and the check passed on anything. It could not fail. It now removes the
disabled attributes from the one element, re-reads it, and puts them back, which
isolates the single variable.

## R-12 · A stale dev server is indistinguishable from a broken theme

**Closed as a gate; the hazard itself is inherent.**

Meridian looked at the running Storybook and reported that "many of Crystal's
specifications seem to be absent from the components". They were right about what
they saw and the cause was not the components: the dev server had been running
across several hours of source changes and was serving a stale copy of
`@crystal/core`, so `--cr-overlay-max-width`, `--cr-overlay-tooltip-max-width`
and both arrow properties resolved to nothing. A command palette with no maximum
width is 1160px of palette.

This had already cost something before the report arrived. The same stale bundle
had a diagnosis underway that read "the provider does not publish the overlay
properties" — which was false, and which would have produced a fix for a defect
that did not exist. Clearing `node_modules/.vite` resolved all four.

It is the third time. The two earlier ones cost a chase after
`useInvalidMotion is not defined` and a chase after missing focus properties,
both of which were in the source the whole time.

**What is new: `scripts/verify-theme.mjs`.** It collects every `var(--cr-…)` in
the library's stylesheets and asks a real browser whether each one resolves — on
the themed scope *and* on the container React Aria portals every overlay into.
Sixty properties, both elements. It then computes the three materials and fails
if any of them is `none`, because a `backdrop-filter` built from a property that
does not resolve is not a weaker blur, it is a syntax error, and the surface
renders flat.

`published-properties.test.tsx` already mounted a provider and checked that each
property read is one the provider writes, and it is a real check — it caught the
focus-ring outage. What it cannot see is the overlay container, a value that is
present but not *usable*, or a served bundle that is not the source. Those three
are what this adds.

The failure message names the cache, because the next person to meet this will
otherwise spend the same hour:

> If the source looks right, clear the dev server's cache before believing this.

**A second artifact, worth knowing and not worth gating.** The same session's
palette looked washed out in the in-app preview browser — 59% opacity, motion
state still `running` a second and a half after a 620ms recipe. That is
`requestAnimationFrame` throttling in a hidden tab, not a defect: the same story
in a visible Chromium reaches full opacity in 300ms and settles by 700ms.
Anything measured about motion or opacity in a backgrounded pane is measuring the
pane.

## R-13 · Crystal React's materials had drifted, and nothing compared them

**Closed for the library. The remaining half is a decision for Meridian — see below.**

Meridian sent a screenshot of Crystal's own playground and said none of the
components looked like it, "even in their hover state". Two separate causes, both
real, and neither visible to any existing gate.

### The foundation was flat

Crystal's materials are defined by what is *behind* them: Frost diffuses the
foundation, Resin transmits its colour, Haze fills over it. The Storybook
decorator painted `background: var(--cr-canvas)` — a flat colour — so every
material in every story had nothing to diffuse and rendered as white. The
hierarchy the whole system is built on was invisible in the one place a reviewer
looks at it.

Crystal's own scene marks itself `class="stage cr-plastic"`, and `.cr-plastic`
carries the three radial atmosphere washes. The decorator uses that class now;
there is no second recipe, the class *is* the recipe.

**Colour atmosphere was a provider input with no way to reach it.** It is a
toolbar control now, with Frost base tint, elevation, corner radius, animation
speed and the ground — Crystal's own "Make it yours" panel, in the same order
with the same defaults. Any of them can also be pinned per story through
`parameters.crystal`, so a component whose subject *is* an environment can show
it, and so a browser gate measures a fixed environment rather than whatever the
last reviewer left in the toolbar.

### Resin had no optical rims and half its elevation

Crystal paints Resin with `--cr-shadow-float`: **four layers**, two inset optical
rims over a two-part elevation. Crystal React painted `--cr-shadow-content`: two
layers, no rims, roughly half the elevation. Eight component stylesheets plus the
field and strip mixins. AGENTS.md lists optical rims among the qualities the
approved baseline exists to protect, and they are what make Resin read as a
raised piece of glass rather than a rounded rectangle.

`styles/_material.scss` now holds one definition per material, and
`Button`'s hover no longer cross-fades a second float shadow in — that was right
while the rest state was the content shadow and became a doubled shadow the
moment the rest state was corrected. Crystal's own Resin control does not lift on
hover: `:is(button,a.cr-button):hover` reads `filter: none`. The resting state
already *is* the floating state.

### `scripts/verify-materials.mjs`

The aesthetic check. It renders the same material in Crystal's preview and in
this library and compares the computed style — diffusion, shadow, fill, edge.
**Neither side's values are written down**, so the expectation follows Crystal
instead of a copy of it, which is the only way a parity check stays true.

Two things it had to learn. It picks the first match that actually *paints*,
because `controls.css` puts the Resin recipe on `.cr-resin-haze`, `.cr-control`
and every bare `button`, so the first `.cr-haze` in Crystal's preview is a control
wearing Haze's class — comparing against it reports a drift that is really a
mismatched specimen. And geometry is excluded: Crystal's preview and a Storybook
specimen are different compositions, so a radius difference is a layout choice
rather than a material one.

Frost matches exactly. Haze has no clean specimen in Crystal's preview to compare
against, which is recorded rather than worked around.

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
`controls.css` is not exported — that was D-1's fix.

So a platform library that follows the token cannot reproduce the approved
appearance, and `libraries/CONTRACT.md`'s parity bar cannot be met by following
Crystal's own tokens. Concretely the token gives a deeper, softer, palette-tinted
shadow (50px of spread against 30px) and a shallower top rim.

This is the D-1 hazard once more: `controls.css` shaped the appearance that got
blessed, and the exported surface says something else.

**Closed. Meridian gave full approval to make whatever changes aesthetic parity
needs, so this was fixed rather than allowed.**

Each side was right about something and both are kept. The **rims** are the
blessed ones — 2px of light along the top where it catches, and a light edge
returning underneath; the token's lower inset used the contact colour, which
reads as an inner shadow at the bottom of a control rather than as the underside
of glass. The **elevation** is the token's — palette-tinted like every other
Crystal shadow, and scaled by the elevation control, neither of which the literal
did. Moving the elevation slider did nothing to any control in the playground
before this.

`controls.css` now reads `var(--cr-shadow-float)` in both the places it had
written its own copy, so there is one recipe. The coefficients are the blessed
distances over the default 125% elevation — `4e`/`7.2e` and `12.8e`/`24e` — so the
default renders what was approved and the slider now moves it.

Twelve of eighteen frames moved, the largest at 3.2% of pixels with a worst
channel delta of 19 of 255. Side by side the playgrounds are the same picture.
Re-blessed with the reason in
`validation/captures/2026-09-19-one-resin-shadow/`. 1,788 contrast cases still
pass, and `verify-materials` reports ten comparisons, no allowances, no failures.

## R-14 · A `file:` dependency was pre-bundled once and served stale for hours

**Closed.**

`@crystal/core` is `file:../crystal-design-system/design-system` — the design
system itself, edited in the same sitting as this library. Vite's dependency
optimiser caches a pre-bundled copy, so a change to Crystal's resolver does not
reach the served page until somebody clears the cache.

It cost three investigations in one day. Once far enough to begin a wrong
diagnosis of the theme provider. Once for Meridian to look at the Storybook and
report, correctly, that Crystal's specifications were missing from every
component. And once more while fixing M-4, when the parity gate kept reporting
the old shadow after the token had already changed.

Excluding it from optimisation was the first attempt and it fails outright:
`core/preferences.js` and the resolver are CommonJS, so the browser receives a
module with no default export and every story renders blank. They have to be
pre-bundled; what they must not be is pre-bundled *once*. `optimizeDeps.force` in
`viteFinal` costs a few seconds of startup and removes the class.

One more thing that made it hard to see: killing the dev server and restarting it
is not enough on its own. A lingering process keeps port 6006, the new one fails
to bind, and the measurement lands on the old server — which looks exactly like a
cache that will not clear.

## R-15 · Resin surfaces are missing their Haze content fill

**Severity: high. A readability defect before it is an aesthetic one.**
**Reported by Meridian, 19 September 2026. Closed 19 September 2026.**

Crystal paints a protective Haze fill *inside* every Resin surface, under the
content. Crystal React paints it on four surfaces out of twenty.

References, captured side by side, in
[`references/2026-09-19-resin-haze-fill/`](references/2026-09-19-resin-haze-fill/README.md).

### What Crystal does

Three mechanisms, and the fix needs all three because they are not the same
thing.

**1. Every Resin control carries a feathered Haze fill.** `controls.css`:

```css
:is(button, a.cr-button, .cr-control, .cr-field-shell, .cr-resin-haze, .cr-status)::before {
  content: ''; position: absolute; inset: 8px; z-index: -1;
  border-radius: inherit; pointer-events: none;
  background: var(--cr-haze-fill);          /* the 80% content fill */
  filter: blur(var(--cr-haze-feather));     /* 1.95px */
}
```

Inset by 8px so the fill stops short of the rim and the glass edge still reads;
feathered, and therefore on its own layer behind the content, because feathering
an element that contains text blurs the text. `site.css` states the purpose in
one line: *"`.cr-control` paints an 80% white protective fill under its label so
text stays legible on Resin."*

There is a second layer, `::after` at `inset: 2px` with a 2px blur, carrying the
optical sheen.

**2. A Resin *strip* carries the fill for the pills inside it, and the pills
carry no material at all.** `:is(.cr-dock, .segmented, .suite-tabs)` takes the
same `::before`, and then:

```css
:is(.cr-dock, .segmented, .suite-tabs) button {
  background: transparent; box-shadow: none; backdrop-filter: none;
}
:is(.cr-dock, .segmented, .suite-tabs) button::before,
:is(.cr-dock, .segmented, .suite-tabs) button::after { display: none; }
```

This is structural, not decorative. In Crystal the strip is the material and the
pills are bare. In Crystal React every pill styles itself and the strip has no
fill — which is why the tab strip reads as one flat wash.

**3. The dock adds `.cr-dock-inner` at `--cr-label-fill`** — the 55% label veil,
a different token from the Haze fill — which is the bright inner band visible in
`standard-crystal-dock.png`.

### What Crystal React does

Sixteen of twenty Resin surfaces paint no Haze fill. Only `NavLink`,
`OverlayArrow`, `RichTextSurface` and the overlay row mixin do, and the first of
those was written yesterday.

Missing it: **`Button`**, **`IconButton`**, **`_field.scss`** — which is every
text input, textarea, select, combobox, date picker and tags input in the
library — **`_strip.scss`** (tabs and the segmented control), `Toolbar`,
`ButtonGroup`, `Slider`, `AngleSlider`, `Switch`, `Checkbox`, `AppShell`,
`FloatingAction`, `Resizable`.

### Why it is not only appearance

Resin is a 20% fill with a 20px backdrop blur: it transmits whatever is behind
it. On Crystal's Plastic foundation that is a coloured atmosphere gradient, so a
label on bare Resin is reading against a surface that changes across the control
and between palettes. The Haze fill is what puts a stable 80% ground under the
text. Removing it does not merely flatten the material — it makes the label's
contrast depend on the artwork behind the control.

Crystal's contrast evidence is measured against the composition *with* the fill.
Nothing in this library's checks measures it: the contrast gate lives in the
design system, and `verify-materials` compares the surface's own computed style,
not what a pseudo-element paints behind its content.

### What closing it needs

The Haze fill belongs in `styles/_material.scss` beside the `resin` mixin, as one
definition — the strip variant included, since it is the same fill at a different
inset with the children deliberately bare. And `verify-materials` should grow a
comparison for the `::before` layer, because the reason this was invisible is
that the gate only ever asked the element about itself.

### Closed

**The inset became a token first.** `--cr-haze-fill` and `--cr-haze-feather`
were always exported; the composition was not. "Held back 8px from the rim, on
an isolated layer behind the content" lived only as a literal in Crystal's
`controls.css`, which is deliberately unexported — so this library could carry
every Haze token, pass every token gate, and paint nothing. `component.haze.inset`
now sits in Crystal's DTCG source, the resolver emits `--cr-haze-inset`,
`controls.css` reads it instead of holding its own copy, and the Swift and Kotlin
exports picked it up for free. That last part is the actual fix: the recipe now
reaches every platform library rather than only the renderer that knew it.

**The gate was built before the fix and proven red.** A new `resin-control` pair
in `verify-materials`, with a `pseudo` field, comparing
`content, backgroundColor, filter, top, right, bottom, left`. It could not be
added to the existing `resin` pair: that pair's Crystal selector is
`.cr-resin:not(button):not(.cr-control):not(.cr-field-shell)`, which excludes the
very controls the fill lives on, so a `::before` comparison there would have
compared nothing against nothing and passed. Run before the fix it reported
seven differences, the first being `content: none` against Crystal's `""` — a
pseudo-element with no `content` does not exist, and every other property on it
still computes to a plausible value, so `content` is what makes the absence
legible rather than a colour mismatch. Now 17 comparisons, 0 failures.

**One definition, in `styles/_material.scss`.** `@mixin haze-fill($inset)` sets
`position: relative` and `isolation: isolate` itself rather than trusting the
host: `z-index: -1` without a stacking context puts the fill behind the
*element*, and on a Resin control — whose own background is a translucent fill —
it then disappears underneath it, which is indistinguishable from never having
written the rule. Applied to nine surfaces: `Button`, `IconButton`,
`FloatingAction` (both the action and its bar), `ButtonGroup`, `Toolbar`,
`AppShell`'s destination strip, `_field.scss`'s shell — which carries every text
input, textarea, select, combobox, date picker and tags input in the library —
and `_strip.scss`. `NavLink` was rewritten onto the mixin at `haze-fill(0)`.

Verified by rendering, not by reading: all nine paint
`rgba(255,255,255,0.8)` at `blur(1.95px)`, inset `8px`, and a tab pill correctly
paints none.

### Three things this entry had wrong, found by measuring Crystal instead of reading it

1. **Mechanism 3 was attributed to the wrong file and the wrong material.** The
   dock's inner band is **Stone**, not Haze, and it is in the **exported**
   `crystal.css`, not in `controls.css`. Measured in Crystal's preview:
   `rgba(255, 255, 255, 0.55)`, `blur(1.95px)`, inset `0`. `docs/materials.md`
   already says so — "the dock's `.cr-dock-inner` uses the same recipe" as
   `.cr-stone`. It is a separate material with its own token and is not part of
   this defect.

2. **"The same fill at a different inset" was wrong.** A Resin strip uses the
   *same* inset as a Resin control — 8px in both. Measured, not inferred.

3. **Four of the surfaces listed as missing the fill are correct without it.**
   `Checkbox`, `Switch`, `Slider` and `AngleSlider` were named above. Crystal
   gives none of them a Haze `::before`: `input[type=checkbox]`, `.switch-track`
   and `input[type=range]` are not in the `:is(...)` list the recipe applies to,
   and each has its own. Measured in Crystal's preview: checkbox `no ::before`,
   range `no ::before`. Adding the fill there would have been a regression
   against Crystal dressed as a fix — which is what comes of working from a
   selector list rather than from what the browser renders. `Resizable`'s drag
   handle has no Crystal analogue and was left alone.

   Relatedly, "only four surfaces have it" counted loosely: `OverlayArrow` and
   `RichTextSurface` use `--cr-haze-fill` as an element *background*, which is
   Haze-as-a-material and a different mechanism from the protective layer.
   `NavLink` was the only surface in the library using the `::before` mechanism
   at all.

## R-16 · Crystal is a path on a disk, not a dependency

**Requested by Meridian, 19 September 2026. Blocked on publication — see the end
of this entry.**
**The consumer's half of D-10 in the design system's tracker, which holds the
detail, the proposed shape and the steps only Meridian can take.**

This library declares:

```json
"@crystal/core": "file:../crystal-design-system/design-system"
```

That is not a dependency. It is a path on one contributor's disk, pointing at a
directory that is simultaneously the design system, its documentation website and
its build machinery. Everything that has gone wrong between the two repositories
this week traces back to it.

**There is no version to target.** Crystal React cannot say it is built against
Crystal 2.0.1. It resolves whatever happens to be checked out beside it, so a
material token can change under this library with no range to pin, no changelog
to read, and no way to stay on a known-good Crystal while upgrading
deliberately. CI reproduces this exactly: it checks Crystal out at its default
branch, which is why pushing this repository before the design system fails as
`[sass] Undefined variable` — a defect in neither repository.

**A path cannot be cached correctly.** R-14: Vite pre-bundles it once, and a
change to Crystal's resolver never reaches the served page. Three investigations
in one day, one of which was Meridian reporting that Crystal's specifications
were missing from every component. `optimizeDeps.force` is a workaround for a
package manager being asked to treat live source as a release.

**A path has no export boundary.** R-13 and D-9: the drift this library had was
only findable by running two servers and diffing computed styles, because there
is no artefact stating what Crystal's Resin *is*. And Crystal's own website
could shape a blessed appearance with a stylesheet it does not export, which no
consumer could ever have matched.

**Everything above applies to every other platform library, and worse.** A
SwiftUI or Compose library cannot install an npm path at all. The Swift and
Kotlin exports are generated and then stranded inside a package only npm can
reach, so those libraries would retype values — the exact thing CONTRACT §1
forbids, made unavoidable by the packaging.

What this library needs from the resolution: a published version to depend on, a
range to pin it with, and a local development story so Crystal can still be
edited in the same sitting without going back to a path.

**Answered by Meridian, 19 September 2026**, and recorded in full in D-10. For
this library specifically:

- The dependency becomes `"@crystal/core": "^2.0.0"`, from the public npm
  registry under the **`@crystal`** scope, which Meridian had verified as free
  and which D-10 wrongly called "almost certainly taken". Verified since:
  `@crystal/core` and `@crystal/react` both return 404 and a scope search returns
  nothing. This library keeps the name `@crystal/react`.
- Local work against an unpublished Crystal uses **`pnpm link`** — a symlink
  rather than a copy, so an edit is live and there is no cache to clear. That
  retires `optimizeDeps.force` in `.storybook/main.ts`, which is R-14's
  workaround rather than its cure; the `viteFinal` hook and the comment
  explaining it can go once the dependency is a real one.
- CI stops checking Crystal out beside this repository and installs the
  published version instead, which removes the push-ordering trap recorded in
  the workflow: pushing this repository first will no longer fail as
  `[sass] Undefined variable`, because the Crystal it builds against will be a
  pinned version rather than whatever `main` happens to be.

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
unchanged.** `"@crystal/core": "^2.0.0"` cannot be committed until something has
been published to the `@crystal` scope: a committed range pointing at a version
nobody can install is worse than an honest `file:` path, because it fails for
every contributor rather than for one. `optimizeDeps.force` stays with it — it is
R-14's workaround, and `pnpm link` is its cure, but only once there is a
published package to link *away from*.

What changes here on the day `@crystal/core@2.0.0` exists, in one commit:

```
- "@crystal/core": "file:../crystal-design-system/design-system"
+ "@crystal/core": "^2.0.0"
```

plus removing the `viteFinal` hook in `.storybook/main.ts` and its comment,
documenting `pnpm link ../crystal-design-system/design-system` for local work
against an unreleased Crystal, and dropping the sibling checkout from
`.github/workflows/verify.yml` — which also removes the push-ordering trap
recorded there, where pushing this repository before the design system fails as
`[sass] Undefined variable`.
