import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { AddressForm } from './AddressForm.js';
import { Button } from '../Button/Button.js';
import type { AddressDescriptor, AddressValue } from '../../commerce/address.js';

/* Three countries that genuinely disagree, which is the point. They live here
 * rather than in the library: the catalogue puts "countries supported and their
 * field rules" on the product, and a design system that ships a table of
 * countries has taken on a data set that is wrong the week it is written. These
 * are examples, and they are deliberately not exported. */
const countries: AddressDescriptor[] = [
  {
    country: 'GB',
    countryLabel: 'United Kingdom',
    fields: [
      { name: 'line1', label: 'Address', autoComplete: 'address-line1', required: true },
      { name: 'line2', label: 'Address line 2', autoComplete: 'address-line2' },
      { name: 'city', label: 'Town or city', autoComplete: 'address-level2', required: true },
      {
        name: 'postcode',
        label: 'Postcode',
        autoComplete: 'postal-code',
        required: true,
        description: 'For example, SW1A 1AA',
        validate: (one) => (/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(one.trim())
          ? undefined
          : 'That does not look like a UK postcode'),
      },
    ],
  },
  {
    country: 'US',
    countryLabel: 'United States',
    fields: [
      { name: 'line1', label: 'Street address', autoComplete: 'address-line1', required: true },
      { name: 'line2', label: 'Apartment, suite, unit', autoComplete: 'address-line2' },
      { name: 'city', label: 'City', autoComplete: 'address-level2', required: true },
      {
        name: 'state',
        label: 'State',
        autoComplete: 'address-level1',
        required: true,
        options: [
          { value: 'CA', label: 'California' },
          { value: 'NY', label: 'New York' },
          { value: 'TX', label: 'Texas' },
        ],
      },
      {
        name: 'zip',
        label: 'ZIP code',
        autoComplete: 'postal-code',
        required: true,
        validate: (one) => (/^\d{5}(-\d{4})?$/.test(one.trim()) ? undefined : 'A ZIP code is five digits'),
      },
    ],
  },
  {
    /* Japan writes its addresses largest-first, and the postcode leads. A single
     * hard-coded form has this one backwards for every reader in the country. */
    country: 'JP',
    countryLabel: '日本 (Japan)',
    fields: [
      {
        name: 'postcode',
        label: '郵便番号 (Postal code)',
        autoComplete: 'postal-code',
        required: true,
        validate: (one) => (/^\d{3}-?\d{4}$/.test(one.trim()) ? undefined : 'Seven digits, as 100-0001'),
      },
      { name: 'prefecture', label: '都道府県 (Prefecture)', autoComplete: 'address-level1', required: true },
      { name: 'city', label: '市区町村 (City)', autoComplete: 'address-level2', required: true },
      { name: 'line1', label: '番地 (Street address)', autoComplete: 'address-line1', required: true },
    ],
  },
];

const meta = {
  title: 'Commerce/Address form',
  component: AddressForm,
  parameters: {
    docs: {
      description: {
        component:
          '"**Field order, labels and required-ness change by country**; postcode validation is '
          + 'per-locale, not one regular expression." Change the country and watch the form '
          + 'rearrange: the United States writes a state between its city and its postcode, the '
          + 'United Kingdom writes neither, and Japan writes its addresses largest-first with '
          + 'the postcode leading. A single hard-coded form has that last one backwards for '
          + 'every reader in the country.\n\n'
          + 'The **descriptors are the product\'s**, and the ones in these stories are examples '
          + 'that are deliberately not exported. The catalogue puts "countries supported and '
          + 'their field rules" on the product, and rightly: a design system that ships a table '
          + 'of countries has taken on a data set that is wrong the week it is written and '
          + 'wrong differently every year after — and a wrong table is invisible, because the '
          + 'form renders and one country\'s addresses are quietly unusable.\n\n'
          + 'Every field carries an autofill token, selects included. Autofill that completes '
          + 'three of four fields and stops is worse than none, because the reader has to find '
          + 'the one it missed.',
      },
    },
  },
  args: { countries, country: 'GB', value: {}, onCountryChange: () => {}, onChange: () => {} },
} satisfies Meta<typeof AddressForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    function Live() {
      const [country, setCountry] = useState('GB');
      const [value, setValue] = useState<AddressValue>({});
      return (
        <div style={{ maxWidth: 'var(--cr-layout-sidebar-width)' }}>
          <AddressForm
            {...only(args)}
            country={country}
            onCountryChange={setCountry}
            value={value}
            onChange={setValue}
          >
            <Button type="submit" variant="primary">Save this address</Button>
          </AddressForm>
        </div>
      );
    }
    return <Live />;
  },
};

/** An error the product supplies — a server saying it does not deliver there,
 *  which the form could not have known. It goes on the field it is about: "there
 *  are errors" is a message about the form, and the reader needs to know which
 *  box. */
export const RefusedByTheServer: Story = {
  args: {
    countries,
    country: 'GB',
    value: { line1: '1 The Quay', city: 'Whitby', postcode: 'YO21 3PU' },
    onCountryChange: () => {},
    onChange: () => {},
    errors: { postcode: 'We do not deliver to that postcode yet' },
  },
};
