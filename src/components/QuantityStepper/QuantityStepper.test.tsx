import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { QuantityStepper } from './QuantityStepper.js';

function Harness({ min = 1, max = 5 }: { min?: number; max?: number }) {
  const [value, setValue] = useState(1);
  return (
    <QuantityStepper label="Quantity" value={value} onChange={setValue} minValue={min} maxValue={max} />
  );
}

describe('QuantityStepper', () => {
  /* "The value is typable", which is the half of "a spin button" that is
     available: React Aria strips the role and all three value attributes,
     because — its own comment — "we can't focus a spin button with VO". What
     has to be true either way is that this is an operable number and not a
     piece of text between two buttons. See R-22. */
  it('is a typable number with a numeric keypad', () => {
    renderWithCrystal(<Harness />);
    const field = screen.getByRole('textbox', { name: 'Quantity' }) as HTMLInputElement;
    expect(field.value).toBe('1');
    expect(field.inputMode).toBe('numeric');
    expect(field).toHaveAttribute('aria-roledescription', 'Number field');
  });

  /* A reader who wants twelve of something should not have to press a control
     twelve times, so the arrow keys step and the value can be typed over. */
  it('steps from the keyboard as well as from the controls', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Harness />);
    const field = screen.getByRole('textbox', { name: 'Quantity' }) as HTMLInputElement;
    field.focus();
    await user.keyboard('{ArrowUp}');
    expect(field.value).toBe('2');
    await user.keyboard('{ArrowDown}');
    expect(field.value).toBe('1');
  });

  it('steps from either control', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Harness />);
    const field = screen.getByRole('textbox', { name: 'Quantity' }) as HTMLInputElement;
    await user.click(screen.getByRole('button', { name: /One more/ }));
    expect(field.value).toBe('2');
    await user.click(screen.getByRole('button', { name: /One fewer/ }));
    expect(field.value).toBe('1');
  });

  /* React Aria appends the field's own label, so a page with four steppers does
     not have four buttons called "One more". */
  it('names its controls after what they count', () => {
    renderWithCrystal(<Harness />);
    expect(screen.getByRole('button', { name: 'One more Quantity' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'One fewer Quantity' })).toBeInTheDocument();
  });

  /* "The bounds are announced when reached." Disabling the control shows the
     bound and does not say it — a reader who cannot see it grey out presses it
     again and is told nothing. */
  it('announces a bound when it is reached', async () => {
    const user = userEvent.setup();
    /* Three, so that stepping back from the maximum lands somewhere that is
       not also the minimum — with a range of one step, every value is a bound
       and the clearing half of this test could not be seen. */
    renderWithCrystal(<Harness max={3} />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    await user.click(screen.getByRole('button', { name: /One more/ }));
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    await user.click(screen.getByRole('button', { name: /One more/ }));
    expect(screen.getByRole('status')).toHaveTextContent('3 is the largest quantity');
    await user.click(screen.getByRole('button', { name: /One fewer/ }));
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    await user.click(screen.getByRole('button', { name: /One fewer/ }));
    expect(screen.getByRole('status')).toHaveTextContent('1 is the smallest quantity');
  });

  /* Reached, not started at. A stepper rendered at its minimum has not reached
     anything, and announcing on mount is a component speaking at rest. */
  it('says nothing about a bound it started on', () => {
    renderWithCrystal(<Harness />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  /* "A bounded integer", and the bound is enforced at the parser rather than by
     rounding afterwards: `maximumFractionDigits: 0` makes the decimal separator
     unparseable, so a fraction cannot be entered in the first place. That is
     the stronger of the two behaviours — rounding would accept "2.5" and then
     silently disagree with the reader about what they asked for. */
  it('cannot hold a fraction', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithCrystal(
      <QuantityStepper label="Quantity" defaultValue={1} onChange={onChange} minValue={1} maxValue={99} />,
    );
    const field = screen.getByRole('textbox', { name: 'Quantity' }) as HTMLInputElement;
    await user.clear(field);
    await user.type(field, '2.5');
    await user.tab();
    expect(field.value).not.toMatch(/[.,]/);
    const last = onChange.mock.lastCall?.[0] as number;
    expect(Number.isInteger(last)).toBe(true);
  });

  /* The label is the accessible name whether or not it is drawn: a cart row
     shows the product name beside the stepper, and a second "Quantity" on
     every line is noise. */
  it('keeps its name when the label is not shown', () => {
    renderWithCrystal(<QuantityStepper label="Quantity" showLabel={false} defaultValue={1} />);
    expect(screen.getByRole('textbox', { name: 'Quantity' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(<Harness />);
    await expectNoAxeViolations(container);
  });
});
