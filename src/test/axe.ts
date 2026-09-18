/* Accessibility assertion without a custom matcher.
 *
 * `vitest-axe`'s matcher needs its assertion types wired into Vitest's interface,
 * and a matcher that exists at runtime but not at compile time is one a refactor
 * can silently drop. Asserting on the result directly is fully typed, and naming
 * the violated rules makes a failure readable without opening the report.
 */
import { axe } from 'vitest-axe';
import { expect } from 'vitest';

export async function expectNoAxeViolations(container: Element): Promise<void> {
  const results = await axe(container);
  const violations = results.violations.map((v) => `${v.id}: ${v.help}`);
  expect(violations).toEqual([]);
}
