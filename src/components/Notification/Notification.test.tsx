import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Notification } from './Notification.js';

describe('Notification', () => {
  /* Crystal's rule, doing the same job one component along: nothing is drawn
     beside the title to mark it. A dot beside the title offsets the very title
     it points at, so the unread item stops lining up with the others. */
  it('marks unread with label weight and nothing beside the label', () => {
    const { container } = renderWithCrystal(
      <ul><Notification unread title="Build failed" /></ul>,
    );
    const item = container.querySelector('[data-unread]');
    expect(item).not.toBeNull();
    /* One well (the status symbol) and one title. No third mark. */
    expect(item!.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
  });

  /* Weight is not something a screen reader reads out, so it is said too. */
  it('says "unread" for a reader who cannot see the weight', () => {
    renderWithCrystal(<ul><Notification unread title="Build failed" /></ul>);
    expect(screen.getByRole('listitem', { name: /^Unread\.\s*Build failed$/ })).toBeInTheDocument();
  });

  it('does not say it when it is read', () => {
    renderWithCrystal(<ul><Notification title="Build failed" /></ul>);
    expect(screen.getByRole('listitem', { name: 'Build failed' })).toBeInTheDocument();
  });

  /* The words are the caller's — "3 minutes ago" has to be in the reader's
     language and has to age — but the machine-readable stamp is the element's. */
  it('carries a machine-readable time beside the words', () => {
    const { container } = renderWithCrystal(
      <ul>
        <Notification title="Build failed" dateTime="2026-09-23T09:15:00Z" timestamp="3 minutes ago" />
      </ul>,
    );
    expect(container.querySelector('time')).toHaveAttribute('datetime', '2026-09-23T09:15:00Z');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <ul><Notification unread title="Build failed" timestamp="3 minutes ago" /></ul>,
    );
    await expectNoAxeViolations(container);
  });
});
