import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { SkipLink } from './SkipLink.js';

describe('SkipLink', () => {
  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <div><SkipLink targetId="main" /><main id="main">Content</main></div>,
    );
    await expectNoAxeViolations(container);
  });

  /* A hash link moves the viewport but not always focus, so the next Tab
     continues from where it was and the link appears to do nothing. The target
     is made programmatically focusable, and no more than that. */
  it('moves focus to the target, not only the viewport', async () => {
    renderWithCrystal(
      <div><SkipLink targetId="main" /><main id="main">Content</main></div>,
    );
    await userEvent.click(screen.getByRole('link', { name: 'Skip to content' }));

    const target = document.getElementById('main');
    expect(document.activeElement).toBe(target);
    /* -1 keeps it out of the tab order: the target is reachable by the link, not
       a stop of its own. */
    expect(target?.getAttribute('tabindex')).toBe('-1');
  });

  /* A target that is already focusable keeps whatever tab position it had. */
  it('leaves an already-focusable target alone', async () => {
    renderWithCrystal(
      <div><SkipLink targetId="main" /><section id="main" tabIndex={0}>Content</section></div>,
    );
    await userEvent.click(screen.getByRole('link', { name: 'Skip to content' }));
    expect(document.getElementById('main')?.getAttribute('tabindex')).toBe('0');
  });
});
