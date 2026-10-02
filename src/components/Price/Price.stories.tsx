import type { Meta, StoryObj } from '@storybook/react-vite';
import { Price } from './Price.js';

const meta = {
  title: 'Commerce/Price',
  component: Price,
  parameters: {
    docs: {
      description: {
        component:
          '"The formatted value **is** the text content; currency is stated, not implied by a '
          + 'symbol alone." Both halves decide the API. The value is a `Money`, so the currency '
          + 'arrives as data and the component formats it. A caller cannot hand this a string '
          + 'with a symbol already glued to the front, which would make the price '
          + 'untranslatable and readable only by sight. There is one string, so no visible form '
          + 'has a different spoken form beside it. Where `$` is '
          + 'ambiguous, `currencyDisplay="name"` spells the currency out for everybody.',
      },
    },
  },
  args: { value: { amount: 39.99, currency: 'GBP' } },
} satisfies Meta<typeof Price>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The platform's currency data: the yen has no minor unit and the dinar has
 *  three. This library keeps no copy of either fact. */
export const ByCurrency: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 4, justifyItems: 'end', width: 'fit-content' }}>
      <Price value={{ amount: 39.99, currency: 'GBP' }} />
      <Price value={{ amount: 39.99, currency: 'EUR' }} />
      <Price value={{ amount: 4000, currency: 'JPY' }} />
      <Price value={{ amount: 39.995, currency: 'KWD' }} />
    </div>
  ),
};

/** Spelled out, for everybody. A product whose readers cannot tell which dollar
 *  is meant changes what is shown, so what is announced and what is displayed
 *  stay the same. */
export const CurrencyInWords: Story = {
  args: { value: { amount: 39.99, currency: 'USD' }, currencyDisplay: 'name' },
};

/** Tabular figures are the default, which is the catalogue's geometry: "tabular
 *  figures so a column of prices aligns". The left column is what a column of
 *  prices looks like without them. */
export const AColumnOfPrices: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 48 }}>
      <div style={{ display: 'grid', gap: 4, justifyItems: 'end' }}>
        {[1111.11, 8.99, 249.5, 1000].map((amount) => (
          <Price key={amount} value={{ amount, currency: 'GBP' }} tabular={false} />
        ))}
      </div>
      <div style={{ display: 'grid', gap: 4, justifyItems: 'end' }}>
        {[1111.11, 8.99, 249.5, 1000].map((amount) => (
          <Price key={amount} value={{ amount, currency: 'GBP' }} />
        ))}
      </div>
    </div>
  ),
};
