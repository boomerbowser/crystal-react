/* Render the same material in Crystal and in Crystal React, and compare.
 *
 * This is the aesthetic drift check. Token values are covered by `lint:tokens`
 * and the round-trip gate; this checks that the values reach a pixel, which a
 * correct token does not guarantee.
 *
 * Both sides are rendered: Crystal's own preview at one origin, Crystal React's
 * Storybook at another, the same material in each, and the computed style
 * compared property by property. Neither side is written down here, so when
 * Crystal changes, the expectation changes with it.
 *
 * Resin takes `--cr-shadow-float`, which has four layers. `--cr-shadow-content`
 * has two layers, no rims and half the elevation, and must not be used for Resin.
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

/* What is compared.
 *
 * `backdropFilter`, `boxShadow`, `backgroundColor` and `border` are the material.
 * Geometry is left out: Crystal's preview and a Storybook example are different
 * compositions at different sizes, so a radius or padding difference between
 * them is a layout choice. */
const MATERIAL = ['backdropFilter', 'boxShadow', 'backgroundColor', 'borderColor', 'borderWidth'];

/* The Haze content fill, which lives on a pseudo-element (R-15). Crystal holds an
 * 80% reading fill on an isolated `::before` behind every Resin control's label,
 * inset from the rim so the glass edge still reads. A check that reads the
 * element's own computed style does not see it.
 *
 * `content` comes first because a pseudo-element with no `content` does not
 * exist, yet every other property on it still computes to a plausible value.
 * Checking the colour without `content` compares the style of something that was
 * never painted.
 *
 * The inset is read as four longhands, because browsers do not reliably
 * serialise `inset` back from the shorthand. */
const HAZE_LAYER = ['content', 'backgroundColor', 'filter', 'top', 'right', 'bottom', 'left'];

/* Each pair is one material: where Crystal renders it, and where this library
   does. Crystal's side uses its own primitive classes, which are the exported
   contract: `.cr-frost`, `.cr-resin`, `.cr-haze`, `.cr-plastic`. */
/* The `:not()` chains are required. `controls.css` styles `.cr-resin-haze`,
   `.cr-control`, `.cr-field-shell` and every bare `button` with the Resin recipe,
   so the first `.cr-haze` on the playground is a control wearing Haze's class and
   Resin's shadow. Comparing against it reports a mismatched specimen as drift. */
const PAIRS = [
  {
    material: 'resin',
    crystal: '.cr-resin:not(button):not(.cr-control):not(.cr-field-shell)',
    react: '[data-material="resin"]',
  },
  { material: 'frost', crystal: '.cr-frost:not(button):not(.cr-control)', react: '[data-material="frost"]' },
  /* A Resin control is a different specimen from a Resin surface and needs its
     own pair. The `resin` pair above excludes buttons and controls, because
     `controls.css` gives them a recipe the bare primitive does not have. The
     Haze fill exists only on those controls, so a `::before` comparison on the
     `resin` pair would compare nothing against nothing and pass. */
  /* The neutral control only. From 2.1.0 a `.primary` action tints its reading
     pad in the palette's primary, and the preview marks its main actions as
     primary, so an unfiltered selector can land on a primary button and report
     the tint as drift. */
  {
    material: 'resin-control',
    crystal: 'button.cr-button:not(.primary):not(.quiet):not(.danger)',
    react: '[data-material="resin-control"] button',
    pseudo: '::before',
    props: HAZE_LAYER,
  },
];

/* Haze has no pair.
 *
 * Crystal's preview has no bare Haze specimen to compare against: every
 * `.cr-haze` there is either an unpainted wrapper carrying the class, or an
 * element `controls.css` has also given the Resin recipe. Comparing against
 * either measures the wrong thing, so the gap is left visible here instead.
 *
 * A declared pair that cannot be compared fails, so a specimen disappearing from
 * Crystal is caught. Closing this gap needs a bare Haze surface in Crystal's own
 * preview; the parity story here already renders one. */

/* Differences that are known, explained and somebody's decision.
 *
 * Empty. Its one former entry was M-4, resolved when `controls.css` began
 * reading `--cr-shadow-float`, which carries the approved rims over its tinted,
 * elevation-responsive spread. Crystal now has one Resin shadow recipe. An entry
 * here is a difference somebody decided to live with, never a way to silence an
 * inconvenient one.
 *
 * Entries are named rather than pattern-matched, and printed on every run, so
 * an allowance is always visible. */
const KNOWN = new Map([]);

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
      /* The first match that paints. Crystal's preview uses several of these
         classes on bare wrappers that carry the name and no fill, and comparing
         against one of those reports a mismatched specimen as drift. */
      const element = [...document.querySelectorAll(pair[which])].find((candidate) => {
        const style = getComputedStyle(candidate);
        return style.backgroundColor !== 'rgba(0, 0, 0, 0)' || style.backdropFilter !== 'none';
      });
      if (!element) { out[pair.material] = null; continue; }
      /* The pair says which layer it is about. A material pair asks the element;
         a Haze pair asks the `::before` that paints behind the element's label. */
      const style = getComputedStyle(element, pair.pseudo ?? null);
      const record = {};
      for (const property of pair.props ?? props) record[property] = style[property];
      out[pair.material] = record;
    }
    return out;
  }, { list: pairs, props: MATERIAL, which: side });
};

/* The playground, because it is where Crystal renders the primitives as real UI
   on a real foundation. `materials.html` describes them and uses none of the
   classes. The playground is also the source of Meridian's reference scene. */
const theirs = await measure(`${CRYSTAL}/playground.html`, '.cr-frost', PAIRS, 'crystal');
const ours = await measure(
  `${STORYBOOK}/iframe.html?id=${STORY}&viewMode=story`,
  '#storybook-root [data-material]',
  PAIRS,
  'react',
);

/* Components that wear a Crystal surface class rather than a parity specimen,
   each measured in its own story against the same Crystal recipe. A component
   that wears the class and then overrides part of it shows up here as drift. */
const WORN = [
  { name: 'mentions suggestions', material: 'frost', story: 'inputs-richtextsurface--with-mentions', react: '#storybook-root .cr-frost' },
];
for (const worn of WORN) {
  const measured = await measure(
    `${STORYBOOK}/iframe.html?id=${worn.story}&viewMode=story`,
    worn.react,
    [{ material: worn.material, react: worn.react }],
    'react',
  );
  ours[`${worn.name}`] = measured[worn.material];
  PAIRS.push({ material: worn.name, crystalMaterial: worn.material });
}
for (const pair of PAIRS) {
  const material = pair.material;
  const mine = ours[material];
  const crystal = theirs[pair.crystalMaterial ?? material];
  if (!crystal) { failures.push(`${material}: Crystal's own preview has no such surface to compare against`); continue; }
  if (!mine) { failures.push(`${material}: the parity story renders no [data-material="${material}"]`); continue; }

  for (const property of pair.props ?? MATERIAL) {
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
