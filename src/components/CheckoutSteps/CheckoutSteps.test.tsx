import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { CheckoutSteps } from './CheckoutSteps.js';

const steps = [
  { id: 'bag', label: 'Bag', state: 'complete' as const },
  { id: 'delivery', label: 'Delivery', state: 'complete' as const },
  { id: 'payment', label: 'Payment', state: 'current' as const },
  { id: 'confirm', label: 'Confirm', state: 'upcoming' as const },
];

describe('CheckoutSteps', () => {
  /* "The current step is aria-current" — `step`, the value that exists for
     exactly this, and not `page` or `aria-selected`. */
  it('marks the current step with aria-current="step"', () => {
    const { container } = renderWithCrystal(<CheckoutSteps steps={steps} />);
    const current = container.querySelectorAll('[aria-current]');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAttribute('aria-current', 'step');
    expect(current[0]).toHaveTextContent('Payment');
  });

  /* "Completion is stated in words." A tick and a number are two shapes; to a
     reader who does not see them they are nothing at all. */
  it('says each state in words, not only in a glyph', () => {
    renderWithCrystal(<CheckoutSteps steps={steps} />);
    expect(screen.getByLabelText(/Step 1 of 4: Bag, complete/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Step 3 of 4: Payment, current/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Step 4 of 4: Confirm, not started/)).toBeInTheDocument();
  });

  /* The check mark is hidden from assistive technology, because the word is
     already there — a reader hearing both would get "tick, complete". */
  it('hides the check mark from anything that reads', () => {
    const { container } = renderWithCrystal(<CheckoutSteps steps={steps} />);
    const ticks = [...container.querySelectorAll('*')]
      .filter((one) => one.textContent === '✓' && one.children.length === 0);
    expect(ticks.length).toBeGreaterThan(0);
    expect(ticks.every((one) => one.closest('[aria-hidden="true"]') !== null)).toBe(true);
  });

  it('names the sequence, so two of them are distinguishable', () => {
    renderWithCrystal(<CheckoutSteps steps={steps} />);
    expect(screen.getByRole('list', { name: 'Checkout' })).toBeInTheDocument();
  });

  /* The order is the meaning, and an ordered list says how many there are and
     which one this is for free. */
  it('is an ordered list', () => {
    const { container } = renderWithCrystal(<CheckoutSteps steps={steps} />);
    expect(container.querySelector('ol')).not.toBeNull();
    expect(container.querySelectorAll('li')).toHaveLength(4);
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(<CheckoutSteps steps={steps} />);
    await expectNoAxeViolations(container);
  });
});
