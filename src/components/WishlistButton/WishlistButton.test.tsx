import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { WishlistButton } from './WishlistButton.js';

describe('WishlistButton', () => {
  /* The name is a verb phrase and stays put; `aria-pressed` carries the state.
     A name that flipped to "Remove" would be announced as "Remove from
     wishlist, pressed", which is a contradiction the reader has to resolve. */
  it('keeps one name and puts the state on aria-pressed', () => {
    const { rerenderWithCrystal } = renderWithCrystal(
      <WishlistButton item="Harbour print" isSaved={false} onChange={() => {}} />,
    );
    const control = screen.getByRole('button', { name: 'Save Harbour print to your wishlist' });
    expect(control).toHaveAttribute('aria-pressed', 'false');

    rerenderWithCrystal(<WishlistButton item="Harbour print" isSaved onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Save Harbour print to your wishlist' }))
      .toHaveAttribute('aria-pressed', 'true');
  });

  /* A listing page has thirty of these, and thirty controls called "Save to
     wishlist" are thirty identical rows in a screen reader's element list. */
  it('names the thing it is saving', () => {
    renderWithCrystal(
      <>
        <WishlistButton item="Harbour print" isSaved={false} onChange={() => {}} />
        <WishlistButton item="The long bridge" isSaved={false} onChange={() => {}} />
      </>,
    );
    expect(screen.getByRole('button', { name: /Harbour print/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /The long bridge/ })).toBeInTheDocument();
  });

  it('toggles', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithCrystal(<WishlistButton item="Harbour print" isSaved onChange={onChange} />);
    await user.click(screen.getByRole('button'));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  /* "Resin pill or icon button" — the same name either way, because an icon has
     no other one. */
  it('is the same control in either shape', () => {
    renderWithCrystal(<WishlistButton item="Harbour print" isSaved={false} onChange={() => {}} iconOnly />);
    expect(screen.getByRole('button', { name: 'Save Harbour print to your wishlist' }))
      .toHaveAttribute('aria-pressed', 'false');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <WishlistButton item="Harbour print" isSaved onChange={() => {}} />,
    );
    await expectNoAxeViolations(container);
  });
});
