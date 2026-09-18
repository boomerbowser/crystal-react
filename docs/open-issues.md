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

## R-6 · `MultiSelect` is a select pretending to be a combobox

It drives React Aria's `Select` with `selectedKey={null}` and reads the selection
out of a `ListBox` beneath it, which works but is not the shape React Aria
intends. The catalogue calls it "combobox anatomy", and slice G brings the real
`Combobox` — this should be rebuilt on it then, not before.

`src/components/MultiSelect/MultiSelect.tsx`. **Fix during slice G.**

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

## R-8 · The docs website does not exist yet

Slice M in `implementation-plan.md`. Meridian asked for a documentation site
deployable to Vercel, with isolated visual and code examples per component, in
line with MUI, Mantine, PrimeReact and Blueprint. Nothing is built.

**Scheduled, not overdue** — recorded here so it is visible alongside everything
else rather than only inside the plan.
