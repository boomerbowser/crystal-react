import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { QuantityStepper } from './QuantityStepper.js';

const meta = {
  title: 'Commerce/Quantity stepper',
  component: QuantityStepper,
  parameters: {
    docs: {
      description: {
        component:
          'Differs from `NumberInput` in one number. `NumberInput` keeps each chevron short '
          + 'so the pair reaches the field height together, which suits a form where the arrow '
          + 'keys are the primary route. The catalogue says of this one: "Pill; both controls '
          + 'reach 44px." A stepper beside a price is pressed with a thumb, on a phone, next ' /* crystal-allow-literal: quoting the catalogue's own sentence */
          + 'to a Remove control it must not be mistaken for.\n\n'
          + 'React Aria strips the `spinbutton` role and all three value attributes ("we '
          + 'can\'t focus a spin button with VO"), which takes the bounds off the control. '
          + 'The live region here is the only thing that conveys them. See R-22.',
      },
    },
  },
  args: { label: 'Quantity', defaultValue: 1, minValue: 1, maxValue: 10 },
} satisfies Meta<typeof QuantityStepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** At a bound the control is disabled and the bound is said. Disabled alone, it
 *  looks broken to anyone who can see it and is silent to anyone who cannot.
 *  Step to three and listen. */
export const AtItsBounds: Story = {
  args: { label: 'Quantity', defaultValue: 1, minValue: 1, maxValue: 3 },
};

/** In a cart row, where the product name beside it says what the quantity is
 *  of, so the label is hidden. It is still the control's accessible name. */
export const InACartRow: Story = {
  render: (args) => {
    function Row() {
      const [count, setCount] = useState(2);
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ flex: 1 }}>Harbour print, A2</span>
          <QuantityStepper {...only(args)} value={count} onChange={setCount} showLabel={false} />
        </div>
      );
    }
    return <Row />;
  },
};
