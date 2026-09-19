/* Measure what a finger actually lands on, in a real browser.
 *
 * Crystal's floor is 44px, and the catalogue states it per component — "44px
 * minimum", "44px targets on touch". Nothing in this library checked it, and the
 * reason is worth stating because it generalises: **jsdom reports every box as
 * zero**, so a `getBoundingClientRect` assertion in a vitest test passes on a
 * control of any size, including one that does not exist. axe does not measure
 * either; SC 2.5.8's 24px floor is not what Crystal claims, and axe has no rule
 * for it regardless. A screenshot shows the paint, not the hit area.
 *
 * So a control could be half the size it promises, in every story, with the unit
 * tests green and the frames blessed. The tab strip was: the strip measured
 * 45.6px and each tab inside it 36px, from the day the segmented control shipped.
 *
 * What is measured is the **hit area**, not the box. Crystal reaches the floor in
 * two ways: some controls are 44px tall, and some are shorter with a pseudo-
 * element restoring the target — a breadcrumb in a line of caption text, a pill
 * inside a strip that is itself 44px. Both are correct and only one is visible in
 * a box measurement, so this probes points instead: it asks the document what is
 * at the four edges of a 44px box centred on the control, and the control passes
 * if it is what answers.
 *
 * It starts no server. Point it at a running `pnpm storybook`, or — as CI does —
 * at `storybook-static` served over HTTP, which is deterministic and free of the
 * stale-transform class of false defect a dev server can produce.
 *
 *   node scripts/verify-targets.mjs
 *   STORYBOOK_ORIGIN=http://127.0.0.1:6006 node scripts/verify-targets.mjs
 */
import { chromium } from 'playwright';

const ORIGIN = process.env['STORYBOOK_ORIGIN'] ?? 'http://127.0.0.1:6006';
const FLOOR = 44;

/* Each entry is a story and the controls in it that must reach the floor.
 *
 * Deliberately a list rather than "every interactive element in every story":
 * a story may deliberately contain a link in running prose, which is text and
 * not a target, and a blanket sweep would either fail on those or need an
 * exclusion list longer than this one. What is here is what the catalogue names.
 */
const CASES = [
  { story: 'navigation-tabs-and-breadcrumbs--tab-strip', selector: '[role="tab"]', why: 'catalogue: pill tabs, 44px minimum' },
  { story: 'navigation-tabs-and-breadcrumbs--vertical', selector: '[role="tab"]', why: 'catalogue: pill tabs, 44px minimum' },
  { story: 'navigation-tabs-and-breadcrumbs--trail', selector: 'nav a', why: 'catalogue: 44px targets on touch' },
  { story: 'navigation-tabs-and-breadcrumbs--collapsed-trail', selector: 'nav a, nav button', why: 'catalogue: 44px targets on touch' },
  /* The label, not `[role=radio]`. React Aria's radio is a visually-hidden 1px
     input inside the label, so the element ARIA names and the element a finger
     meets are different nodes — and probing the named one would report every
     segmented control in Crystal as a 1px target. */
  { story: 'navigation-tabs-and-breadcrumbs--the-same-strip-with-different-semantics', selector: '[role="radiogroup"] label', why: 'a pill in a strip, same floor' },
];

/* Probe inside the 44px box rather than on its edge: a point exactly on a
   boundary belongs to whichever box the engine rounds it into, and that is not
   what this is asking about. One pixel in is unambiguous. */
const INSET = 1;

const failures = [];
let probes = 0;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

for (const { story, selector, why } of CASES) {
  await page.goto(`${ORIGIN}/iframe.html?id=${story}&viewMode=story`, { waitUntil: 'networkidle' });
  await page.waitForSelector(selector);

  const results = await page.$$eval(
    selector,
    (nodes, { floor, inset }) => nodes.map((node) => {
      const r = node.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const half = floor / 2 - inset;
      /* `elementsFromPoint`, not `elementFromPoint`: a pseudo-element hit is
         reported as its originating element, and so is a child — so the control
         passes if it appears anywhere in the stack at that point. */
      const hits = (x, y) => document.elementsFromPoint(x, y).some((el) => el === node || node.contains(el));
      /* Growing a hit area is how a small target reaches the floor, and it is
         also how one target starts stealing another's taps. The topmost element
         at each probe point has to be this control: being *somewhere* in the
         stack is not enough, because the pointer goes to whatever is on top. */
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
    { floor: FLOOR, inset: INSET },
  );

  for (const r of results) {
    probes += 1;
    const short = ['top', 'bottom', 'left', 'right'].filter((edge) => !r[edge]);
    if (short.length) {
      failures.push(
        `${story} ${selector} "${r.name}": box ${r.box}, but the ${short.join(' and ')} of a `
        + `${FLOOR}px target is not on it, or belongs to a different control — ${why}`,
      );
    }
  }
}

await browser.close();

console.log(JSON.stringify({ suite: 'target size', floor: `${FLOOR}px`, probes, failures }, null, 2));
if (failures.length) {
  console.error('\nA control does not reach Crystal\'s target floor.');
  console.error('Either make it taller or restore the hit area with a pseudo-element, as the');
  console.error('breadcrumb links and the strip pills do.');
  process.exit(1);
}
