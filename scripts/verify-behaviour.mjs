/* Drive a real browser over the behaviour that only a browser has.
 *
 * Sibling of `verify-targets.mjs` and a different subject. That one asks how big
 * a control is; this one asks what a component *does* when the page scrolls,
 * resizes, or otherwise moves — the things made of layout, which jsdom does not
 * have. jsdom reports every `getBoundingClientRect` as zero and ships no
 * `IntersectionObserver`, so a component built from geometry has, in a unit test,
 * no geometry to be built from. A test written there passes on any implementation
 * at all, including one that does nothing.
 *
 * This is not hypothetical. The table of contents' scroll spy was wrong three
 * separate ways, and each was found by running this and none was visible to its
 * twelve passing unit tests:
 *
 *   1. `rootMargin: '-20% 0px -80% 0px'` — the usual spelling of "a line a fifth
 *      of the way down" — is a band of zero height, and nothing intersects a
 *      rectangle with no area. Two of five headings were never marked.
 *   2. With a real band, the last heading was unreachable: a short final section
 *      cannot push itself to the reading line.
 *   3. Detecting the end of the scroll inside the observer callback does not
 *      help, because reaching the end is not a crossing and the callback never
 *      runs.
 *
 *   node scripts/verify-behaviour.mjs
 *   STORYBOOK_ORIGIN=http://127.0.0.1:6006 node scripts/verify-behaviour.mjs
 *
 * It starts no server. Point it at a running `pnpm storybook`, or — as CI does —
 * at `storybook-static` served over HTTP.
 */
import { chromium } from 'playwright';

const ORIGIN = process.env['STORYBOOK_ORIGIN'] ?? 'http://127.0.0.1:6006';

const failures = [];
const checks = [];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const record = (name, ok, detail) => {
  checks.push(name);
  if (!ok) failures.push(`${name}: ${detail}`);
};

/* Wait for something, and report its absence as a finding rather than as a
   thirty-second Playwright stack trace. Planting a defect proved the difference:
   a drawer that stopped being a complementary landmark failed this run by timing
   out, which says "the gate broke" where the truth was "the component did". */
const waitFor = async (description, locator) => {
  try {
    await locator.waitFor({ timeout: 5000 });
    return true;
  } catch {
    record(description, false, 'it never appeared');
    return false;
  }
};

/* ---------------------------------------------------------- scroll spy */

await page.goto(
  `${ORIGIN}/iframe.html?id=navigation-hierarchies--scroll-spy&viewMode=story`,
  { waitUntil: 'networkidle' },
);
await page.waitForSelector('#storybook-root nav');

const spy = await page.evaluate(async () => {
  const root = document.querySelector('#storybook-root');
  const column = root.querySelector('[style*="overflow"]');
  const active = () => {
    const entry = root.querySelector('[aria-current="location"]');
    return entry ? entry.textContent : null;
  };
  const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });
  const entries = [...root.querySelectorAll('nav a')].map((a) => a.textContent);
  const max = column.scrollHeight - column.clientHeight;

  /* Walked in small steps rather than jumped: a spy can be right at the two ends
     and stale everywhere between, which is exactly what the first one did. */
  const seen = [];
  for (let step = 0; step <= 20; step += 1) {
    column.scrollTop = Math.round((max * step) / 20);
    /* eslint-disable-next-line no-await-in-loop */
    await sleep(120);
    const now = active();
    if (seen[seen.length - 1] !== now) seen.push(now);
  }
  return { entries, seen, max };
});

record(
  'the scroll spy marks an entry at all',
  spy.seen.length > 0 && spy.seen[0] !== null,
  `nothing was ever marked across the scroll (entries: ${spy.entries.join(', ')})`,
);

record(
  'the scroll spy reaches every entry, including the last',
  spy.entries.every((entry) => spy.seen.includes(entry)),
  `marked ${JSON.stringify(spy.seen)} but the list holds ${JSON.stringify(spy.entries)} — `
  + 'an entry no scroll position can mark is one the reader can never see marked',
);

record(
  'the scroll spy marks entries in reading order',
  spy.seen.join('>') === spy.entries.filter((entry) => spy.seen.includes(entry)).join('>'),
  `marked ${JSON.stringify(spy.seen)}, which is not the order they appear in`,
);

record(
  'the scroll spy never unmarks everything mid-scroll',
  !spy.seen.slice(1).includes(null),
  `the marking went blank partway down: ${JSON.stringify(spy.seen)}`,
);

/* ------------------------------------------------- tree expansion motion */

await page.goto(
  `${ORIGIN}/iframe.html?id=navigation-hierarchies--expanding-is-motion&viewMode=story`,
  { waitUntil: 'networkidle' },
);
await page.waitForSelector('#storybook-root [role="treegrid"]');

/* Nothing in Crystal moves at rest. A tree that animates its own rows into
   existence on load is the clearest possible violation, and it is invisible in a
   screenshot taken after the animation has finished.
   
   `useMotion` sets `data-cr-motion-state` to "running" and then to "finished"
   rather than clearing it, which is what makes this checkable at all: the
   attribute is a record that an animation *happened*, not a report of one in
   flight. So probing after the page has settled still catches a tree that
   animated itself and then stopped. Proved by making the tree live from its
   first render — three rows, caught. */
const atRest = await page.evaluate(() => {
  const root = document.querySelector('#storybook-root');
  return [...root.querySelectorAll('[data-cr-motion-state]')]
    .map((el) => `${el.dataset.crMotionName ?? '?'}:${el.dataset.crMotionState}`);
});
record(
  'a tree does not animate the rows it rendered with',
  atRest.length === 0,
  `${atRest.length} row(s) had animated with nobody having touched the page: ${JSON.stringify(atRest)}`,
);

/* --------------------------------------------------- modality must be real */

/* The catalogue states it for the drawer in those words, and it is the rule that
   cannot be checked where the rest of the drawer is. React Aria marks modality
   with the **`inert` attribute** on everything outside the overlay — which
   removes the page from the tab order and from the accessibility tree at once,
   rather than `aria-modal`, which claims the first and delivers neither. jsdom
   does not apply it, so a unit test sees a drawer that looks modal and cannot
   tell whether anything behind it is actually blocked.
   
   Both directions are checked, because the defect has two halves: a scrim with
   no containment, and containment with no way to tell. */

await page.goto(
  `${ORIGIN}/iframe.html?id=overlays-drawer--modal&viewMode=story`,
  { waitUntil: 'networkidle' },
);
await page.waitForSelector('#storybook-root button');
await page.getByRole('button', { name: /Open the end drawer/ }).click();
await page.waitForSelector('[role="dialog"]');

const modal = await page.evaluate(() => {
  const dialog = document.querySelector('[role="dialog"]');
  const behind = [...document.querySelectorAll('button')]
    .find((button) => button.textContent === 'A control on the page');
  return {
    blocked: behind ? behind.closest('[inert]') !== null : null,
    scrims: document.querySelectorAll('[class*="scrim"]').length,
  };
});

record(
  'a modal drawer really blocks the page behind it',
  modal.blocked === true,
  modal.blocked === null
    ? 'the control that is supposed to be behind the drawer was not in the page'
    : 'the page behind is not inert — the scrim says it is unavailable and nothing makes it so',
);

record(
  'a modal drawer has the scrim its modality earns',
  modal.scrims > 0,
  'the page is blocked and nothing shows it',
);

await page.goto(
  `${ORIGIN}/iframe.html?id=overlays-drawer--not-modal&viewMode=story`,
  { waitUntil: 'networkidle' },
);
/* By role, not by selector: `aside` maps to `complementary` implicitly and a CSS
   attribute selector cannot see an implicit role. */
const inlineDrawerAppeared = await waitFor(
  'a non-modal drawer is a complementary landmark',
  page.getByRole('complementary').first(),
);

const inline = inlineDrawerAppeared ? await page.evaluate(() => {
  const behind = [...document.querySelectorAll('button')]
    .find((button) => button.textContent === 'A control on the page');
  return {
    blocked: behind ? behind.closest('[inert]') !== null : null,
    scrims: document.querySelectorAll('[class*="scrim"]').length,
    dialogs: document.querySelectorAll('[role="dialog"]').length,
  };
}) : { blocked: null, scrims: -1, dialogs: -1 };

/* Only when the landmark was there. Reporting the two checks below against a
   drawer that never appeared adds noise to a finding that is already stated. */
if (inlineDrawerAppeared) {
  record(
    'a non-modal drawer blocks nothing',
    inline.blocked === false,
    'the page beside the panel is inert, which is a drawer that took the page away without saying so',
  );

  record(
    'a non-modal drawer draws no scrim',
    inline.scrims === 0 && inline.dialogs === 0,
    `${inline.scrims} scrim(s) and ${inline.dialogs} dialog(s) for a panel that blocks nothing — `
    + 'the appearance of modality without the behaviour is the defect the catalogue names',
  );
}

/* ------------------------------------------------ the drawer's edges */

/* "Panel radius on the inner edges only", and a panel actually attached to the
   edge it names. The second half is not obvious: pinning the holder to one edge
   and letting it shrink to fit leaves the panel anchored at the box's *start*,
   so an inline-end drawer sat 151px clear of the right-hand edge — correct
   radius, correct material, correct semantics, floating in the middle of
   nowhere. A screenshot of the whole page at one width would have shown it; a
   unit test could not, and neither could a frame captured at another width. */

await page.setViewportSize({ width: 1000, height: 700 });
await page.goto(
  `${ORIGIN}/iframe.html?id=overlays-drawer--every-edge&viewMode=story`,
  { waitUntil: 'networkidle' },
);

const EDGES = [
  { edge: 'start', flush: 'left', square: ['top-left', 'bottom-left'] },
  { edge: 'end', flush: 'right', square: ['top-right', 'bottom-right'] },
  { edge: 'top', flush: 'top', square: ['top-left', 'top-right'] },
  { edge: 'bottom', flush: 'bottom', square: ['bottom-left', 'bottom-right'] },
];

for (const { edge, flush, square } of EDGES) {
  /* eslint-disable no-await-in-loop */
  await page.getByRole('button', { name: new RegExp(`Open the ${edge} drawer`) }).click();
  if (!await waitFor(`the ${edge} drawer opens`, page.locator('[role="dialog"]'))) continue;
  /* The sweep is a second long. Measuring mid-flight measures the animation. */
  await page.waitForTimeout(1600);

  const geometry = await page.evaluate(() => {
    const panel = document.querySelector('[role="dialog"]');
    const rect = panel.getBoundingClientRect();
    const style = getComputedStyle(panel);
    return {
      left: Math.round(rect.left),
      right: Math.round(rect.right),
      top: Math.round(rect.top),
      bottom: Math.round(rect.bottom),
      width: window.innerWidth,
      height: window.innerHeight,
      corners: {
        'top-left': style.borderTopLeftRadius,
        'top-right': style.borderTopRightRadius,
        'bottom-left': style.borderBottomLeftRadius,
        'bottom-right': style.borderBottomRightRadius,
      },
    };
  });

  const against = {
    left: geometry.left === 0,
    right: geometry.right === geometry.width,
    top: geometry.top === 0,
    bottom: geometry.bottom === geometry.height,
  };
  record(
    `the ${edge} drawer is attached to the ${flush} edge`,
    against[flush],
    `its ${flush} edge is at ${geometry[flush]} in a ${geometry.width}×${geometry.height} `
    + 'viewport — a drawer floating clear of the edge it is named for',
  );

  const squared = square.every((corner) => geometry.corners[corner] === '0px');
  const rounded = Object.entries(geometry.corners)
    .filter(([corner]) => !square.includes(corner))
    .every(([, value]) => value !== '0px');
  record(
    `the ${edge} drawer rounds its inner edges only`,
    squared && rounded,
    `corners ${JSON.stringify(geometry.corners)} — the outer edge is flush against the `
    + 'viewport, and rounding it shows a sliver of page through a corner that is the screen\'s own',
  );

  await page.keyboard.press('Escape');
  await page.waitForTimeout(900);
  /* eslint-enable no-await-in-loop */
}

await browser.close();

console.log(JSON.stringify({ suite: 'browser behaviour', checks: checks.length, failures }, null, 2));
if (failures.length) {
  console.error('\nA component behaved differently in a browser than its unit tests can see.');
  process.exit(1);
}
