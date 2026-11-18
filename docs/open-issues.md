# Open issues: Crystal React

Things noticed while building this library that are not fixed. Each says what is
wrong, why it matters, where it is, and what closing it would take.

**One entry is open**: R-35, three surfaces this library draws differently from
the catalogue, ruled on 18 November 2026 and waiting to be built. R-28, the
hand-written material, closed on 17 November 2026: every directory wears
Crystal's material, on core 2.8.0. The tasks left
from the media and text work of 2 October 2026
([`proposals/2026-10-02-media-text-and-recipe-parity.md`](proposals/2026-10-02-media-text-and-recipe-parity.md))
are Slice R in the implementation plan. R-30, the bundler question,
closed on 16 November 2026 by Meridian's ruling. R-27, the recipe copies,
closed on 7 November 2026 with core 2.4.0 installed. R-29, the flaky virtualizer
check, closed on 2 October 2026; the record is in `closed-issues.md`. R-26, the
adoption of Crystal 2.3.0, closed on 29 September 2026 with 2.3.0 on the
registry.

## R-35 · Three surfaces drawn differently from the catalogue

**What.** R-A2's measurement (17 November 2026) accounts for every catalogue
surface but four, and R-28 left one finding. In each the library draws
something deliberate-looking that the catalogue does not specify, and either
side could be the correction:

1. **Chips** (`Chip`, worn by `TagsInput`, `MultiSelect` and the token field)
   are a pill on the solid alternate surface with an `--cr-edge` rim. The
   catalogue says "Haze chips", the compact surface, which Crystal publishes as
   `.cr-tag` (a Resin shell with an 8px-inset Haze pad, 18px radius). Three
   entries.
2. **Transfer's list panels** are the solid alternate surface with an
   `--cr-edge` rim. The catalogue says "Haze list panels".
3. **List's rows** differ by element: a `<button>` row keeps Crystal's coat
   (the reading pad, the sheen and the float shadow) under its flat Haze fill,
   and an `<a>` row has none of them. Both have rendered this way since before
   R-28, which kept them as they were.

**Why it matters.** Under R-28 a library's drawing is a correction the
standard takes in, but these were never decided, only drawn. Wearing the
catalogue's surface changes how three components look; correcting the
catalogue publishes the alternate surface as what a chip and a transfer panel
are.

**Ruled 18 November 2026: the library follows the catalogue in all three.**
Chips wear `.cr-tag`. Transfer's panels wear Haze. List rows are flat for both
elements: a `<button>` row loses the coat it kept, so it looks like an `<a>`
row. Core is unchanged.

**Closing it.** Each component wears its surface, measured before and after
with the material gate as R-28 was, and `measure-surfaces.mjs` reports no
surface missing.

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
