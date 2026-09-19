/* Render the same material in Crystal and in Crystal React, and compare.
 *
 * This is the aesthetic drift check. Not "does the token have the right value" —
 * `lint:tokens` and the round-trip gate already cover that, and both passed
 * throughout the period in which every Resin surface in this library rendered
 * without its optical rims and at half Crystal's elevation. A value can be
 * correct in a token and never reach a pixel.
 *
 * So both sides are *rendered*: Crystal's own preview at one origin, Crystal
 * React's Storybook at another, the same material in each, and the computed
 * style compared property by property. Neither side is written down here. If
 * Crystal changes, the expectation changes with it, which is the only way a
 * parity check stays true.
 *
 * What it caught on its first run is what it exists for: Crystal React painted
 * Resin with `--cr-shadow-content` — two layers, no rims, half the elevation —
 * where Crystal paints `--cr-shadow-float`, which is four. Meridian saw it before
 * any gate did, which is the argument for having one.
 *
 *   node scripts/verify-materials.mjs
 *   CRYSTAL_ORIGIN=… STORYBOOK_ORIGIN=… node scripts/verify-materials.mjs
 */
import { chromium } from 'playwright';

const CRYSTAL = process.env['CRYSTAL_ORIGIN'] ?? 'http://127.0.0.1:4321';
const STORYBOOK = process.env['STORYBOOK_ORIGIN'] ?? 'http://127.0.0.1:6006';

/* Compared in Prism light at Crystal's own defaults, which is what the approved
   baseline was captured at. The story pins its environment rather than trusting
   the toolbar, so a reviewer who left it in dark mode does not fail the build. */
const STORY = 'materials-parity--every-material';

/* What is compared, and what is deliberately not.
 *
 * `backdropFilter`, `boxShadow`, `backgroundColor` and `border` are the material.
 * Geometry is not: Crystal's preview and a Storybook example are different
 * compositions at different sizes, and a radius or a padding difference between
 * them is a layout choice rather than a material drift. */
const MATERIAL = ['backdropFilter', 'boxShadow', 'backgroundColor', 'borderColor', 'borderWidth'];

/* Each pair is one material: where Crystal renders it, and where this library
   does. Crystal's side uses its own primitive classes, which are the exported
   contract — `.cr-frost`, `.cr-resin`, `.cr-haze`, `.cr-plastic`. */
/* The `:not()` chains are load-bearing. `controls.css` styles `.cr-resin-haze`,
   `.cr-control`, `.cr-field-shell` and every bare `button` with the Resin recipe,
   so the first `.cr-haze` on the playground is a control wearing Haze's class and
   Resin's shadow. Comparing against it reports a drift that is really a mismatched
   specimen — which is its own kind of gate that guards nothing. */
const PAIRS = [
  {
    material: 'resin',
    crystal: '.cr-resin:not(button):not(.cr-control):not(.cr-field-shell)',
    react: '[data-material="resin"]',
  },
  { material: 'frost', crystal: '.cr-frost:not(button):not(.cr-control)', react: '[data-material="frost"]' },
];

/* Haze is not in that list, and its absence is the honest thing rather than the
   convenient one.
 *
 * Crystal's preview has no bare Haze specimen to compare against: every
 * `.cr-haze` there is either an unpainted wrapper carrying the class, or an
 * element `controls.css` has also given the Resin recipe. Comparing against
 * either measures the wrong thing, and a gate that reports a drift which is
 * really a mismatched specimen is worse than one that admits a gap.
 *
 * A declared pair that cannot be compared *fails* — so a specimen disappearing
 * from Crystal is caught. An undeclared one is a gap in this file, where somebody
 * reading it can see it. Closing this needs a bare Haze surface in Crystal's own
 * preview; the parity story here already has one waiting for it. */

/* Differences that are known, explained and somebody's decision.
 *
 * One entry, and it is not this library's defect: Crystal has two Resin shadows.
 * `--cr-shadow-float`, the exported token every platform gets, and a bespoke
 * recipe written into `controls.css`, which is what the preview renders and
 * therefore what the approved baseline shows. They disagree on rim depth, on the
 * lower rim's colour, and on the elevation's colour and spread.
 *
 * `controls.css` is not exported — that was D-1's fix — so a platform library
 * following the token cannot reproduce the blessed appearance. Which of the two
 * is the specification is Meridian's call, recorded as M-4. Crystal React follows
 * the token, which is the contract it is given.
 *
 * Named rather than pattern-matched, and announced rather than hidden: a list
 * somebody has to add to is a list somebody thinks about, and an allowance that
 * prints nothing is a gate quietly switched off. */
const KNOWN = new Map([
  ['resin.boxShadow', 'M-4: Crystal\'s exported --cr-shadow-float and its blessed controls.css rendering disagree'],
]);

const failures = [];
const allowed = [];
const compared = [];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const measure = async (url, ready, pairs, side) => {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector(ready, { timeout: 10000 });
  await page.waitForTimeout(600);
  return page.evaluate(({ list, props, which }) => {
    const out = {};
    for (const pair of list) {
      /* The first match that actually *paints*. Crystal's preview uses several of
         these classes on bare wrappers that carry the name and no fill, and
         comparing against one of those reports a drift that is really a
         mismatched specimen — a gate measuring the wrong thing rather than the
         wrong value. A material that paints nothing is not a specimen of it. */
      const element = [...document.querySelectorAll(pair[which])].find((candidate) => {
        const style = getComputedStyle(candidate);
        return style.backgroundColor !== 'rgba(0, 0, 0, 0)' || style.backdropFilter !== 'none';
      });
      if (!element) { out[pair.material] = null; continue; }
      const style = getComputedStyle(element);
      const record = {};
      for (const property of props) record[property] = style[property];
      out[pair.material] = record;
    }
    return out;
  }, { list: pairs, props: MATERIAL, which: side });
};

/* The playground, because it is where Crystal renders the primitives as real UI
   on a real foundation — `materials.html` describes them and uses none of the
   classes. It is also the page the reference scene Meridian sent comes from. */
const theirs = await measure(`${CRYSTAL}/playground.html`, '.cr-frost', PAIRS, 'crystal');
const ours = await measure(
  `${STORYBOOK}/iframe.html?id=${STORY}&viewMode=story`,
  '#storybook-root [data-material]',
  PAIRS,
  'react',
);

for (const { material } of PAIRS) {
  const mine = ours[material];
  const crystal = theirs[material];
  if (!crystal) { failures.push(`${material}: Crystal's own preview has no such surface to compare against`); continue; }
  if (!mine) { failures.push(`${material}: the parity story renders no [data-material="${material}"]`); continue; }

  for (const property of MATERIAL) {
    compared.push(`${material}.${property}`);
    if (mine[property] !== crystal[property]) {
      const key = `${material}.${property}`;
      const known = KNOWN.get(key);
      const detail = `${key} has drifted\n      Crystal: ${crystal[property]}\n      React:   ${mine[property]}`;
      if (known) allowed.push(`${detail}\n      known:   ${known}`);
      else failures.push(detail);
    }
  }
}

await browser.close();

console.log(JSON.stringify({
  suite: 'material parity with Crystal',
  crystal: CRYSTAL,
  comparisons: compared.length,
  allowed,
  failures,
}, null, 2));

if (allowed.length) {
  console.log(`\n${allowed.length} known difference(s), each somebody's decision rather than a defect:`);
  for (const entry of allowed) console.log(`  - ${entry}`);
}

if (failures.length) {
  console.error('\nA material renders differently here than it does in Crystal.');
  console.error('Crystal is the acceptance standard (AGENTS.md, "Visual authority"): a difference');
  console.error('is a defect in this library until someone shows it is a defect in Crystal.');
  process.exit(1);
}
