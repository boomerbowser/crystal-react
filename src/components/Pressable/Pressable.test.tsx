import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { Pressable } from './Pressable.js';

describe('Pressable', () => {
  it('gives its child button semantics and no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <Pressable onPress={() => undefined}><span>Save</span></Pressable>,
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  /* The reason to take React Aria's press rather than add an onClick: a span with
     onClick does not activate on Space, so a keyboard user cannot use it. */
  it('activates on Space and Enter, not only on a pointer', async () => {
    const onPress = vi.fn();
    renderWithCrystal(<Pressable onPress={onPress}><span>Save</span></Pressable>);
    const target = screen.getByRole('button', { name: 'Save' });

    target.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onPress).toHaveBeenCalledTimes(2);

    await userEvent.click(target);
    expect(onPress).toHaveBeenCalledTimes(3);
  });

  /* Motion binds to the press state rather than to a pointer event, which is what
     makes a keyboard user see the animation a mouse user sees. */
  it('plays Crystal\'s press recipe from the press state', async () => {
    renderWithCrystal(<Pressable onPress={() => undefined}><span>Save</span></Pressable>);
    const target = screen.getByRole('button', { name: 'Save' });
    target.focus();
    await userEvent.keyboard('{Enter}');
    expect(target.dataset['crMotionName'] ?? target.dataset['crMotionState']).toBeDefined();
  });

  /* Not every pressable thing is a button. A tab or a link keeps its own role. */
  it('takes a different role when the thing is not a button', () => {
    renderWithCrystal(
      <Pressable onPress={() => undefined} role="tab"><span>Overview</span></Pressable>,
    );
    expect(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument();
  });

  it('does not fire when disabled', async () => {
    const onPress = vi.fn();
    renderWithCrystal(<Pressable onPress={onPress} isDisabled><span>Save</span></Pressable>);
    await userEvent.click(screen.getByText('Save'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
