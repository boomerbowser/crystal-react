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
          '"A radio group. **Card fields are never reimplemented — the host supplies its '
          + 'provider element.**" That second sentence is a boundary, not a preference, and it '
          + 'is why this component is in the catalogue at all. A card number, an expiry and a '
          + 'CVC typed into inputs this library rendered would put every product using Crystal '
          + 'inside PCI scope, because the data touched their page in the clear.\n\n'
          + 'It is worth stating the failure mode plainly, because it does not look like one: '
          + 'a card form built here would work, would look right, would pass every test in the '
          + 'repository, and would quietly move a compliance obligation onto every product '
          + 'that adopted it. So there is a `provider` slot and there are no card fields.',
      },
    },
  },
  args: { methods, defaultValue: 'visa' },
} satisfies Meta<typeof PaymentMethod>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** With a provider's element in its slot — a grey box standing in for Stripe's
 *  `PaymentElement` or Adyen's drop-in. Choose "A different card" to mount it:
 *  it is mounted only while it is chosen, because a provider's element is an
 *  iframe talking to a payment processor, and four of them behind unchosen
 *  options is four sessions opened for nothing. */
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
