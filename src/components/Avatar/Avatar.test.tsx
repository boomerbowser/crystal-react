import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { fireEvent, renderWithCrystal, screen } from '../../test/render.js';
import { Avatar, nameInitials } from './Avatar.js';

describe('Avatar', () => {
  /* First and last, not every part: "María del Carmen Rodríguez" is MR. */
  it('reduces a name to the first and last initial', () => {
    expect(nameInitials('Ada Lovelace')).toBe('AL');
    expect(nameInitials('María del Carmen Rodríguez')).toBe('MR');
    expect(nameInitials('Prince')).toBe('P');
    expect(nameInitials('   ')).toBe('');
  });

  it('shows the initials it derived, and the ones it was given instead', () => {
    const { rerenderWithCrystal } = renderWithCrystal(<Avatar name="Ada Lovelace" />);
    expect(screen.getByText('AL')).toBeInTheDocument();
    rerenderWithCrystal(<Avatar name="Ada Lovelace" initials="Ada" />);
    expect(screen.getByText('Ada')).toBeInTheDocument();
  });

  /* An avatar that shows somebody's initials is identifying them, so it must say
     who; one with no name is decoration beside a label that already does. */
  it('is named when it identifies somebody and hidden when it does not', () => {
    const { rerenderWithCrystal } = renderWithCrystal(<Avatar data-testid="avatar" />);
    expect(screen.getByTestId('avatar')).toHaveAttribute('aria-hidden', 'true');
    rerenderWithCrystal(<Avatar name="Ada Lovelace" data-testid="avatar" />);
    expect(screen.getByRole('img', { name: 'Ada Lovelace' })).toBeInTheDocument();
  });

  /* A broken-image icon where a face should be is worse than never having
     tried. */
  it('falls back to the initials when the image fails', () => {
    const { container } = renderWithCrystal(
      <Avatar name="Ada Lovelace" src="/ada.jpg" data-testid="avatar" />,
    );
    expect(screen.getByTestId('avatar').dataset['state']).toBe('loading');
    const image = container.querySelector('img');
    expect(image).not.toBeNull();
    fireEvent.error(image as HTMLImageElement);
    expect(screen.getByTestId('avatar').dataset['state']).toBe('error');
    expect(screen.getByText('AL')).toBeInTheDocument();
  });

  /* Without this, a virtualised row that has already failed shows one person's
     initials over another's photograph. */
  it('starts again when the src changes', () => {
    const { container, rerenderWithCrystal } = renderWithCrystal(
      <Avatar name="Ada Lovelace" src="/ada.jpg" data-testid="avatar" />,
    );
    fireEvent.load(container.querySelector('img') as HTMLImageElement);
    expect(screen.getByTestId('avatar').dataset['state']).toBe('loaded');

    rerenderWithCrystal(<Avatar name="Grace Hopper" src="/grace.jpg" data-testid="avatar" />);
    expect(screen.getByTestId('avatar').dataset['state']).toBe('loading');
  });

  /* The wrapper carries the name; an alt here would announce the person twice. */
  it('renders the image presentationally', () => {
    const { container } = renderWithCrystal(<Avatar name="Ada Lovelace" src="/ada.jpg" />);
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <Avatar name="Ada Lovelace" src="/ada.jpg" size="lg" />,
    );
    await expectNoAxeViolations(container);
  });
});
