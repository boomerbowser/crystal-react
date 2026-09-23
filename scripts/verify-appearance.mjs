/* What a state looks like, read from resolved computed style in a real browser.
 *
 * R-11: jsdom tests semantics and the parts of CSS that are not colours, axe
 * tests the tree, `verify-targets` measures geometry, `verify-behaviour` drives
 * the page — and what a state *looks like* was checked by nobody. Every Crystal
 * state is expressed through a custom property, and jsdom hands those back
 * unresolved: `color` on a themed element reads as the literal text
 * `var(--cr-primary)`. So this is not a gap anyone could have closed where the
 * unit tests live.
 *
 * It is not hypothetical. `--cr-focus-core` and `--cr-focus-ring` were read by
 * every field in this library and defined by nothing, so Crystal's focus ring
 * painted on no control anywhere for an entire slice, with every test green.
 * `published-properties.test.tsx` now catches an *undefined* property. Nothing
 * caught a control that simply has no rule.
 *
 * **Every assertion here is a relationship, never a value.** R-11 names the trap
 * in one line — "a gate that asserts a colour is a gate that fails on a palette
 * change" — and it is the difference between a check that survives Crystal and
 * one that has to be edited every time a palette moves. So: the focused control
 * differs from the same control unfocused; the selected row is *heavier than*
 * its neighbour; the disabled control differs from its enabled sibling in
 * something besides opacity. None of those name a colour, and all of them are
 * false the moment the rule disappears.
 *
 *   node scripts/verify-appearance.mjs
 */
import { chromium } from 'playwright';

const ORIGIN = process.env['STORYBOOK_ORIGIN'] ?? 'http://127.0.0.1:6006';

const story = (id) => `${ORIGIN}/iframe.html?id=${id}&viewMode=story`;

const failures = [];
const checks = [];
const record = (what, ok, detail) => {
  checks.push(what);
  if (!ok) failures.push(`${what}: ${detail}`);
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const open = async (id, ready) => {
  await page.goto(story(id), { waitUntil: 'networkidle' });
  await page.waitForSelector(ready, { timeout: 10000 });
  await page.waitForTimeout(400);
};

/* ------------------------------------------------- a focus ring exists */

/* Crystal's focus is a crisp 2px primary core at 3px offset inside a four-layer
   feathered halo. Checked as "focusing this changes how it looks, and the change
   includes a real outline", because the core's *colour* is the palette's and the
   halo's four layers are built from it. */
const FOCUSABLE = [
  ['actions-button--all-variants', 'button:not(:disabled)', 'a button'],
  ['inputs-textinput--default', 'input', 'a text input'],
  ['navigation-tabs-and-breadcrumbs--tab-strip', '[role="tab"]', 'a tab'],
  ['navigation-links--destinations', 'a', 'a navigation link'],
  /* An icon button rather than a checkbox. React Aria's Checkbox wraps a
     visually hidden `<input>` in a `<label>`, so the focusable node has no box
     and the ring is drawn on the label around it — a real arrangement, and one
     that needs a case of its own rather than being wedged into this list. */
  ['actions-icon-group-and-floating--icons', 'button', 'an icon button'],
];

for (const [id, selector, what] of FOCUSABLE) {
  await open(id, `#storybook-root ${selector}`);
  const seen = await page.evaluate((css) => {
    const element = document.querySelector(`#storybook-root ${css}`);
    if (!element) return null;
    const read = () => {
      const s = getComputedStyle(element);
      return {
        outlineStyle: s.outlineStyle,
        outlineWidth: s.outlineWidth,
        outlineColor: s.outlineColor,
        outlineOffset: s.outlineOffset,
        boxShadow: s.boxShadow,
      };
    };
    const resting = read();
    element.focus();
    /* `:focus-visible` follows the heuristic for how focus arrived, and a
       scripted `.focus()` on a non-text control does not always satisfy it.
       Forcing it would test the rule rather than the component, so the keyboard
       route is used and the element is checked for actually having focus. */
    return { resting, focused: read(), hasFocus: document.activeElement === element };
  }, selector);

  if (!seen) { record(`${what} exists to focus`, false, `no ${selector} in the story`); continue; }

  /* Driven from the keyboard rather than scripted, so `:focus-visible` is true
     the way it is for a person. */
  await page.keyboard.press('Tab');
  const focused = await page.evaluate((css) => {
    const element = document.querySelector(`#storybook-root ${css}`);
    element.focus();
    /* The ring is not always on the focused node, and that is correct rather
       than a workaround. A Crystal text field puts `outline: 0` on the bare
       `<input>` and draws the ring on the field shell around it, because the
       shell is the control a person sees — the input is the part of it that
       takes text. So the question this gate asks is "does focusing this show a
       ring", not "is the ring on this exact element", and it walks up a short
       way to answer it. Three levels: the control, its shell, and the shell's
       own wrapper. Further than that and it would start finding somebody
       else's ring. */
    let node = document.activeElement;
    for (let depth = 0; node && depth < 3; depth += 1, node = node.parentElement) {
      const s = getComputedStyle(node);
      if (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2) {
        return {
          on: node === element ? 'the control' : `an ancestor ${depth} up`,
          outlineStyle: s.outlineStyle,
          outlineWidth: parseFloat(s.outlineWidth),
          outlineColor: s.outlineColor,
          boxShadow: s.boxShadow,
        };
      }
    }
    const s = getComputedStyle(document.activeElement);
    return {
      on: 'nothing',
      outlineStyle: s.outlineStyle,
      outlineWidth: parseFloat(s.outlineWidth),
      outlineColor: s.outlineColor,
      boxShadow: s.boxShadow,
    };
  }, selector);

  const ringed = focused.on !== 'nothing'
    && focused.outlineStyle !== 'none'
    && focused.outlineWidth >= 2
    && !/^rgba\(0, 0, 0, 0\)$/.test(focused.outlineColor)
    && !focused.outlineColor.includes('var(');
  record(
    `${what} shows a focus ring`,
    ringed,
    `focused, the ring is on ${focused.on}: outline ${focused.outlineStyle} `
    + `${focused.outlineWidth}px ${focused.outlineColor} — Crystal's focus is a crisp 2px core, and a control `
    + 'that reads a property nothing defines paints nothing at all',
  );

  record(
    `${what} looks different focused than at rest`,
    focused.boxShadow !== seen.resting.boxShadow || focused.outlineStyle !== seen.resting.outlineStyle,
    'the computed style is identical focused and unfocused, so whatever rule was '
    + 'written is not reaching this element',
  );
}

/* ------------------------------------------- selection is carried by weight */

/* Crystal's rule, and one Meridian has restated: selection is label weight
   alone, never a rail and never a check mark. Weight is typographic rather than
   chromatic, so selection never rests on colour — which is the accessibility
   reason for it and the reason this is checkable without naming a colour. */
const SELECTABLE = [
  ['navigation-tabs-and-breadcrumbs--tab-strip', '[role="tab"]', 'aria-selected', 'a tab'],
  ['navigation-links--destinations', 'a', 'aria-current', 'a navigation link'],
];

for (const [id, selector, marker, what] of SELECTABLE) {
  await open(id, '#storybook-root *');
  const seen = await page.evaluate(({ css, mark }) => {
    const all = [...document.querySelectorAll(`#storybook-root ${css}`)];
    const on = all.find((e) => e.getAttribute(mark) === 'true' || e.getAttribute(mark) === 'page'
      || e.getAttribute(mark) === 'location');
    const off = all.find((e) => e !== on);
    if (!on || !off) return null;
    const weight = (e) => parseInt(getComputedStyle(e).fontWeight, 10);
    return {
      selected: weight(on), other: weight(off),
      text: on.textContent ?? '',
    };
  }, { css: selector, mark: marker });

  if (!seen) { record(`${what} has a selected and an unselected specimen`, false, 'the story renders only one state'); continue; }

  record(
    `${what} carries selection in its weight`,
    seen.selected > seen.other,
    `selected weight ${seen.selected} is not heavier than unselected ${seen.other}. `
    + 'Selection is label weight alone in Crystal; if the weight is equal, whatever '
    + 'marks the selected item is doing it with colour or with a shape, and both are '
    + 'withdrawn',
  );
  record(
    `${what} is not marked with a check`,
    !/[✓✔]/.test(seen.text),
    'a check mark means validated or informational in Crystal, never selected',
  );
}

/* ------------------------------- disabled is not distinguished by opacity alone */

/* Opacity lowers contrast against whatever is behind, and on Resin that is a
   coloured atmosphere gradient — so "faded" is the one signal whose legibility
   depends on the artwork. Something else has to carry it too. */
const DISABLED = [
  ['actions-button--all-variants', 'button', 'a button'],
  ['navigation-tabs-and-breadcrumbs--with-a-disabled-tab', '[role="tab"]', 'a tab'],
];

for (const [id, selector, what] of DISABLED) {
  await open(id, `#storybook-root ${selector}`);
  const seen = await page.evaluate((css) => {
    const all = [...document.querySelectorAll(`#storybook-root ${css}`)];
    const off = all.find((e) => e.hasAttribute('disabled')
      || e.getAttribute('aria-disabled') === 'true' || e.hasAttribute('data-disabled'));
    if (!off) return null;

    const read = (e) => {
      const s = getComputedStyle(e);
      return {
        opacity: s.opacity, color: s.color, backgroundColor: s.backgroundColor,
        borderColor: s.borderColor, cursor: s.cursor, textDecorationLine: s.textDecorationLine,
      };
    };

    /* Compared against *itself* with the state removed, not against a
       neighbouring control. The first version of this compared the disabled
       button to the first enabled button in the story, which is a different
       variant — a quiet button beside a Resin one — so `color` and
       `backgroundColor` always differed and the check passed on anything. It
       could not fail, which is the failure mode this whole suite exists for.
       Toggling the attributes on one element isolates the single variable. */
    const marks = ['disabled', 'aria-disabled', 'data-disabled']
      .filter((name) => off.hasAttribute(name))
      .map((name) => [name, off.getAttribute(name)]);
    const disabled = read(off);
    for (const [name] of marks) off.removeAttribute(name);
    const enabled = read(off);
    for (const [name, value] of marks) off.setAttribute(name, value ?? '');

    return { off: disabled, on: enabled, announced: marks.some(([n]) => n !== 'data-disabled') };
  }, selector);

  if (!seen) { record(`${what} has a disabled specimen`, false, 'the story renders no disabled control'); continue; }

  const besidesOpacity = ['color', 'backgroundColor', 'borderColor', 'cursor', 'textDecorationLine']
    .filter((property) => seen.off[property] !== seen.on[property]);
  record(
    `${what} shows disabled by more than opacity`,
    besidesOpacity.length > 0,
    `with the disabled state removed, the only computed difference is opacity `
    + `(${seen.on.opacity} → ${seen.off.opacity}). Opacity lowers contrast against `
    + 'whatever is behind the control, and on Resin that is a coloured atmosphere '
    + 'gradient, so it is the one signal whose legibility depends on the artwork',
  );
  record(`${what} announces that it is disabled`, seen.announced, 'no disabled or aria-disabled attribute');
}

/* --------------------------------- the primary action carries the colour */

/* Meridian, 22 September 2026: "the Haze content fill should adopt the primary
 * color, not the rim. The text color will need to be adjusted depending on the
 * primary color."
 *
 * The failure this replaces is invisible in a stylesheet and obvious on a screen.
 * The variant set `background` on the button, which sits *behind* the Haze layer
 * — an inset fill — so the colour never reached the label's ground: it showed as
 * the 8px ring of element background left exposed around a white fill. The rule
 * was there, the colour was there, and the primary button still looked like every
 * other button.
 *
 * So the assertion is where the paint lands, not what colour it is: the primary
 * button's *reading fill* differs from a plain Resin button's, and its ink differs
 * too. Both are false the moment the fill goes back to the element — and the
 * first is also false when the fill is painted in a tone so close to the shell
 * around it that nobody can see it, which is the second thing that happened.
 */
{
  await open('actions-button--all-variants', '#storybook-root button');

  const seen = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('#storybook-root button')];
    const named = (text) => buttons.find((node) => node.textContent?.trim() === text);
    const read = (node) => node && ({
      fill: getComputedStyle(node, '::before').backgroundColor,
      ink: getComputedStyle(node).color,
      /* Whether the pad is painted at all, which is how `quiet` differs. */
      pad: getComputedStyle(node, '::before').display,
    });
    return {
      primary: read(named('Primary')),
      plain: read(named('Resin')),
      quiet: read(named('Quiet')),
    };
  });

  if (!seen.primary || !seen.plain) {
    record('the button story renders a primary and a plain Resin specimen', false,
      'one of them is missing, so this comparison has nothing to compare');
  } else {
    record(
      'the primary action is tinted in its reading fill, not its perimeter',
      seen.primary.fill !== seen.plain.fill,
      `the primary button's ::before fill is ${seen.primary.fill}, the same as a plain `
      + 'Resin button\'s. The colour is reaching the element behind the Haze layer, where '
      + 'it shows only as the ring left exposed around the inset fill — which is the '
      + 'defect this rule replaced, and it looks identical in the stylesheet',
    );
    record(
      'the primary action takes the ink tested against that fill',
      seen.primary.ink !== seen.plain.ink,
      `the primary button's colour is ${seen.primary.ink}, the same as a plain Resin `
      + 'button\'s. The fill moved and the ink did not follow it, which is the half of '
      + 'this that contrast depends on',
    );
    record(
      'a quiet button has no reading pad, where every other variant does',
      seen.quiet?.pad === 'none' && seen.plain.pad !== 'none',
      `the quiet button's ::before display is ${seen.quiet?.pad} and a plain Resin `
      + `button's is ${seen.plain.pad}. Quiet is the one variant that is glass all the `
      + 'way through — the label sits on the material rather than on a protected '
      + 'ground — and the base control rule paints a pad on every button, so one '
      + 'suppressed pseudo-element is all that distinguishes it',
    );
  }
}

/* ------------------------------- a table's header band is actually painted */

/* An unclosed block comment in `DataTable.module.scss` deleted every rule from
 * the header down — column, cell, row, checkbox, resizer, footer — and *nothing
 * here noticed*. The compiler is happy: an unterminated comment is valid CSS.
 * `lint:tokens` strips comments before it looks for values. The types are
 * unaffected, no unit test reads a stylesheet, and the other browser gates
 * probed other components. It was found by opening the page and seeing a header
 * 28px tall with 1px of padding — the user agent's defaults, showing through.
 *
 * `lint:tokens` now counts comment delimiters, which catches the cause. This
 * catches the *symptom*, and catches it for any cause: a table whose header is
 * not painted differently from its body is a table with no header band, however
 * that happened. A relationship, not a colour, so it survives a palette change.
 */
{
  await open('data-display-data-table--default', '#storybook-root [role="grid"]');

  const seen = await page.evaluate(() => {
    const header = document.querySelector('#storybook-root [role="columnheader"]');
    const cell = document.querySelector('#storybook-root [role="rowheader"], #storybook-root [role="gridcell"]');
    const read = (node) => node && ({
      background: getComputedStyle(node).backgroundColor,
      colour: getComputedStyle(node).color,
      padding: getComputedStyle(node).padding,
      height: Math.round(node.getBoundingClientRect().height),
    });
    return { header: read(header), cell: read(cell) };
  });

  if (!seen.header || !seen.cell) {
    record('the data table renders a header and a body cell', false, 'one of them is missing');
  } else {
    record(
      'a table header band is painted, and differs from the body',
      seen.header.background !== seen.cell.background && seen.header.colour !== seen.cell.colour,
      `the header's background is ${seen.header.background} and a body cell's is `
      + `${seen.cell.background}; their inks are ${seen.header.colour} and ${seen.cell.colour}. `
      + 'A header that matches its body is a header whose rule is not reaching it',
    );
    record(
      'table cells carry the padding the stylesheet gives them',
      seen.header.padding !== '1px' && seen.header.height > 40,
      `the header's padding is ${seen.header.padding} and it is ${seen.header.height}px tall. `
      + '`1px` is the user agent\'s default for a `th`, which is what shows through when the '
      + 'rule that should be there is not',
    );
  }
}

await browser.close();

console.log(JSON.stringify({
  suite: 'what a state looks like',
  storybook: ORIGIN,
  checks: checks.length,
  failures,
}, null, 2));

if (failures.length) {
  console.error('\nA state that is not visible is a state that is not communicated.');
  console.error('Every assertion here is a relationship, not a colour: if one fails, the rule');
  console.error('it describes is not reaching the element, whatever the stylesheet says.');
  process.exit(1);
}
