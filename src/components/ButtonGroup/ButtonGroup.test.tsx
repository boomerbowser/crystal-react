import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithPrismata, screen, userEvent } from '../../test/render.js';
import { ButtonGroup, SplitButton } from './ButtonGroup.js';
import { Button } from '../Button/Button.js';

describe('ButtonGroup', () => {
  /* The role needs a name. An unnamed group announces "group" and tells the
     reader nothing, and unrelated buttons announced as a group tell them
     something untrue. */
  it('is a group only when it is named', async () => {
    const { container, rerenderWithPrismata } = renderWithPrismata(
      <ButtonGroup><Button>Cut</Button><Button>Copy</Button></ButtonGroup>,
    );
    expect(screen.queryByRole('group')).toBeNull();

    rerenderWithPrismata(
      <ButtonGroup label="Clipboard"><Button>Cut</Button><Button>Copy</Button></ButtonGroup>,
    );
    expect(screen.getByRole('group', { name: 'Clipboard' })).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});

describe('SplitButton', () => {
  /* Two buttons, not one. A single control that behaves differently depending on
     which half was pressed cannot be described to somebody who cannot see that
     there are halves. */
  it('is two buttons with separate names', () => {
    renderWithPrismata(<SplitButton menuLabel="More save options">Save</SplitButton>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'More save options' })).toBeInTheDocument();
  });

  it('declares the disclosure as a menu trigger and its state', async () => {
    const onToggleMenu = vi.fn();
    const { rerenderWithPrismata } = renderWithPrismata(
      <SplitButton menuLabel="More save options" onToggleMenu={onToggleMenu}>Save</SplitButton>,
    );
    const disclosure = screen.getByRole('button', { name: 'More save options' });
    expect(disclosure.getAttribute('aria-haspopup')).toBe('menu');
    expect(disclosure.getAttribute('aria-expanded')).toBe('false');

    await userEvent.click(disclosure);
    expect(onToggleMenu).toHaveBeenCalledTimes(1);

    rerenderWithPrismata(<SplitButton menuLabel="More save options" isOpen>Save</SplitButton>);
    expect(screen.getByRole('button', { name: 'More save options' }).getAttribute('aria-expanded')).toBe('true');
  });
});
