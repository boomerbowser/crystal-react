# Adopting Crystal's recipes: a re-evaluation

29 September 2026. This reviews
[`2026-09-28-adopting-crystal-2.2-recipes.md`](2026-09-28-adopting-crystal-2.2-recipes.md)
against the library at `ad7ef5c`, which depends on `@crystal-ui/core` `^2.3.0`. The
design system's half is `proposals/2026-09-29-component-recipes-re-evaluation.md`
in the Crystal repository. This adds to the guide and changes nothing in it.

## What the guide got right

Phase A shipped against 2.1.0 as written. The version guard failed on the day
2.2.0 was installed, and phase B ran that day. Every step in the guide's table of
surfaces to wear was carried out, each measured against Crystal's class planted
beside the component (R-24).

| | 28 September | 29 September |
|---|---|---|
| Component files that put a Crystal class on an element | 18 | 80 |
| Hand-written `backdrop-filter` lines | 34 | 20 |
| `bare-control` mixin | 22 uses | removed |
| Recipes played, of those Crystal publishes | 30 of 57 | 53 of 59 |
| Unit tests | 1694 | 1995 |

## What the guide got wrong

**Overlay exits.** The guide said `menu-out`, `popover-out` and `tooltip-out`
needed `AnimatePresence` around React Aria's overlay lifecycle, and called it a
structural change for a slice of its own. React Aria already holds an exiting
overlay until `getAnimations()` settles. `Departure` registers the hold and
starts the recipe, and every overlay now leaves with its exit.

**The version guard's end.** The guide said to delete `coreVersion.test.ts` at
the end of phase B. The library now plays recipes that exist only from 2.2.0,
so the file became a floor on the installed version and stays.

**Surfaces taken from the catalogue as it stood.** The guide told the docks to
wear `cr-resin` and the resizable handle to wear `cr-drag-handle`, because the
catalogue said so. Measured, the seven strips are `.cr-dock` and the handle is
Resin. Crystal corrected the catalogue (D-23) and the library wears what
renders.

**The switch.** The guide offered two options. The library took the first and
wears Crystal's native switch.

## What remains

1. **Assignments the library does not play.** 56 of the catalogue's 329
   assignments are uncredited in the manifest. R-24 records a reason for most.
   The ones with a structural reason need a ruling from Meridian, as D-28 did:
   `list-out` on `DataTable`, `ResizableTable` and `Transfer`; `accordion-out` on
   `TreeView`, `OrganizationChart`, `NavigationTree` and `Spoiler`; `page-out` on
   `MasterDetail`; `list-in` on `ComboBox`; the field recipes on `Cascader`.
2. **Composition the manifest does not credit.** `JsonInput` plays the field
   recipes through `TextArea`, and `ProductGallery` plays `media-in` through
   `Gallery` and `Lightbox`. The manifest's scan reads each component's own
   source, so both are counted as unplayed. The scan should follow imports of
   this library's own components.
3. **Assignments with no recorded reason.** `highlight` on `StatCard` and
   `KpiTile`, `press` on `ButtonGroup` and `WishlistButton`, `empty-in` on
   `EmptyScreen`, `skeleton-resolve` on `LoadingScreen`, and the recipes assigned
   to `NotificationCentre`, `PlaylistBlock`, `CartDrawer`, `CouponInput`,
   `AddressForm`, `SortSelect` and `CheckoutSteps`. Some of these are probably
   played through a child, as in item 2. Nothing records which, so each needs a
   check, and then a binding or a reason in the tracker.
4. **Hand-written material.** 26 uses of `haze-fill`, 9 of `frost`, 4 of `resin`
   and 20 hand-written `backdrop-filter` lines remain. Each is a surface to wear
   or a composition to propose upstream. They have not been sorted.
5. **The documentation website.** Slice Q has not started. The design system's
   re-evaluation suggests beginning with one page per surface.

## What this re-evaluation did not do

It changed no component. The counts come from the manifest built on 29 September
and from a search of the source at `ad7ef5c`.
