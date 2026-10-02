# Open issues: Crystal React

Things noticed while building this library that are not fixed. Each says what is
wrong, why it matters, where it is, and what closing it would take.

**No entries are open.** R-26, the adoption of Crystal 2.3.0, closed on
29 September 2026 with 2.3.0 on the registry.

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
