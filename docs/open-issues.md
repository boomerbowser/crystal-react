# Open issues: Crystal React

Things noticed while building this library that are not fixed. Each says what is
wrong, why it matters, where it is, and what closing it would take.

**Three entries are open**, R-27 to R-29, from the media and text work of
2 October 2026 ([`proposals/2026-10-02-media-text-and-recipe-parity.md`](proposals/2026-10-02-media-text-and-recipe-parity.md)).
Its tasks are Slice R in the implementation plan. R-26, the adoption of
Crystal 2.3.0, closed on 29 September 2026 with 2.3.0 on the registry.

## R-27 · Copies of recipes Crystal has not published yet

**What.** The media and text recipes (`.cr-media`, `.cr-media-bar`,
`.cr-resin.transport`, `.cr-media-caption`, `.cr-media.audio`, `.cr-prose`,
`.cr-editor`, `.cr-editor-toolbar`, `.cr-frost.bar`) are in Crystal's
`crystal.css` after 2.3.1 and in no published core. `VideoPlayer`,
`AudioPlayer`, `MediaControls`, `RichTextSurface`, `RichTextEditor` and `Prose`
carry their values in their own stylesheets, and three of the properties they
set (`--cr-media-aspect`, `--cr-media-fit`, `--cr-media-transport`) are on the
published-properties test's local list.

**Why it matters.** A copy drifts. This is the position R-20 was in before
2.2.0.

**Closing it.** `src/media/coreRecipes.test.ts` fails on the day the installed
core publishes the classes. Then wear them, delete the copies and the three
local properties, and delete the test (tasks R-M9 and R-T9, after Crystal's
C-R1).

## R-28 · Hand-written material across 29 directories

**What.** `scripts/audit-recipes.mjs` finds 29 of 237 component directories
painting `backdrop-filter` by hand (79 declarations) and 49 using this
library's material mixins (`haze-fill` 25, `field.shell` 15, `frost` 8,
`resin` 3), and 105 entries whose catalogue surface their own markup does not
wear (some through a child, which the static reading cannot follow). The
re-evaluation of 29 September asked for these to be sorted into surfaces to
wear and compositions to propose (its recommendation 6). This change sorted
four: the rich text surface now wears `.cr-field-shell`, and the audio player,
the media controls and the video player wear or mirror their surfaces.

**Closing it.** Task R-A1: each directory either wears a surface, measured by
`verify:materials`, or is filed upstream as a composition the vocabulary
lacks; the audit's counts fall to what is filed.

## R-29 · A flaky virtualizer check under the dev server

**What.** On 2 October 2026 `verify:behaviour` failed once on "a virtualizer
keeps the focused row when scrolling would recycle it" (the last row not
rendered after scrolling to the end), run against `pnpm storybook` rather than
`storybook-static`. The rerun under the same server passed all 114 checks. The
virtualizer was not touched.

**Closing it.** Run the check against `storybook-static`, as CI does, several
times; if it never fails there, record it as a dev-server timing artefact and
close; if it does, the wait for the scroll to settle is too short.

**R-17 and R-25 closed on 29 September 2026**, by Meridian's rulings of that day
(Crystal's `proposals/2026-09-29-rulings.md`): the compiler-checked
`ariaArgTypes` table is the answer to docgen, and `Indicator` is Crystal's
`.cr-indicator`. The records are in `closed-issues.md`.

**R-24 closed on 28 September 2026**: Crystal 2.2.0 is adopted. Every surface is
worn and gated, and the motion the catalogue assigns is bound to state and
checked in a browser. The assignments that no component can honour as written
are recorded by name, and the catalogue's own questions were sent upstream as
D-28.

**R-21 and R-22 closed on 28 September 2026**, both by rulings Meridian made on
Crystal's side. Charts now arrive with `mark-in`, a recipe authored in core. It
is critically damped, so that no bar ever shows a value it does not have. The
catalogue now describes the reachable number field this library always shipped,
in place of a spin button that VoiceOver cannot focus. D-19's continuous
indicators closed with them: the loader, the progress indicators and the
skeleton play Crystal's `activity-turn`, `activity-travel` and `skeleton-sweep`,
which replace this library's own loops.

**R-20 and R-23 closed on 24 September 2026**, when `@crystal-ui/core@2.1.0` was
published and this library's dependency moved to `^2.1.0`. Both were designed to
report when they were no longer needed, and both did. The chart shim carried a
test whose only job was to fail on the day the installed core began publishing
the series scale, and it was the single failure in a suite of 1692 on the bump.
All thirteen transcribed values matched their published tokens exactly.
`chartTokens.ts` is gone, and `chartGeometry.ts` reads the same numbers from the
generated export, so they cannot go stale. The view stack's `getRecipe` guard is
gone with it. The check it was waiting for is in `verify:behaviour`: a pop is a
push mirrored, and right-to-left is a push mirrored again. It is read from the
running animation's first keyframe across all four combinations.

Closed entries are in [`closed-issues.md`](closed-issues.md), with the reasoning
intact.

Crystal's own tracker is `crystal-design-system/proposals/open-issues.md`. As of
29 September 2026 it holds two entries, neither of them this library's to act
on: D-4, the phone leg of Crystal's scroll gate, which waits on a real Android
device; and D-25's last finding, the documentation site adopting a published
Crystal. Everything this library had filed upstream (D-21, D-26, D-27, D-28 and
D-29) was ruled on and built into 2.3.0, and is adopted here.

---
