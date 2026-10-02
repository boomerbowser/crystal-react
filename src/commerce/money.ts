/* Money, and the one thing every price in the slice has to agree about.
 *
 * Nine components in the commerce slice render an amount (a price, a range, a
 * reduction, a line of a basket, a total, a shipping option) and each of them
 * would otherwise decide separately how a number becomes a currency. That is
 * exactly the divergence the catalogue is complaining about when it says Crystal
 * "left every store to reinvent … currency formatting".
 *
 * An amount is never a number on its own. `29.99` is not a price. It is a
 * price in some currency somebody has to remember. So the unit of exchange in
 * this slice is `Money`, and a component takes one rather than an amount and a
 * currency as two props that can be passed in the wrong order or one without the
 * other.
 *
 * The formatting is `Intl`'s, not ours. The platform's own currency data
 * answers where the decimal separator goes, whether the symbol leads or
 * trails, how many fraction digits a currency has, and whether `USD` renders
 * as `$` or `US$` in this locale. Every one of those is a bug waiting in a
 * hand-written formatter. The components reach it through
 * `NumberFormatter`, which takes the locale from `CrystalProvider` rather than
 * from the call site.
 */
import type { NumberFormatOptions } from '@internationalized/number';

/**
 * How `Intl` renders the currency. Named here because three components take it
 * and a union repeated three times is three places to forget an option.
 */
export type CurrencyDisplay = 'symbol' | 'narrowSymbol' | 'code' | 'name';

/** An amount with the currency it is denominated in. */
export interface Money {
  /** The amount, in major units. `29.99`, not `2999`. */
  amount: number;
  /** An ISO 4217 code: `GBP`, `USD`, `JPY`. */
  currency: string;
}

/**
 * How `Intl` should be asked to render this amount.
 *
 * `currencyDisplay` is passed through rather than fixed, because the catalogue
 * asks that "currency is stated, not implied by a symbol alone" and meeting
 * that fully means letting a product say it in full (`name` gives "40.00
 * British pounds") rather than rendering one thing and announcing another. A
 * visible form and a spoken form that disagree are two facts that drift, and the
 * one a screen reader reads is the one nobody checks.
 */
export function moneyFormat(
  money: Money,
  currencyDisplay?: CurrencyDisplay,
): NumberFormatOptions {
  return {
    style: 'currency',
    currency: money.currency,
    ...(currencyDisplay === undefined ? {} : { currencyDisplay }),
  };
}

/** Whether two amounts can be compared or summed at all. */
export function sameCurrency(one: Money, other: Money): boolean {
  return one.currency === other.currency;
}

/**
 * The reduction from one amount to another, as a whole percentage.
 *
 * Rounded rather than truncated, and clamped at zero: a "reduction" that is an
 * increase is a caller's mistake, and rendering `-12% off` would present it as a
 * discount. Returns `null` when the two amounts are in different currencies,
 * because the ratio of a euro to a yen is not a discount.
 */
export function percentOff(from: Money, to: Money): number | null {
  if (!sameCurrency(from, to)) return null;
  if (from.amount <= 0) return null;
  return Math.max(0, Math.round(((from.amount - to.amount) / from.amount) * 100));
}
