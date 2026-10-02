import { describe, expect, it, vi } from 'vitest';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { Stepper } from './Stepper.js';

const steps = [
  { id: 'account', label: 'Account', state: 'complete' as const },
  { id: 'details', label: 'Details', description: 'Name and address', state: 'current' as const },
  { id: 'payment', label: 'Payment', state: 'upcoming' as const },
  { id: 'review', label: 'Review', state: 'error' as const },
];

describe('Stepper', () => {
  it('is an ordered list, because the order is the meaning', () => {
    const { container } = renderWithCrystal(<Stepper steps={steps} aria-label="Checkout" />);
    expect(container.querySelector('ol')).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Checkout' })).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(steps.length);
  });

  it('says each step position, label and state in words', () => {
    renderWithCrystal(<Stepper steps={steps} onNavigate={vi.fn()} />);
    /* A tick, a number and a warning glyph mean nothing to a reader who does
       not see them. */
    expect(screen.getByRole('button', { name: 'Step 1 of 4: Account, complete' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Step 2 of 4: Details, Name and address, current' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Step 3 of 4: Payment, not started' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Step 4 of 4: Review, needs attention' })).toBeTruthy();
  });

  it('marks the current step with aria-current="step", not page and not selected', () => {
    renderWithCrystal(<Stepper steps={steps} />);
    const current = screen.getAllByRole('listitem').filter((li) => li.getAttribute('aria-current'));
    expect(current).toHaveLength(1);
    expect(current[0]?.getAttribute('aria-current')).toBe('step');
    for (const li of screen.getAllByRole('listitem')) {
      expect(li.getAttribute('aria-selected')).toBeNull();
    }
  });

  it('is not focusable where navigation is not real', () => {
    renderWithCrystal(<Stepper steps={steps} />);
    /* No onNavigate: nothing here is a control, so nothing here takes focus.
       A control that focuses and does nothing is worse than a plain inert one. */
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('does not make a disabled step a control', () => {
    renderWithCrystal(
      <Stepper steps={steps.map((s) => (s.id === 'payment' ? { ...s, isDisabled: true } : s))} onNavigate={vi.fn()} />,
    );
    expect(screen.getAllByRole('button')).toHaveLength(steps.length - 1);
    expect(screen.queryByRole('button', { name: /Payment/ })).toBeNull();
  });

  it('reports the step it was asked for', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    renderWithCrystal(<Stepper steps={steps} onNavigate={onNavigate} />);
    await user.click(screen.getByRole('button', { name: /Account/ }));
    expect(onNavigate).toHaveBeenCalledWith('account');
  });

  it('takes the state wording it is given', () => {
    renderWithCrystal(
      <Stepper
        steps={steps}
        onNavigate={vi.fn()}
        stateLabels={{ upcoming: 'à venir', current: 'en cours', complete: 'terminé', error: 'à corriger' }}
      />,
    );
    expect(screen.getByRole('button', { name: /terminé/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /à corriger/ })).toBeTruthy();
  });
});
