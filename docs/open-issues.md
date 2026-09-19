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

Three checks written this cycle could not be written where they belonged:

- **A link is underlined at rest.** The underline is the non-chromatic signal
  that distinguishes a link from the sentence around it — WCAG 1.4.1 — and a
  link that underlines only on hover has no signal for a reader who is not
  pointing at it. `getComputedStyle(link).textDecorationLine` in a vitest test
  returns `"none"` whatever `Anchor.module.scss` says, because **jsdom loads no
  stylesheet**. A test written against it passes on a component with no styling
  at all.
- **Every interactive control shows a focus ring.** This is not hypothetical.
  `--cr-focus-core` and `--cr-focus-ring` were read by every field in this
  library and defined by nothing, so Crystal's focus ring painted on no control
  anywhere, through an entire slice, with every test green. What found it was
  opening a component in a browser. `published-properties.test.tsx` now catches
  the *undefined property*; nothing catches a control that simply has no rule.
- **A state is distinguishable without colour.** Selection is weight, current
  location is a dot, an error is weight plus a symbol. Each is a CSS fact.

The pattern: **jsdom tests semantics, axe tests the tree, the target gate
measures geometry, and the appearance of a state is checked by nobody.** That is
the same gap the 36px tab sat in, and R-10 closed only the geometry half of it.

Closing it means a browser gate over stories that reads computed style — the
`verify-targets.mjs` harness already opens Playwright over the static Storybook
build and would extend to it. Not done here because it is a second gate with its
own case list and its own way of being wrong, and bolting it onto a script whose
subject is "how big is this" would make both harder to trust. It wants its own
change, and it is the next piece of infrastructure worth building.
