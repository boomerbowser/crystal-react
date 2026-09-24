/* Price — an amount of money, formatted by the platform.
 *
 * "The formatted value **is** the text content; currency is stated, not implied
 * by a symbol alone."
 *
 * Both halves of that decide the API. The value is a `Money`, so the currency
 * arrives as data and the component formats it — a caller cannot hand this a
 * string with a symbol already glued to the front, which is the thing that makes
 * a price untranslatable and unreadable to anything but a pair of eyes. And
 * there is one string: no visible form with a different spoken form beside it.
 * Where a product needs the currency spelled out because `$` is ambiguous,
 * `currencyDisplay="name"` spells it out **for everybody**.
 *
 * Figures are tabular, which is `NumberFormatter`'s default and is the
 * catalogue's geometry: "tabular figures so a column of prices aligns". A price
 * inside a sentence can turn them off.
 */
import { NumberFormatter, type NumberFormatterProps } from '../NumberFormatter/NumberFormatter.js';
import { moneyFormat, type CurrencyDisplay, type Money } from '../../commerce/money.js';

export interface PriceProps extends Omit<NumberFormatterProps, 'value' | 'format'> {
  /** The amount and its currency. */
  value: Money;
  /**
   * How `Intl` renders the currency. Crystal's default is the platform's, which
   * is locale-aware: `USD` is `$` to a reader in the United States and `US$` to
   * one in Britain.
   */
  currencyDisplay?: CurrencyDisplay;
}

export function Price({ value, currencyDisplay, ...props }: PriceProps): React.JSX.Element {
  return (
    <NumberFormatter
      {...props}
      value={value.amount}
      format={moneyFormat(value, currencyDisplay)}
    />
  );
}
