/* Measure what a finger actually lands on, in a real browser.
 *
 * Crystal's floor is 44px, and the catalogue states it per component: "44px
 * minimum", "44px targets on touch". Unit tests cannot check it, because jsdom
 * reports every box as zero, so a `getBoundingClientRect` assertion in a vitest
 * test passes on a control of any size, including one that does not exist. axe
 * does not measure it either: SC 2.5.8's 24px floor is not what Crystal claims,
 * and axe has no rule for it regardless. A screenshot shows the paint, not the
 * hit area.
 *
 * What is measured is the hit area. Crystal reaches the floor in two ways: some
 * controls are 44px tall, and some are shorter with a pseudo-element restoring
 * the target (a breadcrumb in a line of caption text, a pill inside a strip that
 * is itself 44px). A box measurement sees only the first, so this probes points:
 * it asks the document what is at the four edges of a 44px box centred on the
 * control, and the control passes if it is what answers.
 *
 * It starts no server. Point it at a running `pnpm storybook`, or, as CI does, at
 * `storybook-static` served over HTTP, which is deterministic and free of the
 * stale-transform false defects a dev server can produce.
 *
 *   node scripts/verify-targets.mjs
 *   STORYBOOK_ORIGIN=http://127.0.0.1:6006 node scripts/verify-targets.mjs
 */
import { chromium } from 'playwright';

const ORIGIN = process.env['STORYBOOK_ORIGIN'] ?? 'http://127.0.0.1:6006';
const FLOOR = 44;

/* Each entry is a story and the controls in it that must reach the floor.
 *
 * A list rather than "every interactive element in every story": a story may
 * contain a link in running prose, which is text and not a target, and a blanket
 * sweep would either fail on those or need an exclusion list longer than this
 * one. What is here is what the catalogue names.
 */
const CASES = [
  { story: 'navigation-tabs-and-breadcrumbs--tab-strip', selector: '[role="tab"]', why: 'catalogue: pill tabs, 44px minimum' },
  { story: 'navigation-tabs-and-breadcrumbs--vertical', selector: '[role="tab"]', why: 'catalogue: pill tabs, 44px minimum' },
  { story: 'navigation-tabs-and-breadcrumbs--trail', selector: 'nav a', why: 'catalogue: 44px targets on touch' },
  { story: 'navigation-tabs-and-breadcrumbs--collapsed-trail', selector: 'nav a, nav button', why: 'catalogue: 44px targets on touch' },
  /* The label, not `[role=radio]`. React Aria's radio is a visually-hidden 1px
     input inside the label, so the element ARIA names and the element a finger
     meets are different nodes. Probing the named one would report every
     segmented control in Crystal as a 1px target. */
  { story: 'navigation-tabs-and-breadcrumbs--the-same-strip-with-different-semantics', selector: '[role="radiogroup"] label', why: 'a pill in a strip, same floor' },
  { story: 'navigation-links--destinations', selector: '#storybook-root a', why: 'catalogue: pill; minimum 44px target' },
  { story: 'navigation-hierarchies--files', selector: '[role="row"] > * > div', why: 'a tree row is a target' },
  /* 24, not 44. The catalogue asks for "44px targets on touch" on the
     breadcrumb trail and for nothing of the kind on the table of contents. A
     trail is a row, so a grown crumb lands in the separator gap; a contents list
     is a column, so a grown entry reaches into its neighbours, which the
     ownership check below rejects. Overlapping targets are worse than small
     ones. The entries reach the full target under a coarse pointer, which this
     run does not emulate; what is held here is WCAG 2.5.8's floor, which applies
     to everything. */
  { story: 'navigation-hierarchies--contents', selector: '#storybook-root nav a', floor: 24, why: 'WCAG 2.5.8: a target in a list clears 24px and does not overlap its neighbours' },

  /* Slice I's destination shells (R-18). This gate measures only components
     that have a story; a component without one is not measured at all. */
  { story: 'navigation-rails-and-bars--rail', selector: '#storybook-root nav a', why: 'catalogue: a destination is a 44px target' },
  /* Collapsed is its own story because this gate addresses a story ID, and a
     state reachable only by toggling a control is unreachable from here. The
     label is hidden and the target must not be. */
  { story: 'navigation-rails-and-bars--collapsed', selector: '#storybook-root nav a', why: 'a collapsed rail hides the label, not the hit area' },
  { story: 'navigation-rails-and-bars--dock-bar', selector: '#storybook-root nav a', why: 'catalogue: a dock destination is a 44px target' },
  { story: 'navigation-rails-and-bars--bottom-bar', selector: '#storybook-root nav a', why: 'catalogue: 44px targets on touch, and a bottom bar is touch' },

  { story: 'navigation-pagination-and-steps--pages', selector: '#storybook-root nav button', why: 'a page control is a target, and a row of them is where they start stealing each other' },
  { story: 'navigation-pagination-and-steps--steps', selector: '#storybook-root ol button', why: 'a step that can be returned to is a control' },

  { story: 'navigation-menu-bars--bar', selector: '#storybook-root [role="menubar"] button', why: 'a menu trigger is a target' },
  /* Its own section triggers, which are disclosures over panels of links. */
  { story: 'navigation-menu-bars--sections', selector: '#storybook-root nav button', why: 'a navigation-menu section trigger is a target' },
  /* The burger alone, selected by the element it controls. A blanket `button`,
     or `button[aria-expanded]` (which a section trigger also carries), matches
     buttons inside the navigation this discloses, which is `hidden` and
     therefore 0x0, and reports a correct component as failing. Narrow the
     selector; do not loosen the floor. */
  { story: 'navigation-menu-bars--disclosure', selector: '#storybook-root button[aria-controls="burger-nav"]', why: 'catalogue: the burger is the whole navigation on a narrow layout' },

  /* Slice J's three interactive rows. Each has a floor the catalogue states in
     words ("header meets 44px" for the accordion) or inherits by being a control
     in a column, where a short target is hardest to hit and easiest to ship. */
  { story: 'data-display-accordion--default', selector: '#storybook-root button', why: 'catalogue: an accordion header meets 44px' },
  { story: 'data-display-list--selected', selector: '#storybook-root li a', why: 'an interactive row is a target, and a column of them is where a short one hides' },
  { story: 'data-display-spoiler--default', selector: '#storybook-root button', why: 'the reveal control is an action, and actions are pills at the floor' },

  /* The handle, not `[role=slider]`. React Aria puts the real input in a
     visually-hidden 1px box inside the handle, so probing the named element
     would report a 1px target on a control the catalogue states at 44px. The
     segmented control's radio above has the same problem. The handle carries
     `data-cr-handle` so it can be selected here. */
  { story: 'data-display-image-compare--default', selector: '#storybook-root [data-cr-handle]', why: 'catalogue: the compare handle is a pill and reaches 44px' },

  /* The resizer's wrapper, not `[role=slider]`: React Aria's real input is a
     visually-hidden box inside it. The grip is drawn as a line, so the hit area
     is grown, and it extends inward over the header rather than straddling the
     boundary, where it would steal the neighbouring header's presses. The
     ownership check below fails if it straddles. */
  { story: 'data-display-resizable-table--default', selector: '#storybook-root [role="columnheader"] [data-resizable-direction]', why: 'catalogue: the resizer is a 44px target that does not shift the column it borders' },

  /* Charts. Three targets, each for a different reason.

     A legend entry is a control the catalogue states as a pill that reaches 44px,
     and it is the one chart control a pointer is expected to use.

     A chart point's drawn mark is smaller than its target: Crystal's point scale
     starts at 6px, and a thumb does not hit a 6px dot. The hit area is an
     invisible square round every point, so nothing on screen changes if it is
     dropped, and this check is what catches it.

     The table disclosure opens the text equivalent of every chart in the
     library. If it is not reachable, the data is not either. */
  { story: 'charts-chart-legend--toggling', selector: '#storybook-root button', why: 'catalogue: legend entries are pills and reach 44px' },
  { story: 'charts-scatter-chart--default', selector: '#storybook-root [role="graphics-symbol"] rect', why: 'a 6px point on Crystal\'s point scale still owes a 44px hit area' },
  { story: 'charts-bar-chart--grouped', selector: '#storybook-root summary', why: 'the control that opens the text equivalent every chart owes' },
  /* Slice L. The catalogue states the floor for the banner's dismiss outright
     ("the dismiss control is a 44px pill"), and an alert's is the same control
     doing the same job, so it is held to the same number. Both are a small glyph
     in a large target, and the drawn × does not show how much of the target a
     fingertip meets. */
  { story: 'feedback-banner--dismissible', selector: '#storybook-root button', why: 'catalogue: the dismiss control is a 44px pill' },
  { story: 'feedback-alert--dismissible', selector: '#storybook-root button', why: 'the same control, doing the same job, at the same floor' },
  /* Slice M. "Pill; 44px targets throughout" is the transport's own entry. Every
     control on a media bar is a small glyph, and the bar is where controls are
     most often made smaller still. */
  { story: 'media-media-controls--with-volume-and-skip', selector: '#storybook-root button', why: 'catalogue: pill; 44px targets throughout' },
  { story: 'media-lightbox--from-a-thumbnail', selector: '#storybook-root button', why: 'the control that opens a viewer is an ordinary action' },

  /* Slice N. The quantity stepper is the one catalogue entry that says both
     controls reach 44px, each one rather than the pair. `NumberInput` decides
     the opposite for its chevrons. The catalogue's reason: the stepper is
     pressed with a thumb, beside a Remove control it must not be mistaken for. */
  { story: 'commerce-quantity-stepper--default', selector: '#storybook-root button', why: 'catalogue: pill; both controls reach 44px' },
];

/* Left out of the list: `navigation-links--in-running-text`. An anchor in a
   sentence is text, and WCAG 2.5.5 exempts a target whose size is constrained by
   the line-height of the text around it for that reason. Giving each link in a
   paragraph a 44px box would make neighbouring links on adjacent lines overlap.
   The catalogue asks for 44px on the nav link and not on the anchor, and that
   difference is intended. */

/* Probe inside the 44px box rather than on its edge: a point exactly on a
   boundary belongs to whichever box the engine rounds it into. One pixel in is
   unambiguous. */
const INSET = 1;

const failures = [];
let probes = 0;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

for (const { story, selector, why, floor = FLOOR } of CASES) {
  await page.goto(`${ORIGIN}/iframe.html?id=${story}&viewMode=story`, { waitUntil: 'networkidle' });
  await page.waitForSelector(selector);

  const results = await page.$$eval(
    selector,
    (nodes, { floor, inset }) => nodes.map((node) => {
      const r = node.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const half = floor / 2 - inset;
      /* `elementsFromPoint`, not `elementFromPoint`. A pseudo-element hit is
         reported as its originating element, and a child counts as the control,
         so the control passes if it appears anywhere in the stack at that point. */
      const hits = (x, y) => document.elementsFromPoint(x, y).some((el) => el === node || node.contains(el));
      /* Growing a hit area is how a small target reaches the floor, and it is
         also how one target starts stealing another's taps. The topmost element
         at each probe point has to belong to this control, because the pointer
         goes to whatever is on top. */
      const owns = (x, y) => {
        const top = document.elementsFromPoint(x, y)[0];
        if (!top) return false;
        const owner = top.closest('a, button, label, [role="tab"], [role="radio"]');
        return owner === null || owner === node || node.contains(owner) || owner.contains(node);
      };
      const probe = (x, y) => hits(x, y) && owns(x, y);
      return {
        name: (node.textContent || node.getAttribute('aria-label') || '?').trim().slice(0, 32),
        box: `${Math.round(r.width)}×${Math.round(r.height)}`,
        top: probe(cx, cy - half),
        bottom: probe(cx, cy + half),
        left: probe(cx - half, cy),
        right: probe(cx + half, cy),
      };
    }),
    { floor, inset: INSET },
  );

  for (const r of results) {
    probes += 1;
    const short = ['top', 'bottom', 'left', 'right'].filter((edge) => !r[edge]);
    if (short.length) {
      failures.push(
        `${story} ${selector} "${r.name}": box ${r.box}, but the ${short.join(' and ')} of a `
        + `${floor}px target is not on it, or belongs to a different control — ${why}`,
      );
    }
  }
}

await browser.close();

/* The floor the suite is at today.
 *
 * A selector that matches nothing already fails, because `waitForSelector` times
 * out before any of this runs. This guards a selector that still matches but
 * matches fewer elements, for example when a `play` function on a probed story
 * collapses a tree and some rows stop existing.
 *
 * Fewer probes means the same checks run against less of the library. Raise this
 * when cases are added; lowering it is an edit made in the same commit. */
const LEAST_PROBES = 107;
if (probes < LEAST_PROBES) {
  failures.push(
    `${probes} controls were measured, and this suite measured ${LEAST_PROBES} `
    + 'before. Fewer probes is not a better result — it is the same checks run '
    + 'against less of the library. If the drop is deliberate, lower LEAST_PROBES '
    + 'in the same commit and say why.',
  );
}

console.log(JSON.stringify({
  suite: 'target size', floor: `${FLOOR}px default`, probes, least: LEAST_PROBES, failures,
}, null, 2));
if (failures.length) {
  console.error('\nA control does not reach Crystal\'s target floor.');
  console.error('Either make it taller or restore the hit area with a pseudo-element, as the');
  console.error('breadcrumb links and the strip pills do.');
  process.exit(1);
}
