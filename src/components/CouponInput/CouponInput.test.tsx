import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { CouponInput } from './CouponInput.js';

function Harness({ onApply = vi.fn() }: { onApply?: (code: string) => void }) {
  const [value, setValue] = useState('');
  return <CouponInput value={value} onValueChange={setValue} onApply={onApply} />;
}

describe('CouponInput', () => {
  /* Enter in the field applies the code, because Enter is the key every reader
     tries first. */
  it('applies from the keyboard as well as from the control', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    renderWithCrystal(<Harness onApply={onApply} />);
    await user.type(screen.getByRole('textbox', { name: 'Discount code' }), 'HARBOUR10{Enter}');
    expect(onApply).toHaveBeenCalledWith('HARBOUR10');
  });

  /* An empty apply is a press that cannot succeed, so it is not offered. */
  it('does not offer to apply nothing', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    renderWithCrystal(<Harness onApply={onApply} />);
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
    await user.type(screen.getByRole('textbox', { name: 'Discount code' }), '   {Enter}');
    expect(onApply).not.toHaveBeenCalled();
  });

  /* "Success and failure are announced." The reader must act on a refused code
     before they can finish, which is the narrow case where interrupting is
     right. So failure is an alert and success is a status. */
  it('announces a refusal assertively', () => {
    renderWithCrystal(
      <CouponInput value="NOPE" onValueChange={() => {}} onApply={() => {}} error="That code has expired" />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('That code has expired');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('announces a success politely', () => {
    renderWithCrystal(
      <CouponInput value="" onValueChange={() => {}} onApply={() => {}} applied="HARBOUR10" />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('HARBOUR10 applied');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  /* "An applied code is removable", through a control with a name. */
  it('offers a named control to remove an applied code', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    renderWithCrystal(
      <CouponInput
        value=""
        onValueChange={() => {}}
        onApply={() => {}}
        applied="HARBOUR10"
        onRemove={onRemove}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Remove HARBOUR10' }));
    expect(onRemove).toHaveBeenCalled();
  });

  /* A control that vanishes under the cursor mid-press has to be found again,
     so applying disables the action and does not replace it with a spinner. */
  it('keeps the action in place while a code is on its way', () => {
    renderWithCrystal(
      <CouponInput value="HARBOUR10" onValueChange={() => {}} onApply={() => {}} isApplying />,
    );
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(<Harness />);
    await expectNoAxeViolations(container);
  });
});

describe('CouponInput, after removing a code', () => {
  /* "The field is what is there once the code is gone." The applied state and
     the form are two different trees, so the input the ref points at does not
     exist when Remove is pressed. Focusing it then focuses nothing. */
  it('puts focus in the field it just brought back', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [applied, setApplied] = useState<string | undefined>('HARBOUR10');
      return (
        <CouponInput
          value=""
          onValueChange={() => {}}
          onApply={() => {}}
          {...(applied === undefined ? {} : { applied })}
          onRemove={() => setApplied(undefined)}
        />
      );
    }
    renderWithCrystal(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Remove HARBOUR10' }));
    expect(screen.getByRole('textbox', { name: 'Discount code' })).toHaveFocus();
  });
});
