import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { AddressForm } from './AddressForm.js';
import type { AddressDescriptor, AddressValue } from '../../commerce/address.js';

/* Two countries that genuinely disagree about order, labels and required-ness —
   which is the point of the descriptor, and what a single hard-coded form gets
   wrong for everybody but one country. */
const countries: AddressDescriptor[] = [
  {
    country: 'GB',
    countryLabel: 'United Kingdom',
    fields: [
      { name: 'line1', label: 'Address', autoComplete: 'address-line1', required: true },
      { name: 'city', label: 'Town or city', autoComplete: 'address-level2', required: true },
      {
        name: 'postcode',
        label: 'Postcode',
        autoComplete: 'postal-code',
        required: true,
        validate: (one) => (/^[A-Z]{1,2}\d/i.test(one) ? undefined : 'That is not a UK postcode'),
      },
    ],
  },
  {
    country: 'US',
    countryLabel: 'United States',
    fields: [
      { name: 'line1', label: 'Street address', autoComplete: 'address-line1', required: true },
      { name: 'city', label: 'City', autoComplete: 'address-level2', required: true },
      {
        name: 'state',
        label: 'State',
        autoComplete: 'address-level1',
        required: true,
        options: [{ value: 'NY', label: 'New York' }, { value: 'CA', label: 'California' }],
      },
      { name: 'zip', label: 'ZIP code', autoComplete: 'postal-code', required: true },
    ],
  },
];

function Harness({ start = 'GB' }: { start?: string } = {}) {
  const [country, setCountry] = useState(start);
  const [value, setValue] = useState<AddressValue>({});
  return (
    <AddressForm
      countries={countries}
      country={country}
      onCountryChange={setCountry}
      value={value}
      onChange={setValue}
    />
  );
}

describe('AddressForm', () => {
  /* "Field order, labels and required-ness change by country." */
  it('renders the fields the chosen country actually has, in its order', async () => {
    const user = userEvent.setup();
    const { container } = renderWithCrystal(<Harness />);
    /* Document order, because the claim is about *order* and a set of fields
       says nothing about it — the United States writes a state between its city
       and its postcode, and the United Kingdom writes neither.
     *
       Read as autofill tokens rather than as labels, which is both the sturdier
       signal and the more meaningful one: the tokens are a fixed vocabulary, so
       this asserts what each position *is* rather than what this test's fixture
       happened to call it. */
    const written = () => [...container.querySelectorAll('[autocomplete]')]
      .map((one) => one.getAttribute('autocomplete'));

    expect(written()).toEqual(['country', 'address-line1', 'address-level2', 'postal-code']);

    await user.click(screen.getByRole('button', { name: /Country/ }));
    await user.click(screen.getByRole('option', { name: 'United States' }));

    expect(written()).toEqual([
      'country', 'address-line1', 'address-level2', 'address-level1', 'postal-code',
    ]);
  });

  /* An address form without autofill tokens is a form every reader types by
     hand every time, and it is the single largest thing a checkout can do for
     somebody using a screen reader, a switch, or one hand on a phone. */
  it('gives every field its autofill token, selects included', async () => {
    const user = userEvent.setup();
    const { container } = renderWithCrystal(<Harness />);
    for (const input of container.querySelectorAll('input')) {
      expect(input.getAttribute('autocomplete')).toBeTruthy();
    }

    /* Including the state select. Autofill that completes three of four fields
       and stops is worse than none, because the reader has to find the one it
       missed. */
    await user.click(screen.getByRole('button', { name: /Country/ }));
    await user.click(screen.getByRole('option', { name: 'United States' }));
    expect(container.querySelector('[autocomplete="address-level1"]')).not.toBeNull();
  });

  /* "Postcode validation is per-locale, not one regular expression" — and the
     message goes on the field it is about, because "there are errors" is a
     message about the form and the reader needs to know which box. */
  it('validates per-locale and puts the message on the field', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Harness />);
    const postcode = screen.getByLabelText(/Postcode/);
    await user.type(postcode, '12345');
    await user.tab();
    expect(screen.getByText('That is not a UK postcode')).toBeInTheDocument();
    expect(postcode).toHaveAttribute('aria-invalid', 'true');
  });

  /* Telling somebody their postcode is invalid while they are three characters
     into typing it is telling them off for not having finished. */
  it('says nothing while the reader is still typing', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Harness />);
    await user.type(screen.getByLabelText(/Postcode/), '12');
    expect(screen.queryByText('That is not a UK postcode')).toBeNull();
  });

  /* The product's error wins: it knows something this form does not. */
  it('shows an error the product supplies', () => {
    renderWithCrystal(
      <AddressForm
        countries={countries}
        country="GB"
        onCountryChange={() => {}}
        value={{ postcode: 'SW1A 1AA' }}
        onChange={() => {}}
        errors={{ postcode: 'We do not deliver to that postcode' }}
      />,
    );
    expect(screen.getByText('We do not deliver to that postcode')).toBeInTheDocument();
  });

  it('submits the address it holds', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithCrystal(
      <AddressForm
        countries={countries}
        country="GB"
        onCountryChange={() => {}}
        value={{ line1: '1 The Quay' }}
        onChange={() => {}}
        onSubmit={onSubmit}
      >
        <button type="submit">Save</button>
      </AddressForm>,
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledWith({ line1: '1 The Quay' });
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(<Harness />);
    await expectNoAxeViolations(container);
  });
});
