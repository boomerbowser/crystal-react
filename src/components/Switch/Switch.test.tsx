import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { Switch } from './Switch.js';

describe('Switch', () => {
  /* A switch and a checkbox are announced differently because they mean
     different things: a checkbox is a value that will be submitted, a switch
     takes effect now. Rendering one as the other tells the reader the wrong
     thing about when their change applies. */
  it('is a switch, not a checkbox', async () => {
    const { container } = renderWithCrystal(<Switch>Wi-Fi</Switch>);
    expect(screen.getByRole('switch', { name: 'Wi-Fi' })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).toBeNull();
    await expectNoAxeViolations(container);
  });

  it('announces its state', () => {
    const { rerenderWithCrystal } = renderWithCrystal(<Switch isSelected={false}>Wi-Fi</Switch>);
    expect(screen.getByRole('switch', { name: 'Wi-Fi' })).not.toBeChecked();

    rerenderWithCrystal(<Switch isSelected>Wi-Fi</Switch>);
    expect(screen.getByRole('switch', { name: 'Wi-Fi' })).toBeChecked();
  });

  it('toggles from the keyboard', async () => {
    const onChange = vi.fn();
    renderWithCrystal(<Switch onChange={onChange}>Wi-Fi</Switch>);
    screen.getByRole('switch', { name: 'Wi-Fi' }).focus();
    await userEvent.keyboard(' ');
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
