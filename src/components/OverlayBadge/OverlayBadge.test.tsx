import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithPrismata, screen } from '../../test/render.js';
import { Avatar } from '../Avatar/Avatar.js';
import { OverlayBadge } from './OverlayBadge.js';

describe('OverlayBadge', () => {
  /* "Labels its host rather than standing alone", so a decorative mark over a
     named thing is hidden, where it would otherwise be read as a second unnamed
     thing. */
  it('is hidden until it is given something to say', () => {
    const { rerenderWithPrismata } = renderWithPrismata(
      <OverlayBadge badge="✓"><Avatar name="Ada Lovelace" /></OverlayBadge>,
    );
    expect(screen.getByText('✓')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getAllByRole('img')).toHaveLength(1);

    rerenderWithPrismata(
      <OverlayBadge badge="✓" label="Verified"><Avatar name="Ada Lovelace" /></OverlayBadge>,
    );
    expect(screen.getByRole('img', { name: 'Verified' })).toBeInTheDocument();
  });

  it('keeps the badge beside its host rather than inside it', () => {
    renderWithPrismata(
      <OverlayBadge badge="✓" label="Verified" data-testid="wrap">
        <Avatar name="Ada Lovelace" />
      </OverlayBadge>,
    );
    const host = screen.getByRole('img', { name: 'Ada Lovelace' });
    const badge = screen.getByRole('img', { name: 'Verified' });
    expect(host.contains(badge)).toBe(false);
    expect(screen.getByTestId('wrap').contains(badge)).toBe(true);
  });

  /* "Never clipped by its host": the badge overhangs, so the wrapper must not
     cut it off. */
  it('does not clip its own wrapper', () => {
    renderWithPrismata(
      <OverlayBadge badge="✓" data-testid="wrap"><Avatar name="Ada" /></OverlayBadge>,
    );
    expect(screen.getByTestId('wrap').className).toMatch(/host/);
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithPrismata(
      <OverlayBadge badge="✓" label="Verified" placement="bottom-end">
        <Avatar name="Ada Lovelace" size="lg" />
      </OverlayBadge>,
    );
    await expectNoAxeViolations(container);
  });
});
