import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { CouponInput } from './CouponInput.js';

const meta = {
  title: 'Commerce/Coupon input',
  component: CouponInput,
  parameters: {
    docs: {
      description: {
        component:
          '"Field and action share one pill row", and "success and failure are **announced**; '
          + 'an applied code is **removable**." The answer is the whole component: a coupon '
          + 'field is one of the few places in a checkout where a reader has done something '
          + 'and genuinely cannot tell whether it worked — the total may or may not have moved, '
          + 'it may have moved for another reason, and the code may have been refused for a '
          + 'reason nobody printed.\n\n'
          + 'Failure is an `alert` and success is a `status`. A code that did not apply is '
          + 'something the reader must act on before they can continue, which is the narrow '
          + 'case where interrupting is correct; a code that did apply is a fact they can hear '
          + 'when they reach it. The same split the feedback slice made between `Alert` and '
          + '`Banner`.',
      },
    },
  },
  args: { value: '', onValueChange: () => {}, onApply: () => {} },
} satisfies Meta<typeof CouponInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Type a code and press Enter — the field applies from the keyboard, because a
 *  field beside a button that only answers to the button swallows the key every
 *  reader will try first. `HARBOUR10` is accepted; anything else is refused. */
export const Default: Story = {
  render: (args) => {
    function Live() {
      const [value, setValue] = useState('');
      const [applied, setApplied] = useState<string | undefined>(undefined);
      const [error, setError] = useState<string | undefined>(undefined);
      return (
        <CouponInput
          {...only(args)}
          value={value}
          onValueChange={(next) => { setValue(next); setError(undefined); }}
          onApply={(code) => {
            if (code.toUpperCase() === 'HARBOUR10') { setApplied(code.toUpperCase()); setError(undefined); }
            else setError(`${code} is not a code we recognise`);
          }}
          {...(applied === undefined ? {} : { applied })}
          {...(error === undefined ? {} : { error })}
          onRemove={() => { setApplied(undefined); setValue(''); }}
        />
      );
    }
    return <Live />;
  },
};

/** A refused code. Assertive, because it is the thing standing between the
 *  reader and finishing. */
export const Refused: Story = {
  args: { value: 'EXPIRED', onValueChange: () => {}, onApply: () => {}, error: 'That code has expired' },
};

/** Applied. There is nothing left to type, so the field gives way to a statement
 *  and a named control to undo it. */
export const Applied: Story = {
  args: { value: '', onValueChange: () => {}, onApply: () => {}, applied: 'HARBOUR10', onRemove: () => {} },
};

/** On its way. The action is disabled rather than replaced by a spinner: a
 *  control that vanishes under the cursor mid-press is one the reader has to
 *  find again. */
export const OnItsWay: Story = {
  args: { value: 'HARBOUR10', onValueChange: () => {}, onApply: () => {}, isApplying: true },
};
