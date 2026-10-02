import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { PaymentMethod } from './PaymentMethod.js';

const methods = [
  { value: 'visa', label: 'Visa ending 4242', detail: 'Expires 04/29' },
  { value: 'amex', label: 'Amex ending 1005', unavailable: 'Not accepted for this order' },
];

const meta = {
  title: 'Commerce/Payment method',
  component: PaymentMethod,
  parameters: {
    docs: {
      description: {
        component:
          '"A radio group. Card fields are never reimplemented: the host supplies its '
          + 'provider element." The second sentence is why this component is in the '
          + 'catalogue. A card number, an expiry and a CVC typed into inputs this library '
          + 'rendered would put every product using Crystal inside PCI scope, because the data '
          + 'touched their page in the clear.\n\n'
          + 'A card form built here would work, look right and pass every test in the '
          + 'repository, and it would move a compliance obligation onto every product that '
          + 'adopted it. So there is a `provider` slot and there are no card fields.',
      },
    },
  },
  args: { methods, defaultValue: 'visa' },
} satisfies Meta<typeof PaymentMethod>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** With a provider's element in its slot. A grey box stands in for Stripe's
 *  `PaymentElement` or Adyen's drop-in. Choose "A different card" to mount it.
 *  It is mounted only while it is chosen, because a provider's element is an
 *  iframe talking to a payment processor, and four of them behind unchosen
 *  options would open four sessions for nothing. */
export const WithAProviderElement: Story = {
  render: (args) => {
    function Live() {
      const [value, setValue] = useState('visa');
      return (
        <PaymentMethod
          {...only(args)}
          value={value}
          onChange={setValue}
          provider={
            <div
              style={{
                border: '1px dashed var(--cr-outline)', /* crystal-allow-literal: a stand-in for a third party's iframe, not a Crystal surface */
                borderRadius: 'var(--cr-radius)',
                padding: 'var(--cr-space)',
                color: 'var(--cr-muted)',
              }}
            >
              The payment provider&rsquo;s own element goes here.
            </div>
          }
        />
      );
    }
    return <Live />;
  },
};
