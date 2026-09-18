import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { IconButton, CloseButton } from './IconButton.js';

const Star = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3 7h7l-5 5 2 7-7-4-7 4 2-7-5-5h7z" /></svg>;

describe('IconButton', () => {
  it('has no accessibility violations and takes its name from the label', async () => {
    const { container } = renderWithCrystal(<IconButton label="Add to favourites" icon={Star} />);
    expect(screen.getByRole('button', { name: 'Add to favourites' })).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  /* A screen reader reading both the icon's own title and the button's label
     says the thing twice. */
  it('hides the icon from assistive technology', () => {
    renderWithCrystal(<IconButton label="Add to favourites" icon={Star} />);
    const button = screen.getByRole('button', { name: 'Add to favourites' });
    expect(button.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  /* A toggle says it is one. Without aria-pressed the control announces the same
     thing whether it is on or off. */
  it('announces a toggle as a toggle', () => {
    const { rerenderWithCrystal } = renderWithCrystal(
      <IconButton label="Favourite" icon={Star} isSelected={false} />,
    );
    expect(screen.getByRole('button', { name: 'Favourite' }).getAttribute('aria-pressed')).toBe('false');

    rerenderWithCrystal(<IconButton label="Favourite" icon={Star} isSelected />);
    expect(screen.getByRole('button', { name: 'Favourite' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('is not a toggle unless it is one', () => {
    renderWithCrystal(<IconButton label="Favourite" icon={Star} />);
    expect(screen.getByRole('button', { name: 'Favourite' }).getAttribute('aria-pressed')).toBeNull();
  });

  it('presses', async () => {
    const onPress = vi.fn();
    renderWithCrystal(<IconButton label="Favourite" icon={Star} onPress={onPress} />);
    await userEvent.click(screen.getByRole('button', { name: 'Favourite' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('CloseButton', () => {
  /* A page with three dismissible things has three buttons called "Close", and a
     screen reader user listing the controls learns nothing about any of them. */
  it('names what it closes', () => {
    renderWithCrystal(<CloseButton closes="the filters panel" />);
    expect(screen.getByRole('button', { name: 'Close the filters panel' })).toBeInTheDocument();
  });
});
