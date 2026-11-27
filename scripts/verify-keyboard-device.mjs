#!/usr/bin/env node
/* The editor's toolbar above a real keyboard (R-T5).
 *
 * On a touch screen the rich text surface puts its toolbar below the text and
 * sticks it to the bottom of the screen, above the on-screen keyboard. The
 * keyboard's height is read from the visual viewport (`useKeyboardInset`),
 * because Chrome on Android has resized only the visual viewport for the
 * keyboard since Chrome 108, iOS Safari never resizes the layout viewport, and
 * `env(keyboard-inset-height)` is there only where a page opts into the
 * VirtualKeyboard API. No emulator opens a keyboard, so this runs in Chrome on
 * a connected Android phone, as Prismata's D-4 was closed on a Pixel 6 Pro.
 *
 * It opens the editor, taps into the text so the keyboard opens, and measures,
 * rather than assumes, the visual viewport, the inset the hook computed, and
 * the toolbar's box. It then types, so the check also holds once the document
 * grows under the keyboard. Each step keeps a device screenshot, which shows
 * the real keyboard, when `--keep` names a folder.
 *
 * Needs, on the phone: USB debugging on and this computer allowed; Chrome, with
 * "Enable command line on non-rooted devices" turned on in chrome://flags
 * (Playwright's Android driver requires it). On this computer: `adb` on the
 * path, and Storybook on 6006 (`pnpm storybook`, or `storybook-static` served
 * there), which the phone reaches through `adb reverse`, set up here.
 *
 *   pnpm run verify:keyboard:device [-- --keep <dir>]
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { _android as android } from 'playwright';

const PORT = 6006;
const STORY = 'inputs-richtextsurface--default';
const keepAt = process.argv.indexOf('--keep');
const KEEP = keepAt === -1 ? null : process.argv[keepAt + 1];
if (KEEP) mkdirSync(KEEP, { recursive: true });

const [device] = await android.devices();
if (!device) {
  console.error('No Android device is connected. Connect a phone with USB debugging on, allow this computer, and run again.');
  process.exit(2);
}
const MODEL = device.model();
execFileSync('adb', ['-s', device.serial(), 'reverse', `tcp:${PORT}`, `tcp:${PORT}`]);
console.log(`Device: ${MODEL} (${device.serial()}), reaching Storybook on localhost:${PORT}.`);

await device.shell('am force-stop com.android.chrome');
const context = await device.launchBrowser();
const tab = await context.newPage();
const failures = [];
const steps = [];

const measure = () => tab.evaluate(() => {
  const viewport = window.visualViewport;
  const toolbar = document.querySelector('#storybook-root .pr-editor-toolbar');
  const surface = document.querySelector('#storybook-root [contenteditable=true]');
  const box = toolbar?.getBoundingClientRect();
  const visibleBottom = viewport ? viewport.offsetTop + viewport.height : window.innerHeight;
  return {
    userAgent: navigator.userAgent,
    innerHeight: window.innerHeight,
    visual: viewport ? { height: Math.round(viewport.height * 10) / 10, offsetTop: Math.round(viewport.offsetTop * 10) / 10 } : null,
    covered: viewport ? Math.round(window.innerHeight - viewport.height - viewport.offsetTop) : null,
    virtualKeyboard: 'virtualKeyboard' in navigator,
    pointerCoarse: matchMedia('(pointer: coarse)').matches,
    inset: toolbar ? getComputedStyle(toolbar).getPropertyValue('--pr-keyboard-inset').trim()
      || getComputedStyle(toolbar.parentElement).getPropertyValue('--pr-keyboard-inset').trim() : null,
    placement: toolbar?.closest('[data-toolbar]')?.getAttribute('data-toolbar') ?? null,
    position: toolbar ? getComputedStyle(toolbar).position : null,
    toolbar: box ? { top: Math.round(box.top * 10) / 10, bottom: Math.round(box.bottom * 10) / 10, height: Math.round(box.height) } : null,
    visibleBottom: Math.round(visibleBottom * 10) / 10,
    focused: document.activeElement === surface || surface?.contains(document.activeElement) || false,
  };
});
/* A person's tap, through Android's input, not a synthesized web event: only a
   real touch on an editable element opens the keyboard. The page starts below
   Chrome's toolbar, whose bottom edge is read from the view hierarchy each time
   (it hides as the page scrolls), and a CSS pixel is devicePixelRatio of the
   screen's. */
const adb = (...args) => execFileSync('adb', ['-s', device.serial(), ...args]).toString();
const realTap = async (selector) => {
  adb('shell', 'uiautomator', 'dump', '/sdcard/prismata.xml');
  const xml = adb('shell', 'cat', '/sdcard/prismata.xml');
  const bounds = (id) => xml.match(new RegExp(`resource-id="com.android.chrome:id/${id}"[^>]*?bounds="\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]"`))?.slice(1).map(Number);
  const top = bounds('control_container')?.[3] ?? bounds('compositor_view_holder')?.[1] ?? 0;
  const { x, y, ratio } = await tab.evaluate((selector) => {
    const r = document.querySelector(selector).getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + Math.min(r.height / 2, 24), ratio: devicePixelRatio };
  }, selector);
  adb('shell', 'input', 'tap', String(Math.round(x * ratio)), String(Math.round(top + y * ratio)));
};
/* Typed through the phone's own input, a word at a time, as the keyboard would. */
const realType = (text) => { for (const word of text.split(' ')) adb('shell', 'input', 'text', `${word.replace(/[^A-Za-z0-9,.]/g, '')}%s`); };
const keep = async (name) => {
  if (!KEEP) return;
  writeFileSync(join(KEEP, `${name}.png`), await device.screenshot());
};

await tab.goto(`http://localhost:${PORT}/iframe.html?id=${STORY}&viewMode=story`, { waitUntil: 'load' });
await tab.waitForSelector('#storybook-root [contenteditable=true]');
await tab.waitForTimeout(1200);
/* Chrome shows a notice for the command-line flag Playwright needs, over the
   bottom of the page, and it stays; swiped away so the screenshots show the
   toolbar. Measurements do not depend on it. */
adb('shell', 'input', 'swipe', '200', '1720', '1350', '1720', '200');
await tab.waitForTimeout(800);
const atRest = await measure();
steps.push(['at rest', atRest]);
await keep('1-at-rest');

await realTap('#storybook-root [contenteditable=true]');
await tab.waitForTimeout(1500);
const open = await measure();
steps.push(['keyboard open', open]);
await keep('2-keyboard-open');

realType('A line typed on the phone, then another. '.repeat(6).trim());
adb('shell', 'input', 'keyevent', 'KEYCODE_ENTER');
realType('And a second paragraph, so the document grows under the keyboard.');
await tab.waitForTimeout(900);
const typed = await measure();
steps.push(['after typing', typed]);
await keep('3-after-typing');

const above = (m) => m.toolbar && m.toolbar.bottom <= m.visibleBottom + 0.5 && m.toolbar.top >= (m.visual?.offsetTop ?? 0) - 0.5;
if (!atRest.pointerCoarse) failures.push('the phone does not report a coarse pointer, so the editor did not take its touch layout');
if (!open.focused) failures.push('the tap did not focus the editor');
if (!(open.covered > 40)) failures.push(`no keyboard was measured: the visual viewport covers all but ${open.covered}px of the layout viewport`);
for (const [name, m] of steps.slice(1)) {
  if (!above(m)) failures.push(`${name}: the toolbar spans ${m.toolbar?.top}–${m.toolbar?.bottom}px and the visible area ends at ${m.visibleBottom}px`);
}

await tab.close();
await context.close();
execFileSync('adb', ['-s', device.serial(), 'reverse', '--remove', `tcp:${PORT}`]);
await device.close();

console.log(JSON.stringify({ suite: 'the editor toolbar above a real keyboard', device: MODEL, steps: Object.fromEntries(steps), failures }, null, 2));
if (failures.length) process.exit(1);
