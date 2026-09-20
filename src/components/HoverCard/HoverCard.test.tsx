import { describe, expect, it, vi } from 'vitest';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { HoverCard } from './HoverCard.js';

/* Real timers, short delays. Fake timers deadlock against userEvent's own wait
   and React Aria's internal scheduling, and the three of them together test the
   clock rather than the component. The properties worth proving — that a delay
   exists, that focus opens it, and that the pointer survives the crossing from
   trigger to card — are all provable with a delay short enough to wait out. */
function Card({ openDelay = 10, closeDelay = 10 }: { openDelay?: number; closeDelay?: number }): React.JSX.Element {
  return (
    <HoverCard
      trigger={<a href="/ada">Ada Lovelace</a>}
      label="Ada Lovelace"
      openDelay={openDelay}
      closeDelay={closeDelay}
    >
      <p>Mathematician</p>
    </HoverCard>
  );
}

describe('HoverCard', () => {
  it('does not open the moment the pointer arrives', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Card openDelay={100_000} />);
    await user.hover(screen.getByRole('link', { name: 'Ada Lovelace' }));
    /* A card that fires as the pointer crosses on its way somewhere else fills
       the screen with previews nobody asked for. */
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens once the pointer has rested', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Card />);
    await user.hover(screen.getByRole('link', { name: 'Ada Lovelace' }));
    expect(await screen.findByRole('dialog', { name: 'Ada Lovelace' })).toBeTruthy();
  });

  it('opens on focus, not only on hover', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Card />);
    /* Hover alone makes the preview unreachable from the keyboard, and makes
       whatever it previews unreachable with it. */
    await user.tab();
    expect(await screen.findByRole('dialog', { name: 'Ada Lovelace' })).toBeTruthy();
  });

  it('stays open while the pointer travels from the trigger into the card', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Card />);
    await user.hover(screen.getByRole('link', { name: 'Ada Lovelace' }));
    await screen.findByRole('dialog', { name: 'Ada Lovelace' });

    /* The crossing. A boolean would close here — the pointer leaves the trigger
       before it enters the card — and this is the one journey the component has
       to survive, because the card is the thing being reached for. */
    await user.hover(screen.getByText('Mathematician'));
    expect(screen.getByRole('dialog', { name: 'Ada Lovelace' })).toBeTruthy();
  });

  it('closes once the pointer is over neither', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<><Card /><p>elsewhere</p></>);
    await user.hover(screen.getByRole('link', { name: 'Ada Lovelace' }));
    await screen.findByRole('dialog', { name: 'Ada Lovelace' });
    await user.hover(screen.getByText('elsewhere'));
    await vi.waitFor(() => { expect(screen.queryByRole('dialog')).toBeNull(); });
  });

  it('leaves the trigger its own accessible name', () => {
    renderWithCrystal(<Card />);
    /* The card supplements a name that already exists; it is never the name. */
    expect(screen.getByRole('link', { name: 'Ada Lovelace' })).toBeTruthy();
  });
});
