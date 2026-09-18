import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { Chip } from './Chip.js';

describe('Chip', () => {
  /* A chip that merely displays a value must not be a tab stop: it is a label,
     and making it focusable puts a stop on a thing that does nothing. */
  it('is a label, not a control, until it is selectable', async () => {
    const { container } = renderWithCrystal(<Chip>London</Chip>);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('London')).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  /* aria-pressed, not aria-selected: the latter belongs inside a listbox or a
     tablist, and outside one it says the chip is part of a collection it is not. */
  it('announces selection with aria-pressed', () => {
    renderWithCrystal(<Chip isSelectable isSelected>London</Chip>);
    expect(screen.getByRole('button', { name: 'London' }).getAttribute('aria-pressed')).toBe('true');
  });

  /* "Remove" and "select" are two actions on one object, so the remove control
     is a separate named button — and a decorated span is reachable by neither
     keyboard nor screen reader. */
  it('removes through its own named button', async () => {
    const onRemove = vi.fn();
    renderWithCrystal(<Chip onRemove={onRemove}>London</Chip>);
    const remove = screen.getByRole('button', { name: 'Remove London' });
    await userEvent.click(remove);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  /* A button inside a button is one control to the accessibility tree and to the
     pointer, so the remove target and the select target fight over every press.
     Both halves are siblings, and each is reachable on its own. */
  it('is two sibling controls when it is both selectable and removable', async () => {
    const onRemove = vi.fn();
    const onChange = vi.fn();
    const { container } = renderWithCrystal(
      <Chip isSelectable onChange={onChange} onRemove={onRemove}>London</Chip>,
    );
    expect(container.querySelector('button button')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Remove London' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'London' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    await expectNoAxeViolations(container);
  });
});
