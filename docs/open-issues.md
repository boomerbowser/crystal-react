# Open issues — Crystal React

Things noticed while building this library that are not fixed. Each says what is
wrong, why it matters, where it is, and what closing it would take.

**One entry.** R-26 is the adoption of Crystal 2.3.0: built and verified on the
`adopt-crystal-2.3.0` branch against the packed release, and waiting on 2.3.0
reaching the registry so the dependency range can name it.

**R-17 and R-25 closed on 29 September 2026**, by Meridian's rulings of that day
(Crystal's `proposals/2026-09-29-rulings.md`): the compiler-checked
`ariaArgTypes` table is the answer to docgen, and `Indicator` is Crystal's
`.cr-indicator`. The records are in `closed-issues.md`.

**R-24 closed on 28 September 2026**: Crystal 2.2.0 is adopted — every surface
worn and gated, and the motion the catalogue assigns bound to state and checked
in a browser, with the assignments no component can honour as written recorded
by name and the catalogue's own questions sent upstream as D-28.

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
its next occurrence with the artifact kept, D-21, a hover treatment that is
Meridian's to rule on, D-25, three findings from this library's surface sweep,
D-26, the dock controls and the grouped dock that this library restates until
Crystal draws them, and D-27, the two small marks — the count badge and the
field indicator — that Crystal's recipes do not yet reach.

---

## R-26 · Adopt Crystal 2.3.0 when it is published

**Ruled 29 September 2026:** the day's Crystal rulings fold into 2.3.0; it is tagged from here once green and adopted here in one pass. See [`2026-09-29-rulings.md`](https://github.com/boomerbowser/crystal/blob/main/proposals/2026-09-29-rulings.md) in Crystal.

*(Opened 29 September 2026.)*

Crystal 2.3.0 is prepared and not yet tagged. It carries two things this library
has been standing in for, and one of them would collide with the stand-in:

- **The navigation entry's location dot** (D-22). `.cr-nav-item` draws it from
  2.3.0 — a flat primary mark on `aria-current`, inside the entry's own padding.
  `NavLink` draws its own, in a slot of its own, because 2.2.0 did not. Under
  2.3.0 both would draw and the current link would show two dots.
- **`component.overlay.tooltipRadius`**, 18px, which `Tooltip.module.scss` holds
  as a literal (`$tooltip-radius`, allowed with the catalogue's words beside it).

So the dependency range is `~2.2.0` rather than `^2.2.0`: a caret would let a
fresh install take 2.3.0 the day it is published, under a `NavLink` that has not
yet let go of its dot. And `src/styles/coreVersion.test.ts` has a ceiling — the
R-20 pattern — that fails the day 2.3 is installed regardless, and names these
steps.

**Closing it**, once `@crystal-ui/core@2.3.0` is on the registry:

1. The range to `^2.3.0`; `pnpm install`; `pnpm run build:tokens`, which brings
   `$cr-overlay-tooltip-radius`.
2. `NavLink` removes its `.dot` element, its reserved slot and their
   forced-colours rule, and says in its header that the dot is Crystal's. Its
   tests assert the dot on `aria-current` through the class — present on the
   current link, absent on a selected one — rather than through the element.
3. `Tooltip` reads `$cr-overlay-tooltip-radius` and drops the literal.
4. The ceiling test goes; the floor moves to 2.3 if anything here then depends
   on it (the dot does).
5. Every gate, `verify:appearance` with `VERIFY_PLANT_RED=1`, and a look at the
   navigation stories in both directions and under forced colours.

