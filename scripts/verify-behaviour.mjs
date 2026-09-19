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
   screenshot taken after the animation finishes. */
const atRest = await page.evaluate(() => {
  const root = document.querySelector('#storybook-root');
  return [...root.querySelectorAll('[data-cr-motion-state]')].map((el) => el.className);
});
record(
  'a tree does not animate the rows it rendered with',
  atRest.length === 0,
  `${atRest.length} row(s) were mid-animation with nobody having touched the page`,
);

await browser.close();

console.log(JSON.stringify({ suite: 'browser behaviour', checks: checks.length, failures }, null, 2));
if (failures.length) {
  console.error('\nA component behaved differently in a browser than its unit tests can see.');
  process.exit(1);
}
