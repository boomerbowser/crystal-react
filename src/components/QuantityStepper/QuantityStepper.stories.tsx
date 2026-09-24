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
          'Not `NumberInput` with a different stylesheet — the two disagree about one number, '
          + 'and the number is the point. `NumberInput` keeps each chevron short so the pair '
          + 'reaches the field height together, which is right for a form where the arrow keys '
          + 'are the primary route. The catalogue says of this one: "Pill; **both controls '
          + 'reach 44px**." A stepper beside a price is pressed with a thumb, on a phone, next ' /* crystal-allow-literal: quoting the catalogue's own sentence, which is the point of the line */
          + 'to a Remove control it must not be mistaken for.\n\n'
          + 'React Aria strips the `spinbutton` role and all three value attributes — "we '
          + 'can\'t focus a spin button with VO" — which takes the bounds off the control '
          + 'entirely. The live region here is not a nicety over the top of the primitive; it '
          + 'is the only thing that conveys them. See R-22.',
      },
    },
  },
  args: { label: 'Quantity', defaultValue: 1, minValue: 1, maxValue: 10 },
} satisfies Meta<typeof QuantityStepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** At a bound the control is disabled *and* the bound is said. Shown alone is a
 *  control that looks broken to anyone who can see it and silent to anyone who
 *  cannot — step to three and listen. */
export const AtItsBounds: Story = {
  args: { label: 'Quantity', defaultValue: 1, minValue: 1, maxValue: 3 },
};

/** In a cart row, where the product name beside it is what the quantity is *of*
 *  and a second "Quantity" on every line is noise. The label is still there and
 *  still the control's accessible name. */
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
