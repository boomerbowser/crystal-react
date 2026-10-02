/* Drive a real browser over the behaviour that only a browser has.
 *
 * Sibling of `verify-targets.mjs`, with a different subject. That one asks how
 * big a control is; this one asks what a component does when the page scrolls,
 * resizes or otherwise moves, which depends on layout, and jsdom has none.
 * jsdom reports every `getBoundingClientRect` as zero and ships no
 * `IntersectionObserver`, so a unit test of a component built from geometry
 * passes on any implementation, including one that does nothing.
 *
 * The table of contents' scroll spy shows three ways such a component can be
 * wrong while its unit tests pass:
 *
 *   1. `rootMargin: '-20% 0px -80% 0px'`, the usual spelling of "a line a fifth
 *      of the way down", is a band of zero height, and nothing intersects a
 *      rectangle with no area. Two of five headings are never marked.
 *   2. With a real band, the last heading is unreachable: a short final section
 *      cannot push itself to the reading line.
 *   3. Detecting the end of the scroll inside the observer callback does not
 *      help, because reaching the end is not a crossing and the callback never
 *      runs.
 *
 *   node scripts/verify-behaviour.mjs
 *   STORYBOOK_ORIGIN=http://127.0.0.1:6006 node scripts/verify-behaviour.mjs
 *
 * It starts no server. Point it at a running `pnpm storybook`, or, as CI does,
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
   thirty-second Playwright stack trace. A timeout reads as a broken gate; a
   finding says the component broke, as when a drawer stops being a
   complementary landmark. */
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
  /* Found by measuring rather than by matching a selector. A selector such as
     `[style*="overflow"]` works only if `overflowY` is an inline style, and the
     library's own `ScrollArea` sets it in CSS. So this asks the page what
     scrolls. */
  const column = [...root.querySelectorAll('*')].find((el) => (
    el.scrollHeight > el.clientHeight + 1
    && ['auto', 'scroll'].includes(getComputedStyle(el).overflowY)
  ));
  if (!column) throw new Error('the scroll-spy story renders nothing that scrolls');
  const active = () => {
    const entry = root.querySelector('[aria-current="location"]');
    return entry ? entry.textContent : null;
  };
  const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });
  const entries = [...root.querySelectorAll('nav a')].map((a) => a.textContent);
  const max = column.scrollHeight - column.clientHeight;

  /* Walked in small steps rather than jumped: a spy can be right at the two ends
     and stale everywhere between. */
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
   existence on load violates that, and a screenshot taken after the animation
   has finished does not show it.

   `useMotion` sets `data-cr-motion-state` to "running" and then to "finished"
   rather than clearing it, so the attribute records that an animation happened,
   not only one in flight. Probing after the page has settled still catches a
   tree that animated itself and then stopped. */
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

/* The catalogue states it for the drawer in those words, and it cannot be
   checked where the rest of the drawer is. React Aria marks modality with the
   `inert` attribute on everything outside the overlay, which removes the page
   from the tab order and from the accessibility tree at once. `aria-modal`
   claims the first and delivers neither. jsdom does not apply `inert`, so a unit
   test cannot tell whether anything behind a drawer is blocked.

   Both directions are checked, because the defect has two halves: a scrim with
   no containment, and containment with no visible sign. */

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

/* "Panel radius on the inner edges only", and a panel attached to the edge it
   names. Pinning the holder to one edge and letting it shrink to fit leaves the
   panel anchored at the box's start, so an inline-end drawer can sit 151px clear
   of the right-hand edge with correct radius, material and semantics. A unit
   test cannot see this, and neither can a frame captured at another width. */

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

/* ------------------------------------------- a column that actually resizes */

/* "The resizer is a slider: arrow keys resize, and the new width is announced."
 *
 * The sequence is `Enter`, then the arrows (D-18). React Aria gates the arrow
 * keys on `editModeEnabled`, which is the table's
 * `isKeyboardNavigationDisabled`: `Enter` on a focused resizer calls
 * `startResize`, which disables the grid's own arrow-key navigation and hands
 * the arrows to the resizer. Without it the keys arrive at the focused input,
 * are not `defaultPrevented`, and do nothing, however focus is set. React Aria
 * describes the resizer with "press Enter to start resizing" under keyboard
 * modality, so the affordance is announced even though it is not guessable.
 *
 * Also checked: the number the resizer announces and the width the browser draws
 * are the same. React Aria applies each computed width to its header cell as an
 * inline style, and under `table-layout: auto` a width on a cell is a suggestion
 * the browser may override from the content, so a resizer could announce a
 * width its column no longer has. The fixed layout that prevents that is React
 * Aria's own, set inline by `ResizableTableContainer`.
 */
{
  await page.goto(`${ORIGIN}/iframe.html?id=data-display-resizable-table--default&viewMode=story`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#storybook-root [role="grid"]');
  await page.waitForTimeout(300);

  const measure = () => page.evaluate(() => {
    const header = document.querySelector('#storybook-root [role="columnheader"]');
    const resizer = document.querySelector('#storybook-root [role="columnheader"] input[type="range"]');
    const table = document.querySelector('#storybook-root [role="grid"]');
    return {
      drawn: header ? Math.round(header.getBoundingClientRect().width) : 0,
      announced: resizer?.getAttribute('aria-valuetext') ?? null,
      resizing: resizer?.parentElement?.hasAttribute('data-resizing') ?? false,
      layout: table ? getComputedStyle(table).tableLayout : null,
    };
  });

  const before = await measure();

  /* The wrapper, clicked rather than `.focus()`ed, for two reasons: the grid
     takes back a programmatic focus on a cell's child, and React Aria's real
     input is a visually-hidden box inside the wrapper, so clicking the input is
     refused because the wrapper intercepts the pointer, as it should. */
  await page.locator('#storybook-root [role="columnheader"] [data-resizable-direction]').first().click();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);
  const engaged = await measure();
  for (let i = 0; i < 10; i += 1) await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(200);
  const after = await measure();

  record(
    'pressing Enter on the resizer enters resize mode',
    engaged.resizing,
    'the resizer never reported `data-resizing`, so the arrow keys below are being sent to a '
    + 'control that has not taken them — which is what React Aria gates on, not on focus',
  );
  record(
    'a column resizes from the keyboard',
    after.drawn > before.drawn,
    `the first column measured ${before.drawn}px before ten right-arrows and ${after.drawn}px after`,
  );
  record(
    'the new width is announced',
    after.announced !== before.announced && /pixels/.test(after.announced ?? ''),
    `aria-valuetext was ${before.announced} and is ${after.announced}. A resizer whose value never `
    + 'changes announces a width that is not the one on screen',
  );
  record(
    'a resizable column is laid out to an authoritative width',
    before.layout === 'fixed' && Math.abs(Number.parseInt(before.announced ?? '', 10) - before.drawn) <= 1,
    `the table's table-layout is ${before.layout}, the resizer announced ${before.announced} and the `
    + 'column measured ' + before.drawn + 'px. Under `auto` a width on a header cell is a suggestion '
    + 'the browser may override from the content',
  );
}

/* ------------------------------------- one tab stop per chart, arrows inside */

/* Every chart in the catalogue lists `focus-visible` and most say each item is
 * reachable. Reachable cannot mean one tab stop each, because a scatter of two
 * hundred points would be two hundred stops between the control before it and
 * the one after. So the plot is one stop and the marks are a roving tabindex
 * inside it.
 *
 * The marks are SVG `<g>` elements carrying `tabindex`, which is SVG 2. jsdom
 * does not enforce it: `element.focus()` on an unfocusable node is not an error
 * there, and `document.activeElement` follows. This is the only place the claim
 * is tested against an engine that decides for itself. */
{
  await page.goto(`${ORIGIN}/iframe.html?id=charts-bar-chart--grouped&viewMode=story`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#storybook-root [role="graphics-symbol"]');

  const stops = await page.evaluate(() => ({
    zero: document.querySelectorAll('#storybook-root svg [tabindex="0"]').length,
    minusOne: document.querySelectorAll('#storybook-root svg [tabindex="-1"]').length,
  }));
  record(
    'a chart is one tab stop, not one per mark',
    stops.zero === 1 && stops.minusOne > 1,
    `the plot has ${stops.zero} tab stops and ${stops.minusOne} roving marks. One stop per mark `
    + 'would put a hundred stops between the control before the chart and the one after it',
  );

  await page.locator('#storybook-root [role="graphics-symbol"]').first().focus();
  const landed = await page.evaluate(() => ({
    tag: document.activeElement?.tagName,
    label: document.activeElement?.getAttribute('aria-label'),
  }));
  record(
    'a mark takes focus at all',
    landed.tag === 'g' && Boolean(landed.label),
    `focus landed on ${landed.tag} labelled ${landed.label}. An SVG group with a tabindex is `
    + 'SVG 2, and if an engine declines it the whole keyboard model of the slice is decoration',
  );

  const first = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(60);
  const second = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  await page.keyboard.press('End');
  await page.waitForTimeout(60);
  const last = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(60);
  const past = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));

  record(
    'an arrow key moves between marks',
    Boolean(second) && second !== first,
    `focus was on ${first} and after ArrowRight it is on ${second}`,
  );
  record(
    'End reaches the last mark',
    Boolean(last) && last !== second,
    `End left focus on ${last}`,
  );
  record(
    'the ends do not wrap',
    past === last,
    `an arrow past the last mark moved focus to ${past}. Wrapping silently is how a reader `
    + 'loses their place in a chart whose shape they cannot see',
  );

  /* The tooltip's keyboard half. A chart tooltip cannot hang off hover: there
     is one focusable plot and the cursor inside it is a roving `tabindex`, so a
     reader who never touches a pointer would otherwise get no panel at all.
     jsdom cannot test this either: it has no focus of its own to follow, and
     `:focus-within` is not resolved there. */
  const panel = '#storybook-root [aria-hidden="true"][data-shown]';
  const withFocus = await page.locator(panel).count();
  record(
    'the tooltip follows the keyboard cursor, not only the pointer',
    withFocus === 1,
    `${withFocus} tooltip panels are shown while a mark has focus. A chart whose values `
    + 'appear only under a pointer has no values for anyone who does not use one',
  );

  await page.keyboard.press('Escape');
  /* Long enough for `tooltip-out`: the panel stays shown while it leaves. */
  await page.waitForTimeout(700);
  const afterEscape = await page.locator(panel).count();
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(60);
  const afterMove = await page.locator(panel).count();
  record(
    'Escape dismisses the tooltip and moving on brings it back',
    afterEscape === 0 && afterMove === 1,
    `after Escape ${afterEscape} panels are shown and after the next arrow key ${afterMove}. `
    + 'A dismissal that outlives the mark it dismissed is a chart whose tooltip never returns',
  );

  /* The focus ring has to be on the mark, not on the plot. `outline` on an SVG
     element is honoured by every engine this library gates against, and this
     reads it back to confirm.

     This does not prove whose rule painted it. Storybook loads `crystal.css`,
     which carries `[tabindex]:focus-visible { outline: … }`, so removing the
     library's own rule leaves this check green (measured). The library keeps its
     rule anyway, because a consumer who does not load Crystal's element styles
     is the case D-1 is about, and this gate cannot see that consumer. */
  const ring = await page.evaluate(() => {
    const active = document.activeElement;
    if (!active) return null;
    const style = getComputedStyle(active);
    return { width: style.outlineWidth, style: style.outlineStyle, tag: active.tagName };
  });
  record(
    'a focused mark paints a focus ring',
    ring !== null && ring.style !== 'none' && Number.parseFloat(ring.width) > 0,
    `the focused ${ring?.tag} has outline-style ${ring?.style} at ${ring?.width}`,
  );
}

/* --------------------------------------- a treemap is navigable as a tree */

/* "Navigable as a tree" is the treemap's own clause, and it cannot be checked
 * without driving it: the level changes, which no snapshot of the first render
 * shows. */
{
  await page.goto(`${ORIGIN}/iframe.html?id=charts-treemap--default&viewMode=story`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#storybook-root [role="graphics-symbol"]');

  const before = await page.evaluate(() => Array.from(
    document.querySelectorAll('#storybook-root [role="graphics-symbol"]'),
  ).map((mark) => mark.getAttribute('aria-label')?.split(',')[0]));

  await page.locator('#storybook-root [role="graphics-symbol"]').first().focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(120);

  const after = await page.evaluate(() => ({
    marks: Array.from(document.querySelectorAll('#storybook-root [role="graphics-symbol"]'))
      .map((mark) => mark.getAttribute('aria-label')?.split(',')[0]),
    crumbs: Array.from(document.querySelectorAll('#storybook-root nav li')).map((li) => li.textContent),
  }));

  record(
    'Enter descends into a branch of a treemap',
    JSON.stringify(after.marks) !== JSON.stringify(before) && after.marks.length > 0,
    `the marks were ${before.join(', ')} and after Enter they are ${after.marks.join(', ')}`,
  );
  record(
    'the breadcrumb says which level the reader is on',
    after.crumbs.length > 1,
    `the breadcrumb reads ${after.crumbs.join(' / ')}. Without it a reader who has descended `
    + 'has no way to know it, which is the difference between navigation and a picture changing',
  );

  await page.keyboard.press('Escape');
  await page.waitForTimeout(120);
  const back = await page.evaluate(() => Array.from(
    document.querySelectorAll('#storybook-root [role="graphics-symbol"]'),
  ).map((mark) => mark.getAttribute('aria-label')?.split(',')[0]));
  record(
    'Escape comes back up',
    JSON.stringify(back) === JSON.stringify(before),
    `after Escape the marks are ${back.join(', ')} and they started as ${before.join(', ')}`,
  );
}

/* ------------------------------------------ a hidden series is announced */

/* "Toggles are buttons with a pressed state; hidden series are announced." The
 * announcement is a live region, and a live region works only if it is in the
 * document before the text arrives. One rendered together with its message
 * announces nothing. */
{
  await page.goto(`${ORIGIN}/iframe.html?id=charts-chart-legend--toggling&viewMode=story`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#storybook-root button');

  const region = await page.evaluate(() => {
    const status = document.querySelector('#storybook-root [role="status"]');
    return { present: Boolean(status), text: status?.textContent ?? null };
  });
  record(
    'the legend has a live region before it has anything to say',
    region.present && !region.text,
    `the region is ${region.present ? 'present' : 'missing'} and reads "${region.text}". A live `
    + 'region rendered together with its first message announces nothing at all',
  );

  await page.locator('#storybook-root button').first().click();
  await page.waitForTimeout(120);
  const spoke = await page.evaluate(
    () => document.querySelector('#storybook-root [role="status"]')?.textContent ?? '',
  );
  record(
    'turning a series off is announced in words',
    /hidden|shown/.test(spoke),
    `the live region reads "${spoke}" after the first entry was pressed`,
  );
}

/* ------------------------------------------------- inert, and a contained tour */

/* Two claims the unit tests state and cannot check, both about the keyboard.
 *
 * jsdom does not implement `inert` for focus: a `<button>` inside an inert
 * subtree is still focusable there, so `LoadingOverlay`'s "focus does not enter
 * it" passes in jsdom whether the attribute is `inert` or `aria-hidden`.
 * `aria-hidden` is the broken version, because it hides the region from a
 * screen reader while leaving every control in the tab order.
 *
 * `aria-modal="true"` on the tour is a claim about the keyboard. The scrim
 * covers the page and blocks the mouse, but not Tab, and a tour that let Tab
 * reach the control it is spotlighting would tell assistive technology
 * something false. */
{
  await page.goto(`${ORIGIN}/iframe.html?id=feedback-loading-overlay--blocked&viewMode=story`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#storybook-root [data-cr-blocked="true"]');
  await page.evaluate(() => { document.body.focus(); });
  const reached = [];
  for (let press = 0; press < 6; press += 1) {
    /* eslint-disable no-await-in-loop -- tabbing is a sequence */
    await page.keyboard.press('Tab');
    reached.push(await page.evaluate(() => {
      const inert = document.querySelector('#storybook-root [data-cr-blocked="true"]');
      return Boolean(inert && document.activeElement && inert.contains(document.activeElement));
    }));
    /* eslint-enable no-await-in-loop */
  }
  record(
    'focus does not enter a region a loading overlay has blocked',
    reached.every((inside) => !inside),
    `six presses of Tab put focus inside the blocked region ${reached.filter(Boolean).length} `
    + 'time(s). jsdom ignores `inert` for focus entirely, so the unit test for this is green '
    + 'with `aria-hidden` in its place — which hides the region from a screen reader and '
    + 'leaves every control in the tab order',
  );

  await page.goto(`${ORIGIN}/iframe.html?id=feedback-tour--a-guided-sequence&viewMode=story`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Start the tour' }).click();
  await page.waitForSelector('[role="dialog"]');
  const stayed = [];
  for (let press = 0; press < 8; press += 1) {
    /* eslint-disable no-await-in-loop -- as above */
    await page.keyboard.press('Tab');
    stayed.push(await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      return Boolean(dialog && document.activeElement && dialog.contains(document.activeElement));
    }));
    /* eslint-enable no-await-in-loop */
  }
  record(
    'a tour that says it is modal keeps the keyboard inside it',
    stayed.every(Boolean),
    `Tab left the tour on ${stayed.filter((inside) => !inside).length} of 8 presses. A scrim `
    + 'blocks the pointer and does nothing about Tab, so `aria-modal="true"` over one is a '
    + 'claim about a containment that is not there',
  );
}

/* --------------------------------------------- captions, in an engine that has them */

/* "Captions are supported and their state is announced." jsdom parses a
 * `<track>` and populates no `textTracks` for it, so the state this component
 * reads does not exist there. The unit tests can only say that a player with
 * nothing to caption offers no control; everything past that is checked here.
 *
 * The claim is about the track, not the button: a toggle that flipped its own
 * `aria-pressed` and left the track alone would look and read correctly and
 * show no subtitles. Since 2 October 2026 Crystal draws the cues itself, on
 * Stone above the transport, so "on" is a track in `hidden` mode (cues firing,
 * the browser not drawing them) and a cue on the screen, above the bar. */
{
  await page.goto(`${ORIGIN}/iframe.html?id=media-video-player--with-captions&viewMode=story`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#storybook-root video');
  await page.waitForFunction(() => (document.querySelector('#storybook-root video')?.readyState ?? 0) >= 1);
  const control = page.getByRole('button', { name: 'Captions' });
  record(
    'a video with a caption track offers a control for it',
    await control.count() === 1,
    `${await control.count()} caption controls were found on a player with a track`,
  );

  const before = await page.evaluate(() => {
    const video = document.querySelector('#storybook-root video');
    return [...(video?.textTracks ?? [])].map((track) => track.mode);
  });
  await control.click();
  /* Seek into the second cue, so a cue is active whether or not playback runs. */
  await page.evaluate(() => { document.querySelector('#storybook-root video').currentTime = 3.2; });
  await page.waitForTimeout(600);
  const after = await page.evaluate(() => {
    const root = document.querySelector('#storybook-root');
    const video = root.querySelector('video');
    const cue = root.querySelector('[class*="captions"]:not([hidden]) > span');
    const bar = root.querySelector('.cr-resin');
    return {
      modes: [...(video?.textTracks ?? [])].map((track) => track.mode),
      pressed: root.querySelector('[aria-label="Captions"]')?.getAttribute('aria-pressed'),
      said: [...root.querySelectorAll('[role="status"]')].map((region) => region.textContent ?? '').join(' ').trim(),
      cue: cue?.textContent ?? '',
      cueBottom: cue?.getBoundingClientRect().bottom ?? null,
      barTop: bar?.getBoundingClientRect().top ?? null,
    };
  });

  record(
    'the caption control turns a track on, not just itself',
    before.every((mode) => mode !== 'showing' && mode !== 'hidden') && after.modes.includes('hidden'),
    `the tracks went from ${before.join(', ') || 'none'} to ${after.modes.join(', ') || 'none'}. `
    + 'A toggle that flips its own pressed state and leaves the track alone looks right, '
    + 'reads right, and shows no subtitles',
  );
  record(
    'the cue is drawn, and above the transport',
    /Gulls call over the water/.test(after.cue) && after.cueBottom !== null && after.barTop !== null && after.cueBottom <= after.barTop,
    `the cue read "${after.cue}", its bottom at ${after.cueBottom} and the bar's top at ${after.barTop}. `
    + 'The browser draws cues at the foot of the picture, where the transport covers them',
  );
  record(
    'the control carries the track\'s state and the change is said',
    after.pressed === 'true' && /on/i.test(after.said),
    `the control reports aria-pressed=${after.pressed} and the announcement is "${after.said}". `
    + 'A reader who cannot see subtitles appear has nothing else to go on',
  );
}

/* ------------------------------------- the player's settings, aspect and transport */

/* Speed, subtitles and quality are menus of radio items; the element's own rate
 * is what changes; the audio group is offered only where the engine has
 * `audioTracks` (Chromium does not, without a flag); the stage holds its ratio
 * before the first frame; and the transport stands clear of the stage's edge
 * with its readouts on Haze and the scrubber's thumb on its track. */
{
  await page.goto(`${ORIGIN}/iframe.html?id=media-video-player--with-settings&viewMode=story`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#storybook-root video');
  const geometry = await page.evaluate(() => {
    const root = document.querySelector('#storybook-root');
    const stage = root.querySelector('video').parentElement.getBoundingClientRect();
    const bar = root.querySelector('.cr-resin');
    const pill = bar.getBoundingClientRect();
    const first = bar.querySelector('button').getBoundingClientRect();
    const time = bar.querySelector('[class*="time"]');
    const thumb = bar.querySelector('[class*="thumb"]')?.getBoundingClientRect();
    return {
      ratio: stage.width / stage.height,
      insetStart: pill.left - stage.left,
      insetEnd: stage.bottom - pill.bottom,
      firstPad: first.left - pill.left,
      timeFill: getComputedStyle(time).backgroundColor,
      timeEnd: time.getBoundingClientRect().right,
      thumbStart: thumb?.left ?? null,
      hasAudioTracks: 'audioTracks' in HTMLMediaElement.prototype,
    };
  });
  record(
    'the stage holds 16:9 before the first frame is known',
    Math.abs(geometry.ratio - 16 / 9) < 0.02,
    `the stage is ${geometry.ratio.toFixed(3)}:1. Without a ratio it collapses to the browser's 300×150 and the page jumps`,
  );
  record(
    'the transport is inset 12px from the stage and pads its first control by 12px',
    geometry.insetStart >= 11.5 && geometry.insetEnd >= 11.5 && geometry.firstPad >= 11.5,
    `inset ${geometry.insetStart.toFixed(1)}px from the side, ${geometry.insetEnd.toFixed(1)}px from the foot, `
    + `first control ${geometry.firstPad.toFixed(1)}px in. At 8px and 4px a focused end control drew its ring over the rim`,
  );
  record(
    'the time readouts sit on Haze, and the scrubber\'s thumb does not cover them',
    geometry.timeFill !== 'rgba(0, 0, 0, 0)' && geometry.thumbStart !== null && geometry.thumbStart >= geometry.timeEnd,
    `the readout is filled ${geometry.timeFill}; it ends at ${geometry.timeEnd} and the thumb starts at ${geometry.thumbStart}`,
  );

  await page.getByRole('button', { name: 'Settings' }).click();
  const rows = await page.getByRole('menuitem').allTextContents();
  record(
    'several choices are a submenu each, and audio is offered only where the engine can switch it',
    rows.some((row) => row.startsWith('Speed')) && rows.some((row) => row.startsWith('Subtitles'))
      && rows.some((row) => row.startsWith('Quality')) && rows.some((row) => row.startsWith('Audio')) === geometry.hasAudioTracks,
    `rows: ${rows.join(' | ')}; this engine ${geometry.hasAudioTracks ? 'has' : 'has no'} audioTracks`,
  );
  await page.getByRole('menuitem', { name: /^Speed/ }).click();
  await page.getByRole('menuitemradio', { name: '1.5 times' }).click();
  await page.waitForTimeout(300);
  const rate = await page.evaluate(() => ({
    rate: document.querySelector('#storybook-root video').playbackRate,
    said: [...document.querySelectorAll('#storybook-root [role="status"]')].map((region) => region.textContent ?? '').join(' '),
  }));
  record(
    'choosing a speed changes the element\'s rate and says so',
    rate.rate === 1.5 && /Speed 1\.5 times/.test(rate.said),
    `playbackRate is ${rate.rate} and the announcement is "${rate.said.trim()}"`,
  );
}

/* ----------------------------------------------- the audio player is a card */
{
  await page.goto(`${ORIGIN}/iframe.html?id=media-audio-player--with-a-title&viewMode=story`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#storybook-root audio', { state: 'attached' });
  const card = await page.evaluate(() => {
    const player = document.querySelector('#storybook-root audio').parentElement;
    const box = player.getBoundingClientRect();
    const pill = player.querySelector('.cr-resin').getBoundingClientRect();
    return { haze: player.classList.contains('cr-haze'), inset: pill.left - box.left };
  });
  record(
    'the audio player is a Haze card with the transport inset by the card padding',
    card.haze && card.inset >= 19.5,
    `cr-haze ${card.haze ? 'worn' : 'missing'}; the transport is ${card.inset.toFixed(1)}px from the card's edge`,
  );
}

/* ------------------------------------- the editor's toolbar on a touch screen */

/* On a coarse pointer the toolbar moves below the text and sticks, so it stays
 * above the on-screen keyboard; the field never widens past a phone's screen;
 * and the document carries real headings and checkboxes. */
{
  const phone = await browser.newContext({ viewport: { width: 375, height: 740 }, hasTouch: true, isMobile: true });
  const touch = await phone.newPage();
  await touch.goto(`${ORIGIN}/iframe.html?id=inputs-richtexteditor--every-format&viewMode=story`, { waitUntil: 'networkidle' });
  await touch.waitForSelector('#storybook-root [role="toolbar"]');
  const layout = await touch.evaluate(() => {
    const root = document.querySelector('#storybook-root');
    const toolbar = root.querySelector('[role="toolbar"]');
    const text = root.querySelector('[contenteditable]');
    return {
      below: toolbar.getBoundingClientRect().top >= text.getBoundingClientRect().top,
      position: getComputedStyle(toolbar).position,
      pageWidth: document.documentElement.scrollWidth,
      headings: text.querySelectorAll('h2, h3').length,
      boxes: text.querySelectorAll('input[type="checkbox"]').length,
    };
  });
  record(
    'on a touch screen the editor\'s toolbar sits below the text and sticks',
    layout.below && layout.position === 'sticky',
    `toolbar ${layout.below ? 'below' : 'above'} the text, position ${layout.position}`,
  );
  record(
    'the editor never widens past a phone\'s screen',
    layout.pageWidth <= 375,
    `the page is ${layout.pageWidth}px wide in a 375px viewport`,
  );
  record(
    'the document has real headings and checkboxes',
    layout.headings >= 2 && layout.boxes >= 3,
    `${layout.headings} headings and ${layout.boxes} checkboxes in the document`,
  );
  await phone.close();
}

/* ------------------------------------------ a gallery hands focus back correctly
 *
 * The claim is that closing returns focus to the thumbnail the reader ended on,
 * not the one they opened. It rests on an ordering: the component claims focus
 * synchronously, and React Aria's restoration then stands down because it only
 * acts inside a `requestAnimationFrame` and only if focus is still on the body.
 * jsdom emulates both, so the unit test only describes jsdom's scheduler. This
 * checks the real ordering. */
{
  await page.goto(
    `${ORIGIN}/iframe.html?id=media-gallery--a-set&viewMode=story`,
    { waitUntil: 'networkidle' },
  );
  await page.waitForSelector('#storybook-root [role="option"]');
  await page.locator('#storybook-root [role="option"]').first().focus();
  await page.keyboard.press('Enter');
  await page.waitForSelector('[role="dialog"]');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.waitForTimeout(200);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  const landed = await page.evaluate(() => {
    const thumbs = [...document.querySelectorAll('#storybook-root [role="option"]')];
    return {
      at: thumbs.indexOf(document.activeElement),
      selected: thumbs.findIndex((one) => one.getAttribute('aria-selected') === 'true'),
      onBody: document.activeElement === document.body,
    };
  });

  record(
    'closing a gallery leaves focus on the thumbnail the reader ended on',
    landed.at === 1 && landed.selected === 1 && !landed.onBody,
    `focus landed on thumbnail ${landed.at} while thumbnail ${landed.selected} is the `
    + `selected one${landed.onBody ? ', having fallen to the body' : ''}. Focus on one `
    + 'picture while the roving cursor is on another makes the next arrow key jump from '
    + 'somewhere the reader is not',
  );
}

/* ------------------------------------------------- screens: order and width
 *
 * Two clauses from slice O that are geometry, which the unit tests cannot
 * reach: their environment gives every element a width of zero and implements
 * no `matchMedia`.
 */
{
  await page.goto(`${ORIGIN}/iframe.html?id=screens-workspace--default&viewMode=story`, { waitUntil: 'networkidle' });
  if (await waitFor('a workspace lays out its panes', page.locator('#storybook-root section').first())) {
    /* "Focus order follows the visual order." Both orders exist only once there
       are boxes: the tab order comes from the document and the visual order from
       the positions, and a `grid-column`, an `order`, or a `direction` moves one
       without touching the other. A workspace where they disagree tabs from the
       left pane to the right to the middle, and nothing in the source looks
       wrong. Only a browser can answer this. */
    const order = await page.evaluate(() => {
      const panes = [...document.querySelectorAll('#storybook-root section[aria-label]')];
      const documentOrder = panes.map((one) => one.getAttribute('aria-label'));
      const visualOrder = [...panes]
        .sort((a, b) => {
          const boxA = a.getBoundingClientRect();
          const boxB = b.getBoundingClientRect();
          /* Reading order: down first, then along, so a wrapped row still reads
             the way a person reads it. */
          return Math.abs(boxA.top - boxB.top) > 4 ? boxA.top - boxB.top : boxA.left - boxB.left;
        })
        .map((one) => one.getAttribute('aria-label'));
      return { documentOrder, visualOrder, laidOut: panes.every((one) => one.getBoundingClientRect().width > 0) };
    });
    record(
      'a workspace is read in the order it is seen',
      order.laidOut && order.documentOrder.length > 1
        && order.documentOrder.join() === order.visualOrder.join(),
      `the document order is ${order.documentOrder.join(', ')} and the visual order is `
      + `${order.visualOrder.join(', ')}. When they disagree a reader tabs from the left `
      + 'pane to the right to the middle, and nothing in the source looks wrong',
    );
  }
}

{
  /* "Collapses to a stack below the layout breakpoint." Crystal's `md` is
     850px, so the two viewports sit well either side of it. A gate measured at
     the boundary would test the rounding instead of the rule. */
  const layoutAt = async (width) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(`${ORIGIN}/iframe.html?id=screens-masterdetail--default&viewMode=story`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#storybook-root section[aria-label]');
    await page.waitForTimeout(300);
    return page.evaluate(() => {
      const panes = [...document.querySelectorAll('#storybook-root section[aria-label]')];
      const boxes = panes.map((one) => one.getBoundingClientRect());
      return {
        panes: panes.length,
        /* Side by side means they share a row; stacked means there is one. */
        sideBySide: boxes.length === 2 && Math.abs(boxes[0].top - boxes[1].top) < 4,
        state: document.querySelector('#storybook-root [data-cr-state]')?.dataset.crState,
      };
    });
  };

  const wide = await layoutAt(1200);
  const narrow = await layoutAt(600);
  await page.setViewportSize({ width: 1280, height: 900 });

  record(
    'a master detail is two panes wide and one pane narrow',
    wide.panes === 2 && wide.sideBySide
      && narrow.panes === 1 && narrow.state === 'narrow',
    `at 1200px there are ${wide.panes} panes side by side (${wide.sideBySide}); at 600px `
    + `there are ${narrow.panes}, in state ${narrow.state}. A stack showing both would be `
    + 'the list and the detail in sequence, which is a page rather than a master detail',
  );
}

{
  /* "role=toolbar with one tab stop." Asserted in the header and measured only
     here: jsdom has a tab order, but React Aria's roving tab index is driven by
     focus events and element geometry, and the claim is about what a reader
     reaches with the Tab key. A bar of seven commands that each took a stop
     would put seven presses between the reader and the next field, which is
     what the role exists to prevent. */
  await page.goto(`${ORIGIN}/iframe.html?id=screens-commandbar--default&viewMode=story`, { waitUntil: 'networkidle' });
  if (await waitFor('a command bar renders', page.locator('#storybook-root [role="toolbar"] button').first())) {
    const stops = await page.evaluate(async () => {
      const toolbar = document.querySelector('#storybook-root [role="toolbar"]');
      const inside = (node) => node !== null && toolbar.contains(node);
      /* Start from the document, so the first Tab is the one that enters. */
      document.body.focus();
      return { commands: toolbar.querySelectorAll('button').length, inside: inside(document.activeElement) };
    });

    await page.keyboard.press('Tab');
    const entered = await page.evaluate(() => {
      const toolbar = document.querySelector('#storybook-root [role="toolbar"]');
      return toolbar.contains(document.activeElement);
    });
    await page.keyboard.press('Tab');
    const left = await page.evaluate(() => {
      const toolbar = document.querySelector('#storybook-root [role="toolbar"]');
      return !toolbar.contains(document.activeElement);
    });

    record(
      'a command bar is one tab stop, however many commands it holds',
      stops.commands > 1 && !stops.inside && entered && left,
      `the bar holds ${stops.commands} commands; one Tab entered it: ${entered}; the next `
      + `Tab left it: ${left}. A toolbar whose commands each take a stop puts one press `
      + 'per command between the reader and the next field',
    );
  }
}

/* -------------------------------------------- a stack that knows which way
 *
 * "A pop is a push mirrored, and right-to-left is a push mirrored again."
 *
 * This is R-23's check. It needs `@crystal-ui/core` 2.1.0 or later: without
 * `view-push-in` to resolve, both directions do nothing and look identical.
 * There are two motion hooks with fixed orientations because a single hook
 * would animate a pop with the push's orientation, arriving from the edge it
 * was leaving towards. This checks that the two hooks do what that argument
 * says.
 *
 * Read from the running animation's first keyframe rather than from a sampled
 * position, because a position sampled mid-flight is a race.
 */
{
  const startsAt = async (dir, action) => {
    await page.goto(
      `${ORIGIN}/iframe.html?id=screens-viewstack--drives&viewMode=story&globals=direction:${dir}`,
      { waitUntil: 'networkidle' },
    );
    await page.waitForSelector('#storybook-root section[aria-label]');
    await page.waitForTimeout(300);

    await page.getByRole('button', { name: 'Open the message' }).click();
    if (action === 'pop') {
      await page.waitForTimeout(900);
      await page.getByRole('button', { name: /Back to/ }).click();
    }
    await page.waitForTimeout(90);

    return page.evaluate(() => {
      const view = document.querySelector('#storybook-root section[aria-label]');
      const running = view?.getAnimations()[0];
      if (!running) return null;
      let first;
      try {
        first = running.effect.getKeyframes().map((k) => k.transform).filter(Boolean)[0];
      } catch { return null; }
      const travel = /translateX\((-?[\d.]+)%\)/.exec(first ?? '');
      return travel ? Number(travel[1]) : null;
    });
  };

  /* The view a push covers takes `view-push-out`: it is still mounted beneath
     the arrival, hidden, and travels towards the inline-start edge, a fraction
     of the arrival's distance, mirrored for right-to-left. Read from the last
     keyframe of its running animation. */
  const coveredEndsAt = async (dir) => {
    await page.goto(
      `${ORIGIN}/iframe.html?id=screens-viewstack--drives&viewMode=story&globals=direction:${dir}`,
      { waitUntil: 'networkidle' },
    );
    await page.waitForSelector('#storybook-root section[aria-label]');
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Open the message' }).click();
    await page.waitForTimeout(90);
    return page.evaluate(() => {
      const covered = document.querySelector('#storybook-root section[aria-hidden="true"][inert]');
      const running = covered?.getAnimations()[0];
      if (!running) return null;
      let last;
      try {
        last = running.effect.getKeyframes().map((k) => k.transform).filter(Boolean).at(-1);
      } catch { return null; }
      const travel = /translateX\((-?[\d.]+)%\)/.exec(last ?? '');
      return travel ? Number(travel[1]) : null;
    });
  };
  const ltrCovered = await coveredEndsAt('ltr');
  const rtlCovered = await coveredEndsAt('rtl');
  record(
    'the view a push covers stays beneath it and leaves towards the start edge',
    typeof ltrCovered === 'number' && typeof rtlCovered === 'number'
      && ltrCovered < 0 && rtlCovered > 0 && Math.abs(ltrCovered) < 100,
    `the covered view ends at ltr ${ltrCovered}%, rtl ${rtlCovered}%. A covered view that `
    + 'is unmounted at once, or travels the wrong way, makes the push read as two unrelated slides',
  );

  const ltrPush = await startsAt('ltr', 'push');
  const ltrPop = await startsAt('ltr', 'pop');
  const rtlPush = await startsAt('rtl', 'push');
  const rtlPop = await startsAt('rtl', 'pop');

  const signs = [ltrPush, ltrPop, rtlPush, rtlPop];
  record(
    'a pushed view arrives from the edge the stack is moving away from',
    signs.every((one) => typeof one === 'number' && one !== 0)
      /* A pop is a push mirrored. */
      && Math.sign(ltrPush) === -Math.sign(ltrPop)
      /* Right-to-left is a push mirrored again. */
      && Math.sign(ltrPush) === -Math.sign(rtlPush)
      /* That determines the fourth, which is still asserted because a
         reorientation applied twice is the case a sign flip gets wrong. */
      && Math.sign(rtlPush) === -Math.sign(rtlPop)
      /* Reading direction: a left-to-right push comes from the right. */
      && ltrPush > 0,
    `the arriving view starts at ltr push ${ltrPush}%, ltr pop ${ltrPop}%, rtl push `
    + `${rtlPush}%, rtl pop ${rtlPop}%. Two of these pointing the same way is a stack `
    + 'whose back gesture arrives from the edge it is leaving towards',
  );
}

/* --------------------------------------------- continuous indicators (D-19)
 *
 * Crystal 2.2.0 publishes three recipes that repeat, for work that is genuinely
 * pending, and one rule: nothing else loops, and none of them runs at rest or
 * under reduced motion. jsdom cannot see an animation, so the claim is read here
 * from the running animation itself (infinite, linear, at Crystal's one period)
 * and then from the same story under reduced motion, where there must be no
 * animation and the element must say it was resolved instantly. The stylesheet
 * keys a static fallback on that state, and that fallback is what the reader
 * sees.
 */
{
  const FLOW = 1200;
  for (const reduce of ['no-preference', 'reduce']) {
    const own = await browser.newPage();
    await own.emulateMedia({ reducedMotion: reduce });
    for (const [what, id, selector] of [
      ['the loader', 'feedback-loader--medium', 'svg'],
      ['the indeterminate bar', 'feedback-progress--indeterminate', '[class*="runner"]'],
    ]) {
      await own.goto(`${ORIGIN}/iframe.html?id=${id}&viewMode=story`, { waitUntil: 'networkidle' });
      await own.waitForTimeout(150);
      const seen = await own.evaluate((sel) => {
        const element = document.querySelector(`#storybook-root ${sel}`);
        if (!element) return null;
        const running = element.getAnimations()[0];
        const timing = running?.effect.getComputedTiming();
        return {
          state: element.dataset['crMotionState'] ?? null,
          iterations: timing ? String(timing.iterations) : null,
          duration: timing ? Math.round(Number(timing.duration)) : null,
          easing: running ? running.effect.getTiming().easing : null,
        };
      }, selector);
      if (reduce === 'reduce') {
        record(
          `${what} does not move under reduced motion`,
          seen !== null && seen.state === 'instant' && seen.iterations === null,
          `saw ${JSON.stringify(seen)}; a continuous indicator under reduced motion is the whole track, static`,
        );
      } else {
        record(
          `${what} repeats Crystal's continuous recipe while pending`,
          seen !== null && seen.iterations === 'Infinity' && seen.duration === FLOW && seen.easing === 'linear',
          `saw ${JSON.stringify(seen)}; expected an infinite linear loop at motion.flow (${FLOW}ms)`,
        );
      }
    }
    await own.close();
  }
}

/* ------------------------------------------------ a data mark arriving (R-21)
 *
 * `mark-in` grows each mark from its baseline, once, critically damped. The
 * three properties that make it correct are geometric, so they are measured
 * frame by frame with the page's animation clock slowed tenfold: a bar's edge on
 * the zero line never moves, no mark is ever drawn taller than its value, and a
 * mark waiting for its turn is parked at the first frame rather than drawn at
 * full height and then collapsed. Under reduced motion, nothing arrives: every mark is at its
 * value from the first frame.
 */
{
  const measure = async (reduce) => {
    const own = await browser.newPage();
    await own.emulateMedia({ reducedMotion: reduce });
    const cdp = await own.context().newCDPSession(own);
    await cdp.send('Animation.enable');
    await cdp.send('Animation.setPlaybackRate', { playbackRate: 0.1 });
    await own.goto(`${ORIGIN}/iframe.html?id=charts-bar-chart--below-zero&viewMode=story`, { waitUntil: 'commit' });
    await own.waitForSelector('#storybook-root [data-mark-in]');
    const seen = await own.evaluate(async () => {
      const marks = [...document.querySelectorAll('#storybook-root [data-mark-in]')];
      const scaleOf = (m) => { const t = getComputedStyle(m).transform; return t === 'none' ? 1 : new DOMMatrix(t).d; };
      const lastAtStart = scaleOf(marks.at(-1));
      const edges = marks.map(() => ({ top: [], bottom: [] }));
      let tallest = 0;
      const start = performance.now();
      while (performance.now() - start < 7000) {
        marks.forEach((m, i) => {
          tallest = Math.max(tallest, scaleOf(m));
          const box = m.getBoundingClientRect();
          if (box.height > 0.5) { edges[i].top.push(box.top); edges[i].bottom.push(box.bottom); }
        });
        await new Promise(requestAnimationFrame);
      }
      const spread = (xs) => (xs.length ? Math.max(...xs) - Math.min(...xs) : 0);
      /* For each mark, the edge that did not move. A bar above zero keeps its
         bottom; one below keeps its top. Either way one edge is fixed. */
      const fixed = edges.map((e) => Math.min(spread(e.top), spread(e.bottom)));
      const moved = edges.map((e) => Math.max(spread(e.top), spread(e.bottom)));
      return { lastAtStart, tallest, worstFixed: Math.max(...fixed), leastMoved: Math.min(...moved), count: marks.length };
    });
    await own.close();
    return seen;
  };

  const arriving = await measure('no-preference');
  record(
    'chart marks grow from the zero line, never past their value, and wait their turn unseen',
    arriving.count > 1 && arriving.leastMoved > 5 && arriving.worstFixed < 0.5
      && arriving.tallest <= 1.0001 && arriving.lastAtStart < 0.05,
    `${JSON.stringify(arriving)}: every mark must move (> 5px), keep one edge on the baseline (< 0.5px), `
    + 'never scale past 1, and the last mark must be parked at its first frame, not drawn full height',
  );

  const reduced = await measure('reduce');
  record(
    'chart marks arrive at their values under reduced motion',
    reduced.count > 1 && reduced.lastAtStart === 1 && reduced.leastMoved < 0.5,
    `${JSON.stringify(reduced)}: under reduced motion every mark is at its value from the first frame`,
  );
}

/* ------------------------------------------- motion marks a state entered
 *
 * The catalogue's state recipes, `selection` first, are bound through
 * `useChangeMotion`, whose three rules are checked here per component: nothing
 * has played at rest, entering the state plays the recipe
 * on the item that entered it, and pressing an item already in that state plays
 * nothing more. `data-cr-motion-name` is left behind by `useMotion` when a
 * recipe has run, which is what makes the first rule checkable after the fact.
 *
 * Each row: [story, the items, how to enter the state on the second item, the
 * recipe]. The action is a click on the item unless the row says otherwise.
 */
{
  const ROWS = [
    ['navigation-tabs-and-breadcrumbs--the-same-strip-with-different-semantics', '[role=radiogroup] label', 'selection'],
    ['data-display-calendar--today-and-selected', '[class*="_cell_"]:not([data-outside-month]):not([data-disabled]):not([data-unavailable])', 'selection'],
    ['navigation-pagination-and-steps--pages', 'button[class*="_page_"]', 'selection'],
    ['commerce-variant-selector--default', '[role=radiogroup] label:not([data-disabled])', 'selection'],
    ['commerce-shipping-selector--default', '[role=radiogroup] label:not([data-disabled])', 'selection'],
  ];
  for (const [id, items, recipe] of ROWS) {
    await page.goto(`${ORIGIN}/iframe.html?id=${id}&viewMode=story`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const played = () => page.evaluate(([items, recipe]) =>
      [...document.querySelectorAll(`#storybook-root ${items}`)]
        /* The item, or the cell it sits in: React Aria forwards a calendar
           day's ref to its \`td\`, so that is where the day moves. */
        .map((el, index) => (el.dataset.crMotionName === recipe
          || (el.parentElement?.tagName === 'TD' && el.parentElement.dataset.crMotionName === recipe) ? index : -1))
        .filter((index) => index >= 0),
    [items, recipe]);
    const atRest = await played();
    const all = page.locator(`#storybook-root ${items}`);
    const count = await all.count();
    const selectedIndex = await page.evaluate((items) =>
      [...document.querySelectorAll(`#storybook-root ${items}`)].findIndex((el) =>
        el.matches('[data-selected], [aria-selected=true], [aria-pressed=true], [aria-current]:not([aria-current=false])')),
    items);
    const target = selectedIndex === 0 ? 1 : 0;
    /* The one already selected, pressed: no state entered, so nothing plays. */
    if (selectedIndex >= 0) await all.nth(selectedIndex).click();
    await page.waitForTimeout(150);
    const afterSame = await played();
    await all.nth(target).click();
    await page.waitForTimeout(150);
    const afterChange = await played();
    record(
      `${recipe} on ${id}: nothing at rest, nothing for the item already chosen, and the newly chosen item moves`,
      count > 1 && atRest.length === 0 && afterSame.length === 0 && afterChange.length === 1 && afterChange[0] === target,
      `${count} items; played at rest ${JSON.stringify(atRest)}, after pressing the chosen one ${JSON.stringify(afterSame)}, `
      + `after choosing item ${target} ${JSON.stringify(afterChange)}`,
    );
  }
}

/* A destination becoming current from outside: a client-side route change, which
   in a story is its args changing. The bar does not remount, so the new current
   destination plays `selection`, and the page load that rendered the first one
   current played nothing. */
for (const id of ['navigation-rails-and-bars--dock-bar', 'navigation-rails-and-bars--bottom-bar', 'navigation-rails-and-bars--rail']) {
  await page.goto(`${ORIGIN}/iframe.html?id=${id}&viewMode=story`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const played = () => page.evaluate(() => [...document.querySelectorAll('#storybook-root a')]
    .filter((a) => a.dataset.crMotionName === 'selection').map((a) => a.textContent.trim()));
  const atRest = await played();
  await page.evaluate((storyId) => {
    window.__STORYBOOK_PREVIEW__.channel.emit('updateStoryArgs', { storyId, updatedArgs: { currentId: 'shared' } });
  }, id);
  await page.waitForTimeout(300);
  const after = await played();
  const current = await page.evaluate(() => document.querySelector('#storybook-root a[aria-current]')?.textContent.trim());
  record(
    `selection on ${id}: nothing on load, and the destination that becomes current moves`,
    atRest.length === 0 && after.length === 1 && current !== undefined && after[0] === current,
    `played on load ${JSON.stringify(atRest)}; after currentId changed ${JSON.stringify(after)}, current is ${JSON.stringify(current)}`,
  );
}

/* `field-focus` marks focus arriving at a field: on its shell, once, when a
   control inside it is focused, and never on load. Every field shell in the two
   stories that hold them all is focused in turn, so a field whose shell was
   never bound shows up by name. */
for (const id of ['inputs-text-and-choice--text-family', 'inputs-composite--tokens', 'inputs-temporal-colour-and-files--colour']) {
  await page.goto(`${ORIGIN}/iframe.html?id=${id}&viewMode=story`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const shells = page.locator('#storybook-root .cr-field-shell:has(input:not([type=hidden]), textarea)');
  const count = await shells.count();
  const atRest = await page.evaluate(() => [...document.querySelectorAll('#storybook-root .cr-field-shell')]
    .filter((el) => el.dataset.crMotionName === 'field-focus').length);
  const missed = [];
  for (let index = 0; index < count; index += 1) {
    const shell = shells.nth(index);
    await shell.locator('input:not([type=hidden]), textarea').first().focus();
    await page.waitForTimeout(80);
    /* The shell, or the group of wells a pin input marks as one field. */
    const moved = await shell.evaluate((el) => el.dataset.crMotionName === 'field-focus'
      || el.parentElement?.dataset.crMotionName === 'field-focus');
    if (!moved) missed.push(await shell.evaluate((el) => el.closest('[class*="_field_"]')?.querySelector('label, [class*="_label_"]')?.textContent?.trim() ?? el.className));
  }
  record(
    `field-focus on ${id}: nothing on load, and every field's shell marks focus arriving`,
    count > 0 && atRest === 0 && missed.length === 0,
    `${count} field shells; ${atRest} had played on load; focus did not mark: ${JSON.stringify([...new Set(missed)])}`,
  );
}

/* A value changing is marked where it is read, and only when it changes.
   `slider-step` on a slider's output and a stepper's quantity when the value is
   committed from the keyboard or a step button; `highlight` on a figure or a
   count replaced from outside (its args); `attention` when a count goes up.
   Nothing at rest. Each row: [story, what to do, where it must have played,
   the recipe]. */
{
  const setArgs = (id, updatedArgs) => page.evaluate(([storyId, args]) => {
    window.__STORYBOOK_PREVIEW__.channel.emit('updateStoryArgs', { storyId, updatedArgs: args });
  }, [id, updatedArgs]);
  const ROWS = [
    ['inputs-choice-and-range--ranges', async () => {
      await page.locator('#storybook-root [role=slider], #storybook-root input[type=range]').first().focus();
      await page.keyboard.press('ArrowRight');
    }, 'output > span', 'slider-step'],
    ['commerce-quantity-stepper--default', async () => {
      await page.locator('#storybook-root [role=group] button').last().click();
    }, 'input', 'slider-step'],
    ['data-display-statistic--default', async (id) => setArgs(id, { value: '£51,004' }), '[class*="_value_"] > [class*="_layer_"]', 'highlight'],
    ['data-display-badge--default', async (id) => setArgs(id, { count: 4, description: '4 unread messages' }), '[class*="_badge_"] > [class*="_layer_"]', 'highlight'],
    ['data-display-badge--default', async (id) => setArgs(id, { count: 5, description: '5 unread messages' }), '[class*="_badge_"]', 'attention'],
    ['data-display-delta-badge--default', async (id) => setArgs(id, { value: 7.5 }), '[class*="_delta_"] > [class*="_layer_"]', 'highlight'],
  ];
  for (const [id, act, where, recipe] of ROWS) {
    await page.goto(`${ORIGIN}/iframe.html?id=${id}&viewMode=story`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const played = () => page.evaluate(([where, recipe]) =>
      [...document.querySelectorAll(`#storybook-root ${where}`)].filter((el) => el.dataset.crMotionName === recipe).length,
    [where, recipe]);
    const atRest = await played();
    await act(id);
    await page.waitForTimeout(300);
    const after = await played();
    record(
      `${recipe} on ${id}: nothing at rest, and the change is marked where it is read`,
      atRest === 0 && after >= 1,
      `played at rest on ${atRest}; after the change on ${after} element(s) matching ${where}`,
    );
  }
}

/* A popover's mount is its opening, and the catalogue names the recipe that
   marks it: `menu-in` for a select's list, a cascader's columns and a picker's
   calendar, `popover-in` for a combobox's suggestions. Nothing has played before
   the trigger is pressed; after, the popover (which React Aria portals to the
   body) has played exactly that recipe. */
for (const [id, trigger, recipe] of [
  ['inputs-text-and-choice--choice-family', 'button.cr-field-shell', 'menu-in'],
  ['inputs-temporal-colour-and-files--temporal', '.cr-field-shell button', 'menu-in'],
  ['inputs-composite--hierarchy', 'button.cr-field-shell', 'menu-in'],
  ['inputs-composite--filtering', '.cr-field-shell button', 'popover-in'],
]) {
  await page.goto(`${ORIGIN}/iframe.html?id=${id}&viewMode=story`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const played = () => page.evaluate((recipe) => document.querySelectorAll(`[data-cr-motion-name="${recipe}"]`).length, recipe);
  const atRest = await played();
  await page.locator(`#storybook-root ${trigger}`).first().click();
  await page.waitForTimeout(500);
  const after = await played();
  const open = await page.evaluate(() => document.querySelectorAll('[data-rac][data-trigger], .react-aria-Popover, [role=listbox], [role=dialog]').length);
  record(
    `${recipe} on ${id}: nothing before the trigger is pressed, and the popover arrives with it`,
    atRest === 0 && after === 1 && open > 0,
    `played before ${atRest}, after opening ${after}; open surfaces ${open}`,
  );
  /* And it leaves with its exit: a moment after it is dismissed it is still on
     screen, exiting and playing the exit (React Aria holds it for the recipe),
     and it is gone once the recipe has played. */
  const exit = recipe.replace(/-in$/, '-out');
  await page.waitForTimeout(700);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(60);
  const leaving = await page.evaluate((exit) => document.querySelectorAll(`[data-exiting][data-cr-motion-name="${exit}"]`).length, exit);
  await page.waitForTimeout(1500);
  const left = await page.evaluate(() => document.querySelectorAll('[data-exiting]').length);
  record(
    `${exit} on ${id}: dismissed, the popover stays for its exit and then goes`,
    leaving === 1 && left === 0,
    `a moment after dismissal ${leaving} surface(s) were exiting with ${exit}; after it ${left} remained`,
  );
}

/* The same for the anchored overlays that are components of their own: a menu,
   a popover and a tooltip on the page. Opened by a press (a tooltip by keyboard
   focus, which is how it opens for somebody without a pointer), dismissed with
   Escape; each arrives with its recipe and leaves with its exit, held on screen
   until the exit has played. */
for (const [label, open, recipe] of [
  ['Actions', 'click', 'menu-in'],
  ['Details', 'click', 'popover-in'],
  ['', 'focus', 'tooltip-in'],
]) {
  await page.goto(`${ORIGIN}/iframe.html?id=overlays-anchored-surfaces--on-the-page&viewMode=story`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const trigger = page.locator('#storybook-root button').filter({ hasText: label ? new RegExp(`^${label}$`) : /^$/ }).first();
  const exit = recipe.replace(/-in$/, '-out');
  const count = (name, extra = '') => page.evaluate(([name, extra]) => document.querySelectorAll(`${extra}[data-cr-motion-name="${name}"]`).length, [name, extra]);
  const before = await count(recipe);
  if (open === 'click') await trigger.click();
  else { await page.keyboard.press('Tab'); await trigger.focus(); }
  await page.waitForTimeout(900);
  const arrived = await count(recipe);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(60);
  const leaving = await count(exit, '[data-exiting]');
  await page.waitForTimeout(1500);
  const left = await page.evaluate(() => document.querySelectorAll('[data-exiting]').length);
  record(
    `${recipe} and ${exit}: the ${label || 'icon button\'s tooltip'} arrives with its recipe, and leaves with its exit`,
    before === 0 && arrived === 1 && leaving === 1 && left === 0,
    `before opening ${before}, opened ${arrived}, a moment after Escape ${leaving} exiting with ${exit}, after it ${left} remained`,
  );
}

/* A collection's items: the values a field starts with play nothing; a value
   committed arrives with `list-in`; a value removed stays long enough to play
   `list-out`, inert while it does, and then goes. An item component outside a
   collection, such as a card on a page, never plays either. */
{
  await page.goto(`${ORIGIN}/iframe.html?id=inputs-composite--tokens&viewMode=story`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const chips = () => page.evaluate(() => [...document.querySelectorAll('#storybook-root .cr-field-shell')][0]
    .querySelectorAll(':scope > [class*="_chip"]').length);
  const played = (name, extra = '') => page.evaluate(([name, extra]) =>
    [...document.querySelectorAll('#storybook-root .cr-field-shell')][0].querySelectorAll(`:scope > ${extra}[data-cr-motion-name="${name}"]`).length, [name, extra]);
  const atRest = await played('list-in') + await played('list-out');
  const before = await chips();
  const entry = page.locator('#storybook-root .cr-field-shell input').first();
  await entry.click();
  await entry.fill('Arrival');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(150);
  const arrived = await played('list-in');
  await page.locator('#storybook-root .cr-field-shell button[aria-label^="Remove"]').first().click();
  await page.waitForTimeout(60);
  const leaving = await played('list-out', '[inert]');
  const during = await chips();
  await page.waitForTimeout(900);
  const after = await chips();
  record(
    'list-in and list-out on a tags field: nothing at rest, the committed value arrives, the removed one leaves inert and then goes',
    atRest === 0 && arrived === 1 && leaving === 1 && during === before + 1 && after === before,
    `at rest ${atRest}; ${before} chips, then list-in on ${arrived}; removing, list-out on ${leaving} inert chip(s) with ${during} still shown; after, ${after}`,
  );

  await page.goto(`${ORIGIN}/iframe.html?id=data-display-card--default&viewMode=story`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const loose = await page.evaluate(() => document.querySelectorAll('#storybook-root [data-cr-motion-name^="list-"]').length);
  record('a card that is not in a collection plays neither list recipe', loose === 0, `${loose} element(s) played a list recipe on load`);
}

/* Surfaces this library holds in Motion's presence for their exits: a drawer,
   modal and inline, the command palette, and a tour. Each is opened, closed, and
   must still be on screen playing its exit a moment later, and gone after it. */
for (const [id, openWith, exit] of [
  ['overlays-drawer--modal', /open|filters|show/i, 'drawer-out'],
  ['overlays-drawer--not-modal', null, 'drawer-out'],
  ['overlays-command-palette--palette', /open|command|search/i, 'menu-out'],
]) {
  await page.goto(`${ORIGIN}/iframe.html?id=${id}&viewMode=story`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  if (openWith) {
    const opener = page.locator('#storybook-root button').filter({ hasText: openWith }).first();
    if (await opener.count()) await opener.click();
    await page.waitForTimeout(1200);
  }
  const closer = page.locator('button[aria-label^="Close" i], button:has-text("Close")').first();
  if (await closer.count()) await closer.click(); else await page.keyboard.press('Escape');
  await page.waitForTimeout(80);
  const leaving = await page.evaluate((exit) => document.querySelectorAll(`[data-cr-motion-name="${exit}"]`).length, exit);
  await page.waitForTimeout(1600);
  const left = await page.evaluate((exit) => document.querySelectorAll(`[data-cr-motion-name="${exit}"]`).length, exit);
  record(
    `${exit} on ${id}: closed, the surface stays for its exit and then goes`,
    leaving === 1 && left === 0,
    `a moment after closing ${leaving} surface(s) playing ${exit}; after it ${left}`,
  );
}

/* A disclosure's icon turns as it opens and closes: the collapsed trail's "…"
   is a menu trigger, which React Aria marks expanded through context. And going
   a level deeper, the new crumb arrives with `breadcrumb` while the rest stay. */
{
  await page.goto(`${ORIGIN}/iframe.html?id=navigation-tabs-and-breadcrumbs--collapsed-trail&viewMode=story`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const turned = () => page.evaluate(() => document.querySelectorAll('#storybook-root [data-cr-motion-name="icon-turn"]').length);
  const atRest = await turned();
  await page.locator('#storybook-root button[aria-haspopup]').first().click();
  await page.waitForTimeout(200);
  const opened = await turned();
  await page.keyboard.press('Escape');
  record(
    'icon-turn: a disclosure\'s icon turns when what it discloses opens, and not before',
    atRest === 0 && opened === 1,
    `turned at rest ${atRest}, after opening ${opened}`,
  );

  await page.goto(`${ORIGIN}/iframe.html?id=navigation-tabs-and-breadcrumbs--going-deeper&viewMode=story`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const arrived = () => page.evaluate(() => [...document.querySelectorAll('#storybook-root nav [data-cr-motion-name="breadcrumb"]')].map((el) => el.textContent.trim()));
  const onLoad = await arrived();
  await page.locator('#storybook-root button').filter({ hasText: 'Go a level deeper' }).click();
  await page.waitForTimeout(200);
  const after = await arrived();
  const last = await page.evaluate(() => [...document.querySelectorAll('#storybook-root nav li')].at(-1)?.textContent.trim());
  record(
    'breadcrumb: going a level deeper, only the new crumb arrives',
    onLoad.length === 0 && after.length === 1 && after[0] === last,
    `arrived on load ${JSON.stringify(onLoad)}; after going deeper ${JSON.stringify(after)}, last crumb ${JSON.stringify(last)}`,
  );
}

/* Views: a master-detail's detail when another item is chosen plays `page-in`;
   focus mode's chrome, leaving as focus mode begins, plays `page-out` and goes.
   Neither on load. Driven from args, as a product's state would be. */
{
  const setArgs = (id, updatedArgs) => page.evaluate(([storyId, args]) => {
    window.__STORYBOOK_PREVIEW__.channel.emit('updateStoryArgs', { storyId, updatedArgs: args });
  }, [id, updatedArgs]);
  const played = (name) => page.evaluate((name) => document.querySelectorAll(`#storybook-root [data-cr-motion-name="${name}"]`).length, name);

  await page.goto(`${ORIGIN}/iframe.html?id=screens-masterdetail--default&viewMode=story`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const detailAtRest = await played('page-in');
  await setArgs('screens-masterdetail--default', { selectedKey: 'b' });
  await page.waitForTimeout(250);
  const detailAfter = await page.evaluate(() => document.querySelector('#storybook-root section[aria-label="Message"]')?.dataset.crMotionName ?? null);
  record(
    'page-in on a master–detail: choosing another item brings the detail in as a new view, and loading does not',
    detailAtRest === 0 && detailAfter === 'page-in',
    `played on load ${detailAtRest}; after choosing, the detail played ${detailAfter}`,
  );

  await page.goto(`${ORIGIN}/iframe.html?id=screens-focusmode--off&viewMode=story`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const chromeAtRest = await played('page-out') + await played('page-in');
  await setArgs('screens-focusmode--off', { isOn: true });
  await page.waitForTimeout(100);
  const leaving = await page.evaluate(() => document.querySelectorAll('#storybook-root [inert][data-cr-motion-name="page-out"]').length);
  await page.waitForTimeout(1200);
  const gone = await page.evaluate(() => [...document.querySelectorAll('#storybook-root button')].filter((b) => b.textContent.trim() === 'Sidebar').length);
  record(
    'page-out on focus mode: the chrome leaves inert, plays its exit, and goes; nothing on load',
    chromeAtRest === 0 && leaving === 1 && gone === 0,
    `played on load ${chromeAtRest}; leaving ${leaving}; chrome controls left afterwards ${gone}`,
  );
}

/* A gallery's viewer moving to the next picture: `media-in` on the picture and
   `caption-in` on its caption; opening it plays neither, since that is the
   dialog's own arrival. */
{
  await page.goto(`${ORIGIN}/iframe.html?id=media-gallery--a-set&viewMode=story`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.locator('#storybook-root [role=option]').first().click();
  await page.waitForTimeout(900);
  const count = (name) => page.evaluate((name) => document.querySelectorAll(`[role=dialog] [data-cr-motion-name="${name}"]`).length, name);
  const onOpen = await count('media-in') + await count('caption-in');
  await page.locator('[role=dialog] button[aria-label="Next"]').click();
  await page.waitForTimeout(300);
  const media = await count('media-in');
  const caption = await count('caption-in');
  const captioned = await page.evaluate(() => document.querySelectorAll('[role=dialog] p').length);
  record(
    'media-in and caption-in: the viewer moving to the next picture brings it and its caption in; opening does not',
    onOpen === 0 && media === 1 && (captioned === 0 || caption === 1),
    `on opening ${onOpen}; after moving, media-in ${media}, caption-in ${caption} (${captioned} caption)`,
  );
  await page.keyboard.press('Escape');
}

/* A resize ends and what was resized settles: a split's region, and a table's
   column. By keyboard, which is how a resize is done without a pointer; nothing
   has played before. */
/* React Aria's keyboard route for a column: Enter on its header starts the
   resize, arrows change it, Enter ends it. A split's separator resizes on each
   arrow. */
for (const [id, handle, keys, where] of [
  ['application-shell--resizing', '[role=separator]', ['ArrowRight'], '[class*="_region_"]'],
  ['data-display-resizable-table--default', '[role=columnheader]', ['Enter', 'ArrowRight', 'Enter'], '[data-column-label]'],
]) {
  await page.goto(`${ORIGIN}/iframe.html?id=${id}&viewMode=story`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const settled = () => page.evaluate((where) => document.querySelectorAll(`#storybook-root ${where}[data-cr-motion-name="resize-settle"]`).length, where);
  const atRest = await settled();
  await page.locator(`#storybook-root ${handle}`).first().focus();
  for (const key of keys) { await page.keyboard.press(key); await page.waitForTimeout(60); }
  await page.waitForTimeout(250);
  const after = await settled();
  record(
    `resize-settle on ${id}: nothing at rest, and what was resized settles when the resize ends`,
    atRest === 0 && after === 1,
    `settled at rest ${atRest}; after one key press ${after}`,
  );
}

/* Files dropped on a drop zone arrive: the zone lifts as they are carried in,
   settles as they land, and the file is delivered where a chosen file would be
   (the story lists it). Dispatched with a real DataTransfer holding a real
   File, as a browser does. */
{
  await page.goto(`${ORIGIN}/iframe.html?id=inputs-temporal-colour-and-files--dropping-files&viewMode=story`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const zone = page.locator('#storybook-root [data-rac][class*="_zone_"]').first();
  const before = await page.evaluate(() => document.querySelectorAll('#storybook-root [data-cr-motion-name^="drag-"]').length);
  const box = await zone.boundingBox();
  const transfer = await page.evaluateHandle(() => {
    const data = new DataTransfer();
    data.items.add(new File(['quarterly figures'], 'quarterly.csv', { type: 'text/csv' }));
    /* Two things a drag from the desktop has and a DataTransfer built by script
       does not, both of which React Aria rightly checks: an `effectAllowed` that
       permits copying (Chrome ignores setting it on a constructed one), and a
       file-system entry for each file, without which React Aria skips the file
       as not being one. Supplied here so the drop is the desktop's drop. */
    Object.defineProperty(data, 'effectAllowed', { value: 'all' });
    const entry = DataTransferItem.prototype.webkitGetAsEntry;
    DataTransferItem.prototype.webkitGetAsEntry = function webkitGetAsEntry() {
      return entry.call(this) ?? (this.kind === 'file' ? { isFile: true, isDirectory: false } : null);
    };
    return data;
  });
  const at = { clientX: box.x + box.width / 2, clientY: box.y + box.height / 2 };
  await zone.dispatchEvent('dragenter', { dataTransfer: transfer, ...at });
  await zone.dispatchEvent('dragover', { dataTransfer: transfer, ...at });
  await page.waitForTimeout(120);
  const lifted = await zone.evaluate((el) => el.dataset.crMotionName);
  await zone.dispatchEvent('drop', { dataTransfer: transfer, ...at });
  await page.waitForTimeout(400);
  const settled = await zone.evaluate((el) => el.dataset.crMotionName);
  const listed = await page.evaluate(() => document.querySelector('#storybook-root')?.textContent.includes('quarterly.csv'));
  record(
    'a drop zone lifts as files arrive over it, settles as they land, and delivers them',
    before === 0 && lifted === 'drag-pickup' && settled === 'drag-settle' && listed === true,
    `before ${before}; over the zone ${lifted}; after the drop ${settled}; the dropped file listed: ${listed}`,
  );
}

/* A handle picked up and put down: the image comparison's grip lifts with
   `drag-pickup` as the pointer takes it and settles with `drag-settle` as it
   lets go, and the divider it moves stays under the pointer throughout. */
{
  await page.goto(`${ORIGIN}/iframe.html?id=data-display-image-compare--default&viewMode=story`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const grip = () => page.evaluate(() => document.querySelector('#storybook-root [class*="_grip_"]')?.dataset.crMotionName ?? null);
  const atRest = await grip();
  const box = await page.locator('#storybook-root [data-cr-handle]').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2, { steps: 4 });
  await page.waitForTimeout(120);
  const held = await grip();
  await page.mouse.up();
  await page.waitForTimeout(120);
  const released = await grip();
  record(
    'drag-pickup and drag-settle: a handle lifts as it is taken and settles as it is let go',
    atRest === null && held === 'drag-pickup' && released === 'drag-settle',
    `at rest ${atRest}; held ${held}; released ${released}`,
  );
}

/* An accordion row closing: its content plays `accordion-out` while the panel is
   still shown, and the panel is hidden once it has ("hide content after
   completion"). A row that loads closed plays nothing. */
{
  await page.goto(`${ORIGIN}/iframe.html?id=data-display-accordion--one-open-to-start&viewMode=story`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const state = () => page.evaluate(() => [...document.querySelectorAll('#storybook-root [class*="_content_"]')]
    .map((c) => ({ name: c.dataset.crMotionName ?? null, hidden: c.parentElement.hasAttribute('hidden') })));
  const atRest = (await state()).filter((one) => one.name !== null).length;
  await page.locator('#storybook-root button[aria-expanded="true"]').first().click();
  await page.waitForTimeout(80);
  const closing = (await state())[0];
  await page.waitForTimeout(1000);
  const closed = (await state())[0];
  record(
    'accordion-out: the content of a closing row leaves while its panel is shown, and the panel hides after',
    atRest === 0 && closing.name === 'accordion-out' && closing.hidden === false && closed.hidden === true,
    `at rest ${atRest}; closing ${JSON.stringify(closing)}; closed ${JSON.stringify(closed)}`,
  );
}

/* Menus this library opens itself: a speed dial's actions and a navigation
   menu's section. Each arrives with `menu-in` and, closed, stays on screen
   playing `menu-out`, inert, before it goes. Nothing on load. */
for (const [id, trigger, surface] of [
  ['actions-icon-group-and-floating--dial', 'button[aria-expanded]', '[role=group][class*="_dial_"]'],
  ['navigation-menu-bars--sections', 'button[aria-expanded]', '[class*="_panel_"]'],
]) {
  await page.goto(`${ORIGIN}/iframe.html?id=${id}&viewMode=story`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const find = (name) => page.evaluate(([surface, name]) =>
    document.querySelectorAll(`#storybook-root ${surface}[data-cr-motion-name="${name}"]`).length, [surface, name]);
  const atRest = await find('menu-in') + await find('menu-out');
  const opener = page.locator(`#storybook-root ${trigger}`).first();
  await opener.click();
  await page.waitForTimeout(700);
  const arrived = await find('menu-in');
  await opener.click();
  await page.waitForTimeout(60);
  const leaving = await page.evaluate((surface) =>
    [...document.querySelectorAll(`#storybook-root ${surface}[data-cr-motion-name="menu-out"]`)]
      .filter((el) => el.inert || el.hasAttribute('inert')).length, surface);
  await page.waitForTimeout(900);
  const shown = await page.evaluate((surface) => [...document.querySelectorAll(`#storybook-root ${surface}`)]
    .filter((el) => !el.hidden && el.getClientRects().length > 0).length, surface);
  record(
    `menu-in and menu-out on ${id}: arrives, then leaves inert with its exit, and goes`,
    atRest === 0 && arrived === 1 && leaving === 1 && shown === 0,
    `at rest ${atRest}; opened ${arrived}; leaving ${leaving}; still shown after ${shown}`,
  );
}

/* A table's rows, driven from args as a product's data would be: a changed seat
   count washes its cell with `highlight`; an added row arrives with `list-in`;
   in the plain table a removed row leaves with `list-out`. Nothing on load.
   The rows are the stories' own, restated here. */
{
  const setArgs = (id, updatedArgs) => page.evaluate(([storyId, args]) => {
    window.__STORYBOOK_PREVIEW__.channel.emit('updateStoryArgs', { storyId, updatedArgs: args });
  }, [id, updatedArgs]);
  const base = [
    { id: 'gather', name: 'Gather', cells: { workspace: 'Gather', plan: 'Team', seats: '12', renews: '14 March 2027' } },
    { id: 'atlas', name: 'Atlas', cells: { workspace: 'Atlas', plan: 'Solo', seats: '1', renews: '2 April 2027' } },
    { id: 'harbour', name: 'Harbour', cells: { workspace: 'Harbour', plan: 'Team', seats: '34', renews: '9 June 2027' } },
    { id: 'prism', name: 'Prism', cells: { workspace: 'Prism', plan: 'Enterprise', seats: '210', renews: '30 November 2027' } },
  ];
  const added = { id: 'north', name: 'North', cells: { workspace: 'North', plan: 'Solo', seats: '2', renews: '1 May 2027' } };
  const count = (name) => page.evaluate((name) => document.querySelectorAll(`#storybook-root [data-cr-motion-name="${name}"]`).length, name);
  for (const id of ['data-display-table--default', 'data-display-data-table--default']) {
    await page.goto(`${ORIGIN}/iframe.html?id=${id}&viewMode=story`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const atRest = await count('highlight') + await count('list-in') + await count('list-out');
    await setArgs(id, { rows: base.map((row, index) => (index === 1 ? { ...row, cells: { ...row.cells, seats: '3' } } : row)) });
    await page.waitForTimeout(250);
    const highlighted = await count('highlight');
    await setArgs(id, { rows: [...base, added] });
    await page.waitForTimeout(250);
    const arrivedIn = await page.evaluate(() => [...document.querySelectorAll('#storybook-root [data-cr-motion-name="list-in"]')]
      .map((el) => el.closest('tr, [role=row]')?.textContent.includes('North')).filter(Boolean).length);
    record(
      `highlight and list-in on ${id}: a changed value is washed, an added row arrives, and nothing on load`,
      atRest === 0 && highlighted >= 1 && arrivedIn >= 1,
      `on load ${atRest}; after a seat count changed, highlight on ${highlighted}; after a row was added, list-in on ${arrivedIn} element(s) of it`,
    );
  }
  await page.goto(`${ORIGIN}/iframe.html?id=data-display-table--default&viewMode=story`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await setArgs('data-display-table--default', { rows: base.slice(0, 3) });
  await page.waitForTimeout(80);
  const leaving = await page.evaluate(() => document.querySelectorAll('#storybook-root tr[inert][data-cr-motion-name="list-out"]').length);
  await page.waitForTimeout(900);
  const gone = await page.evaluate(() => [...document.querySelectorAll('#storybook-root tbody tr')].filter((tr) => tr.textContent.includes('Prism')).length);
  record(
    'list-out on a table: a removed row leaves inert with its exit, then goes',
    leaving === 1 && gone === 0,
    `leaving ${leaving}; Prism rows after ${gone}`,
  );
}

/* Moving an item across a transfer: it arrives in the other list with
   `list-in`, and nothing played when the lists loaded. */
{
  await page.goto(`${ORIGIN}/iframe.html?id=inputs-composite--two-lists&viewMode=story`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const arrived = () => page.evaluate(() => [...document.querySelectorAll('#storybook-root [data-cr-motion-name="list-in"]')].map((el) => el.textContent.trim()));
  const onLoad = await arrived();
  const option = page.locator('#storybook-root [role=listbox]').first().locator('[role=option]:not([aria-disabled=true])').first();
  const name = (await option.textContent())?.trim();
  await option.click();
  await page.locator('#storybook-root button[aria-label^="Move to"]').first().click();
  await page.waitForTimeout(250);
  const after = await arrived();
  record(
    'list-in on a transfer: the moved item arrives in the other list, and nothing on load',
    onLoad.length === 0 && after.length === 1 && after[0] === name,
    `on load ${JSON.stringify(onLoad)}; moved ${JSON.stringify(name)}; arrived ${JSON.stringify(after)}`,
  );
}

/* A list reordered and shortened: the rows that moved among the others play
   `reorder`, and a removed row leaves inert with `list-out`; nothing on load. */
{
  await page.goto(`${ORIGIN}/iframe.html?id=data-display-list--reordering&viewMode=story`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const moved = () => page.evaluate(() => [...document.querySelectorAll('#storybook-root li')].filter((li) => li.dataset.crMotionName === 'reorder').length);
  const onLoad = await moved();
  await page.locator('#storybook-root button').filter({ hasText: 'Move last to top' }).click();
  await page.waitForTimeout(200);
  const reordered = await moved();
  await page.locator('#storybook-root button').filter({ hasText: 'Remove first' }).click();
  await page.waitForTimeout(80);
  const leaving = await page.evaluate(() => document.querySelectorAll('#storybook-root li[inert][data-cr-motion-name="list-out"]').length);
  await page.waitForTimeout(900);
  const rows = await page.evaluate(() => document.querySelectorAll('#storybook-root li').length);
  record(
    'reorder and list-out on a list: moved rows play reorder, a removed row leaves inert and goes',
    onLoad === 0 && reordered >= 1 && leaving === 1 && rows === 3,
    `on load ${onLoad}; reordered ${reordered}; leaving ${leaving}; rows after ${rows}`,
  );
}

/* A playlist reordered by keyboard alone: from a track's drag handle, Enter
   picks it up, arrows move it between drop positions, Enter puts it down. The
   order changes, the track settles where it landed, and the now-playing row
   stays aria-current. */
{
  await page.goto(`${ORIGIN}/iframe.html?id=blocks-playlistblock--reordering&viewMode=story`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const order = () => page.evaluate(() => [...document.querySelectorAll('#storybook-root [role=row]')].map((row) => row.querySelector('[class*="_title_"]')?.textContent));
  const before = await order();
  await page.locator('#storybook-root button[aria-label="Reorder Harbour Lights"]').focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(100);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(100);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  const after = await order();
  const settled = await page.evaluate(() => [...document.querySelectorAll('#storybook-root [role=row]')]
    .filter((row) => row.querySelector('[data-cr-motion-name="drag-settle"]')).map((row) => row.querySelector('[class*="_title_"]')?.textContent));
  const current = await page.evaluate(() => document.querySelector('#storybook-root [role=row][aria-current="true"] [class*="_title_"]')?.textContent);
  const displaced = await page.evaluate(() => [...document.querySelectorAll('#storybook-root [role=row]')]
    .filter((row) => row.querySelector('[data-cr-motion-name="reorder"]')).map((row) => row.querySelector('[class*="_title_"]')?.textContent));
  record(
    'a playlist reorders by keyboard, the moved track settles, the rows it passed reorder, and the now-playing row stays current',
    JSON.stringify(before) !== JSON.stringify(after) && after[0] !== 'Harbour Lights'
      && settled.length === 1 && settled[0] === 'Harbour Lights' && current === 'North Road'
      && displaced.length >= 1 && !displaced.includes('Harbour Lights'),
    `before ${JSON.stringify(before)}; after ${JSON.stringify(after)}; settled ${JSON.stringify(settled)}; reordered ${JSON.stringify(displaced)}; current ${current}`,
  );
}

/* ---------------------------------------------------------- a virtualizer windows, counts and keeps focus */

/* The catalogue's two obligations for the virtualizer, which the library
   re-exports from React Aria because it meets both: rows keep their place in the
   set (`aria-setsize` and `aria-posinset`) while only some of them exist, and a
   focused row is not dropped when scrolling would recycle it. Neither is visible
   to jsdom, which lays nothing out and so windows nothing. Measured on the
   two-thousand-row story: few rows rendered, each counted against the whole,
   and focus on the first row surviving a scroll to the bottom of the list. */
{
  await page.goto(`${ORIGIN}/iframe.html?id=data-display-virtual-scroller--two-thousand-rows&viewMode=story`, { waitUntil: 'networkidle' });
  if (await waitFor('the virtual scroller rendered', page.locator('#storybook-root [role="option"]').first())) {
    const counted = await page.evaluate(() => [...document.querySelectorAll('#storybook-root [role="option"]')].map((row) => ({
      text: row.textContent.trim(), size: row.getAttribute('aria-setsize'), at: row.getAttribute('aria-posinset'),
    })));
    const rightlyCounted = counted.every((row) => row.size === '2000' && row.text.endsWith(` ${row.at}`));
    record(
      'a virtualizer renders a window of its rows, each counted against the whole set',
      counted.length > 0 && counted.length < 100 && rightlyCounted,
      `${counted.length} rows rendered; first ${JSON.stringify(counted[0])}`,
    );

    await page.locator('#storybook-root [role="option"]').first().focus();
    await page.keyboard.press('ArrowDown');
    const focusedText = await page.evaluate(() => document.activeElement?.textContent?.trim());
    await page.evaluate(() => {
      const listbox = document.querySelector('#storybook-root [role="listbox"]');
      let scroller = listbox;
      while (scroller && scroller.scrollHeight <= scroller.clientHeight) scroller = scroller.parentElement;
      scroller?.scrollTo({ top: scroller.scrollHeight });
    });
    /* Wait for the window to reach the end rather than for a fixed time. A fixed
       400ms failed two runs in five against storybook-static and once against
       the dev server (R-29): the scroll and the re-render that follows are not
       done in a set time. Five seconds is the limit, and a list that has not
       reached its last row by then fails below as before. */
    await page.waitForFunction(
      () => [...document.querySelectorAll('#storybook-root [role="option"]')].some((row) => row.getAttribute('aria-posinset') === '2000'),
      undefined,
      { timeout: 5000 },
    ).catch(() => {});
    const kept = await page.evaluate(() => ({
      active: document.activeElement?.getAttribute('role'),
      text: document.activeElement?.textContent?.trim(),
      bottom: [...document.querySelectorAll('#storybook-root [role="option"]')].some((row) => row.getAttribute('aria-posinset') === '2000'),
      /* Its neighbour is gone, so the row was kept rather than never dropped. */
      recycled: ![...document.querySelectorAll('#storybook-root [role="option"]')].some((row) => row.getAttribute('aria-posinset') === '3'),
    }));
    record(
      'a virtualizer keeps the focused row when scrolling would recycle it',
      kept.bottom && kept.recycled && kept.active === 'option' && kept.text === focusedText,
      `focused ${JSON.stringify(focusedText)}; after scrolling to the end, focus is on ${kept.active} ${JSON.stringify(kept.text)}; the last row rendered: ${kept.bottom}; its neighbours recycled: ${kept.recycled}`,
    );
  }
}

/* ---------------------------------------------------------- an onboarding step changes page */

/* The catalogue gives the onboarding sequence `page-in` and `page-out`, and the
   block plays them on the step's page (the leaving one and the arriving one in
   the same grid cell), while the panel keeps Tour's own arrival. The pages are
   the same element in the same place for every step, so React keeps it mounted
   and its presence sees the change; built any other way, the old page unmounts
   and nothing leaves. jsdom plays nothing, so it is counted here. */
{
  await page.goto(`${ORIGIN}/iframe.html?id=blocks-onboardingblock--active&viewMode=story`, { waitUntil: 'networkidle' });
  if (await waitFor('the onboarding panel opened', page.getByRole('dialog'))) {
    await page.waitForTimeout(600);
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(250);
    const played = await page.evaluate(() => [...document.querySelectorAll('[class*="_page_"]')].map((one) => ({
      name: one.getAttribute('data-cr-motion-name'), text: one.textContent.trim().slice(0, 24),
    })));
    const leaving = played.filter((one) => one.name === 'page-out');
    const arriving = played.filter((one) => one.name === 'page-in');
    record(
      'an onboarding step plays page-out on the page that leaves and page-in on the one that arrives',
      leaving.length === 1 && arriving.length === 1 && leaving[0].text !== arriving[0].text,
      `pages seen: ${JSON.stringify(played)}`,
    );
  }
}

await browser.close();

console.log(JSON.stringify({ suite: 'browser behaviour', checks: checks.length, failures }, null, 2));
if (failures.length) {
  console.error('\nA component behaved differently in a browser than its unit tests can see.');
  process.exit(1);
}
