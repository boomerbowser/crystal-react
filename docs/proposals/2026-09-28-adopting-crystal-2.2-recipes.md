# Adopting Crystal 2.2.0: surfaces, recipes and the motion the catalogue owes

**Findings and migration guide, 28 September 2026.** The consumer's half of
`crystal/proposals/2026-09-28-component-recipes.md`; read that first for what
changed in the design system and why. This document says what it means for this
library, component by component, and in what order.

Two phases, because this library resolves `@crystal-ui/core` from npm and not from
the local checkout. **Phase A** is everything the installed 2.1.0 already
publishes and this library was not using — done, in this working tree. **Phase B**
is everything that needs 2.2.0 installed — specified here, guarded by
`src/styles/coreVersion.test.ts`, which fails the day it is.

---

## 1. What was found here

Measured on 28 September against `@crystal-ui/core@2.1.0`, all 229 component
folders and 373 test files.

**Materials.** Components style themselves with hashed CSS modules and a handful
of SCSS mixins; 18 component files put a Crystal class on an element. 43
stylesheets write a material recipe by hand (a `backdrop-filter`, a `--cr-*-fill`
as background, a feather), 22 of them with no material mixin at all. Among them:

- `Table` and `DataTable` paint their Resin shell with `--cr-shadow-content`, the
  Haze shadow, under a comment in `_material.scss` calling exactly that the drift
  the mixin exists to prevent.
- `Tooltip` used `--cr-stone-fill` with `backdrop-filter: blur(var(--cr-stone-feather))`
  — a 1.95px paint feather as a blur radius. Neither Stone nor Frost.
- `ChartTooltip` reaches for `--cr-acrylic-fill`, the alias, because nothing said
  which surface a chart tooltip is.
- `Card` targets `:global(.cr-resin) .card`, a class nothing in this library emits.
- Menus, popovers, hover cards, toasts and notifications were Resin. Meridian moved
  them to Frost on 17 September (R15e) and the design system's chapters had not
  caught up either, so this library was faithful to the wrong half of the
  specification.
- The library's own `crystal.css` import exists only in `.storybook/preview.ts`.
  A consumer who does not import `@crystal-ui/core/css` and `/theme` gets no
  material on any bare `<button>`, and the README does not say so.

**Motion.** 30 of Crystal's 57 recipes are ever played; 27 never. 145 of 229
components play no recipe, even through a child. Of the 48 components the
catalogue assigned motion to, about 20 played none of it. Every exit recipe
except `accordion-out` and `toast-out` was unplayed. `Dialog` attached a
`usePreset` scope and never called `play`; its scrim faded on a hand-written
opacity ramp, as did `Drawer`'s and `CommandPalette`'s. `useStateMotion` and
`useOpticalLayer`, named in the plan's §3.4, do not exist.

Most of this was the catalogue's silence, not the library's omission: the
library's rule is "where the catalogue assigns none, the component plays none",
and 237 entries assigned none. Crystal 2.2.0 completes 114 of them from its own
family table. §3 below turns that into bindings.

---

## 2. Phase A — done against 2.1.0

| Change | Where | Evidence |
|---|---|---|
| Transient overlays are Frost. `useOverlayMaterial()` → `frost` on the page, `haze` inside any pane. The overlay mixin paints Frost; `Tooltip`, `HoverCard`, `Toast`, `Notification` follow; the Stone-feather blur is gone. | `src/overlays/surface.tsx`, `src/styles/_overlay.scss`, the four components' SCSS | `Menu.test` asserts `frost` on the page and `haze` inside a dialog |
| `usePresetMotion(enter, exit, options)` — Crystal's material presets as Motion for React `initial`/`animate`/`exit` targets, computed by `@crystal-ui/core/core/presets`, never copied. Reads the environment once after mount, so SSR and hydration are stable. Fallback durations are Crystal's published ones (departure 650ms, flow 1200ms), not a flat second. | `src/motion/usePresetMotion.ts` | `Dialog`, `Drawer`, `CommandPalette` tests, which wait for the real departure |
| `Dialog` plays `mirage` / `mirage-out` on the scrim and `dismiss` on the surface; `Drawer` and `CommandPalette` scrims play the wash. The unused `usePreset` scope is gone. | the three components | as above |
| `Checkbox` and `Radio` play `check` / `check-off`, bound to the value React Aria resolved, never on a mount that is not an arrival. | `Checkbox.tsx` (`ChoiceMotion`) | `Checkbox.test` unchanged and green — jsdom cannot see a transform, which is why §4 asks for a browser check |
| `Menu`, `Popover`, `Tooltip`, `HoverCard` play `menu-in`, `popover-in`, `tooltip-in`, `popover-in` on the mount that is the opening. | the four components, `src/motion/Arrival.tsx` | — |
| The version guard: passes on 2.1.x, fails on 2.2.0 or the moment `.cr-bare` appears in the installed stylesheet. | `src/styles/coreVersion.test.ts` | it is the test |

`pnpm typecheck`, `pnpm lint:tokens` and the full `pnpm test` (373 files, 1694
tests) are green. Four tests that wait for a dismissal now wait for the departure
clock rather than for a hand-written fade that happened to fit inside Testing
Library's one-second default; they went red when the exit got longer, which is
what a test that turns on time should do.

**Not done in phase A, deliberately.** The exits `menu-out`, `popover-out` and
`tooltip-out`. React Aria unmounts a popover as it closes; to play an exit the
popover has to stay mounted until the recipe settles, which means
`AnimatePresence` around React Aria's overlay lifecycle — the shape `Dialog` and
`Drawer` already have with `motion.create(ModalOverlay)`. Doing the same with
`motion.create(Popover)` is the change; it touches the four overlays and the
`Select`, `ComboBox`, `MultiSelect`, `Cascader` and `DatePicker` popovers, and it
changes when `onOpenChange(false)` observers see the element gone, so it wants
its own slice with browser-run tests rather than a passing edit.

---

## 3. Phase B — when 2.2.0 is installed

Run in this order. Each step is measured the way R-19 was: render the component
and a planted Crystal element into the same page, diff computed style to zero,
then plant one difference and watch it go red.

### 3.1 Bump, and let the guard fail

`@crystal-ui/core` to `^2.2.0`; `pnpm install`; `pnpm test`. Exactly one test
fails: `coreVersion.test.ts`. Delete it at the end of this phase, not before.

### 3.2 Wear the surfaces, delete the copies

| Component(s) | Wears | Deletes | Notes |
|---|---|---|---|
| Every caller of `material.bare-control` (Accordion, Alert, Banner, Calendar, Carousel, ChartLegend, Chip, FileInput, FloatingWindow, MultiSelect, NavigationMenu, NavigationTree, Notification, NumberInput, OrganizationChart, QuantityStepper, Stepper, Table, Toast, TreeView and `field.inline-action`) | `cr-bare` on the control element | the mixin and its 22 includes | `.cr-bare` also sets the 44px target and pill radius; a caller that had `border: 0` keeps it, the one that wanted its rim keeps that. Check each control's `min-inline-size` did not grow past its row. |
| `NavLink`, `NavRail` items, `TableOfContents` entries | `cr-nav-item` (`stacked` for the rail) | the local weight-550 recipe, the rail item's Resin | Selection is `aria-current`; the class carries weight 800. `NavLink` stops importing `material.resin`. |
| `DragHandle`, `Resizable` handle, `ImageCompare` handle | `cr-bare cr-drag-handle` | the local grip and lift | Set `data-dragging` while held; `aria-grabbed` if the collection exposes it. |
| `FloatingWindow`, `MediaControls` | `cr-resin panel` | `material.resin` on the shell | Radius is the Frost panel's; check nested Haze radii. |
| `Switch` | either the native switch (`<input type=checkbox role=switch>`) or an appearance check against it | its hand-written Resin track | React Aria's `Switch` renders a hidden input and a visual track; the honest options are to move the visual onto the input, or to keep the track and add a `verify:appearance` check that its computed style equals a planted native switch's. |
| Every `field.shell` caller (17) | `cr-field-shell` on the shell element | the mixin's restated recipe | The comment there already says Crystal owns it. |
| `Table`, `DataTable`, `CompareTable`, `ResizableTable` | `cr-table-scroll` (already) — and drop the hand-written Resin | the `--cr-shadow-content` Resin | This is a bug fix that does not need 2.2.0 and could go in phase A; left here so the table family moves once. |
| `Card` | `cr-haze` | the hand-written feather and the `:global(.cr-resin)` rule nothing emits | The recess-inside-Resin rule is Crystal's, keyed on `.cr-haze` inside `.cr-resin`. |
| `Tooltip`, `Menu`, `Popover`, `HoverCard`, `Toast`, `Notification`, `Select`/`ComboBox`/`MultiSelect`/`Cascader`/`DatePicker` popovers, `ChartTooltip` | `cr-frost` | the overlay mixin's Frost branch and each hand-written Frost popover | After phase A they are already Frost by mixin; wearing the class makes core the painter. `ChartTooltip` stops naming the acrylic alias. |
| `Badge`, `Kbd`, `DeltaBadge`, `DiscountBadge`, `OverlayBadge` | `cr-resin-haze` (+ `cr-tag` where compact) | local shells | `DeltaBadge`, `DiscountBadge`, `OverlayBadge` are `haze` in the catalogue, not compact; they wear `cr-haze` with their own radius. |
| `Caption`, `StatusBar` | `cr-stone` | the hand-written Stone | `StatusBar` already wears it. |
| `Dialog` | `cr-dialog` on the surface | the hand-written Mirage and Haze | React Aria's `Modal` is the element; `::backdrop` does not apply, so the scrim stays `cr-mirage` on the `ModalOverlay`. |

### 3.3 The component manifest carries `surface`

`scripts/build-manifest.mjs` reads `@crystal-ui/core/catalogue`; add each entry's
`surface` to the manifest and to `llms.txt`'s per-component line. Then
`verify:appearance` gains one check per surface in `@crystal-ui/core/surfaces`:
for one component of each surface, plant the surface's class on a bare element
and require the component's shell to agree on the recipe's properties — the
R-19 gate, generalised, and this time kept.

### 3.4 Bind the motion the catalogue now assigns

Crystal 2.2.0 gives 114 more entries their recipes. The binding shapes already in
this library cover every case:

| Shape | Use it for | Recipes |
|---|---|---|
| `Arrival` on the mount that is an opening | menus, popovers, submenus, navigation-menu panels, hover cards, chart tooltips, the date pickers' popovers, `Mentions`, `Autocomplete`, `Cascader`, `NativeSelect`, `SortSelect`, `SpeedDial` | `menu-in`, `popover-in`, `tooltip-in` |
| `ChoiceMotion`-style state binding (previous value, skip the first pass) | anything with a selected member: `SegmentedControl`, `Tabs` (has `tab-in`), `Pagination`, `Stepper`, `CheckoutSteps`, `BottomNavigation`, `NavRail`, `Rating`, `Chip`, `ColorSwatch`, `ColorSwatchPicker`, `VariantSelector`, `PaymentMethod`, `ShippingSelector`, `WishlistButton`, `ChartLegend`, `Calendar`, `MonthPicker`, `YearPicker`, `DigitalClock`, `Gallery`, `ProductGallery` | `selection`; `page-in` where a panel changes |
| `once: true` on a committed value | `Slider`, `RangeSlider`, `AngleSlider`, `Knob`, `ColorArea`, `ColorSlider`, `ColorWheel`, `QuantityStepper` | `slider-step` |
| `FieldShell` (already) | every text-entry field the table in `extend-catalogue-4.cjs` lists | `field-focus`, `field-invalid`, `field-valid` |
| `list-in` on a genuinely added item, `list-out` awaited before removal, `highlight` on a changed value | `Card` collections, `Table`/`DataTable` rows, `DataView`, `ActivityFeed`, `NotificationCentre`, `PlaylistBlock`, `ProductCard`, `CartItem`, `Review`, `RecentlyViewed`, `FileInput`/`Upload` rows, `TagsInput`/`TokenField`/`MultiSelect` chips, `Timeline` | `list-in`, `list-out`, `highlight`, `reorder` |
| `accordion-in`/`-out` on `aria-expanded` | `Spoiler`, `OrganizationChart`, `NavigationTree` (partly there) | `accordion-in`, `accordion-out` |
| `media-in` on decode/ready | `ImageList`, `VideoPlayer`, `AudioPlayer`, `Gallery`, `Lightbox`, `ProductGallery` | `media-in`, `caption-in` |
| `drag-pickup` on lift, `drag-settle` awaited after a valid move | `UploadZone`, `ImageCompare`, `DragHandle` (has it) | `drag-pickup`, `drag-settle` |
| `progress-change` on a committed value; `success` on real completion | `RingProgress`, `SemiCircleProgress`, `MeterGroup`, `Result`, `FileInput`/`Upload` | `progress-change`, `success` |
| `attention` on a status *change*, never on mount | `Badge`, `OverlayBadge`, `DiscountBadge`, `Banner` | `attention`, `toast-in`/`-out` for `Banner` |
| `page-in`/`page-out` on a committed route or view change | `MasterDetail`, `FocusMode`, `OnboardingBlock`, the five state screens | `page-in`, `page-out` |
| `resize-settle` after a measured size change | `SplitView`, `ResizableTable` | `resize-settle` |
| `drawer-in`/`-out` | `FloatingWindow`, `CartDrawer` | `drawer-in`, `drawer-out` |
| `skeleton-resolve` when data arrives | `LoadingScreen` | `skeleton-resolve` |

Each binding is bound to **state**, never to a pointer event, and never plays on
the mount that is not an arrival — the rule every existing binding here follows.
The three motion gaps that are Meridian's — D-19's continuous indicators, R-21's
mark enter, D-21's hover — stay as they are until ruled on; the loader, skeleton
and progress keep their `--cr-flow` stand-in.

### 3.5 Delete the guard

`src/styles/coreVersion.test.ts` goes last, after `verify:appearance` has the
per-surface checks and they have each been planted red once.

---

## 4. What to check in a browser, not in jsdom

Every motion binding in phase A changes something jsdom cannot see. Before this
ships, in Storybook against a real browser:

- Open a menu, a popover, a tooltip and a hover card: each arrives (a coalesce or
  meniscus settling), none jumps.
- Toggle a checkbox and a radio by keyboard: the box plays the iris; the label
  does not move.
- Open and close a dialog: the scrim reveals from the left edge and withdraws
  toward the right; the surface fades on close; focus returns. Under
  `prefers-reduced-motion: reduce`, the dialog appears and disappears instantly
  and still returns focus.
- A menu inside a dialog is Haze; a menu on the page is Frost with the panel
  shadow; a tooltip is Frost with no Haze pad inside it.

`verify:behaviour` should gain the dialog's wash (read the running animation's
first `clip-path` keyframe, as it already reads the view stack's), and
`verify:appearance` should gain the overlay materials.

---

## 5. Integration note for consumers

Two things a product using this library has to do that the README did not say,
found while measuring:

1. **Import Crystal's stylesheets once**, before this library's:
   `@crystal-ui/core/theme` then `@crystal-ui/core/css`. Every bare `<button>` in
   this library is painted by Crystal's element rule; without the import it is a
   user-agent button.
2. **Do not set `background: transparent` on a Crystal-painted control** to make
   it bare. Wear `cr-bare` (2.2.0) — or, until then, this library's
   `bare-control` mixin — because a transparent background removes one of five
   layers.
