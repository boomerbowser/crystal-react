import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { CheckoutBlock, type CheckoutStep } from './CheckoutBlock.js';
import type { AddressDescriptor, AddressValue } from '../../commerce/address.js';

const gbp = (amount: number) => ({ amount, currency: 'GBP' });
const countries: AddressDescriptor[] = [{
  country: 'GB',
  countryLabel: 'United Kingdom',
  fields: [
    { name: 'line1', label: 'Address', autoComplete: 'address-line1', required: true },
    { name: 'city', label: 'Town or city', autoComplete: 'address-level2', required: true },
    { name: 'postcode', label: 'Postcode', autoComplete: 'postal-code', required: true },
  ],
}];
const shipping = {
  options: [
    { value: 'standard', label: 'Standard', price: gbp(3.5), estimate: '3 to 5 working days' },
    { value: 'next', label: 'Next day', price: gbp(7), estimate: 'Tomorrow' },
  ],
  defaultValue: 'standard',
};
const payment = {
  methods: [{ value: 'visa', label: 'Visa ending 4242', detail: 'Expires 08/28' }],
  defaultValue: 'visa',
  provider: <p style={{ margin: 0 }}>The payment provider’s own card element renders here.</p>,
};
const summary = {
  lines: [
    { id: 'subtotal', label: 'Subtotal', amount: gbp(32) },
    { id: 'delivery', label: 'Delivery', amount: gbp(3.5), note: 'Standard' },
  ],
  total: gbp(35.5),
};

const meta = {
  title: 'Blocks/CheckoutBlock',
  component: CheckoutBlock,
  parameters: {
    docs: {
      description: {
        component:
          '"Each step is a labelled region; errors summarise and link; raw card data never touches '
          + 'this component."\n\nOne step at a time, as a region named for itself, with the order '
          + 'summary beside it. Errors are summarised at the top of the step and each links to its '
          + 'field. The payment step is `PaymentMethod`, whose only way to take a new card is the '
          + 'provider’s own element. There is no card field in this block, and no prop that would '
          + 'hold one.',
      },
    },
  },
  args: {
    step: 'address',
    onStepChange: fn(),
    onContinue: fn(),
    onPlaceOrder: fn(),
    address: { countries, country: 'GB', onCountryChange: fn(), value: {}, onChange: fn() },
    shipping,
    payment,
    summary,
  },
} satisfies Meta<typeof CheckoutBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Address: Story = {};
export const Delivery: Story = { args: { step: 'shipping' } };
export const Payment: Story = { args: { step: 'payment' } };
export const WithErrors: Story = {
  args: { errors: { line1: 'Enter the first line of the address', postcode: 'Enter a postcode' } },
};
export const Validating: Story = { args: { state: 'validating' } };
export const Submitting: Story = { args: { step: 'payment', state: 'submitting' } };
export const Failed: Story = {
  args: { step: 'payment', state: 'error', errorMessage: 'Your bank declined the payment. Nothing has been charged.' },
};

/** A working checkout: an empty postcode is refused, then the steps move on. */
export const AWorkingCheckout: Story = {
  render: function WorkingCheckout(args) {
    const [step, setStep] = useState<CheckoutStep>('address');
    const [value, setValue] = useState<AddressValue>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    return (
      <CheckoutBlock
        {...args}
        step={step}
        onStepChange={(next) => { setErrors({}); setStep(next); }}
        address={{ countries, country: 'GB', onCountryChange: () => {}, value, onChange: setValue }}
        errors={errors}
        onContinue={(current) => {
          if (current === 'address') {
            const missing: Record<string, string> = {};
            if (!value['line1']) missing['line1'] = 'Enter the first line of the address';
            if (!value['postcode']) missing['postcode'] = 'Enter a postcode';
            setErrors(missing);
            if (Object.keys(missing).length > 0) return;
          }
          setStep(current === 'address' ? 'shipping' : 'payment');
        }}
      />
    );
  },
};
