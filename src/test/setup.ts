import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

/* Blur whatever holds focus before Testing Library unmounts the tree.
 *
 * React Aria tracks focus-within on composite widgets, and its blur handler asks
 * `document.body.contains(event.relatedTarget)`. In a browser `relatedTarget` is
 * always a node or null, so that question is always answerable. In jsdom, a blur
 * raised by removing the focused element during cleanup arrives without one, and
 * the handler throws `Failed to execute 'contains' on 'Node'` — outside any
 * test's call stack, so Vitest reports it as an unhandled error and warns that
 * results may be false positives.
 *
 * It is not a defect in any component: the same interaction in a real browser,
 * and the same component rendered without focus ever entering it, raise nothing.
 * It surfaced with the tree, which is the first widget here whose rows hold
 * focus on behalf of a button inside them.
 *
 * Blurring first is what a browser does on navigation, and it makes the teardown
 * ask a question jsdom can answer. This runs before Testing Library's own
 * `afterEach`, because the setup file is registered first.
 */
afterEach(() => {
  const active = document.activeElement;
  if (active instanceof HTMLElement && active !== document.body) active.blur();
});
