/* PriceRange — a from-to price, or a from price.
 *
 * "**Reads as a sentence** rather than two numbers with a dash."
 *
 * A dash between two prices is a glyph that means nothing out loud. A screen
 * reader says "forty dash sixty" or, depending on the dash, nothing at all, and
 * a reader who cannot see the layout has to guess whether the second number is
 * an upper bound, an instalment or a saving. So the two amounts are joined by
 * words, and the words are a prop, because the sentence is different in every
 * language and this component has no business assuming English word order.
 *
 * **One amount is not a range.** With only a `from`, the sentence is "From £40"
 * rather than "£40 – £40": a range whose ends are equal is a price, and saying
 * it twice tells a reader there is a spread when there is not. The same is true
 * when both ends *are* equal, which is why that case collapses too.
 *
 * Two currencies are not a range either. `null` from `percentOff`'s sibling
 * check is the same reasoning: the interval from a euro to a yen is not an
 * interval, so the component renders the `from` end alone rather than a sentence
 * that reads as though it were.
 */
import { Text, type TextProps } from '../Text/Text.js';
import { Price } from '../Price/Price.js';
import { sameCurrency, type CurrencyDisplay, type Money } from '../../commerce/money.js';

export interface PriceRangeProps extends Omit<TextProps, 'children'> {
  /** The lower bound, and the whole price when there is no upper one. */
  from: Money;
  /** The upper bound. Left out when the range is open or there is one price. */
  to?: Money;
  /**
   * The sentence, given both formatted ends. Default English; a product with
   * another language passes its own rather than having one imposed.
   */
  sentence?: (from: React.ReactNode, to: React.ReactNode) => React.ReactNode;
  /** The sentence for a single price. */
  fromSentence?: (from: React.ReactNode) => React.ReactNode;
  currencyDisplay?: CurrencyDisplay;
}

export function PriceRange({
  from, to, sentence, fromSentence, currencyDisplay, ...props
}: PriceRangeProps): React.JSX.Element {
  const display = currencyDisplay === undefined ? {} : { currencyDisplay };
  const low = <Price value={from} as="span" tabular={false} {...display} />;

  /* A range needs two different ends in one currency to be a range at all. */
  const spread = to !== undefined && sameCurrency(from, to) && to.amount !== from.amount
    ? <Price value={to} as="span" tabular={false} {...display} />
    : null;

  return (
    <Text {...props}>
      {spread === null
        ? (fromSentence ?? ((one) => <>From {one}</>))(low)
        : (sentence ?? ((one, other) => <>From {one} to {other}</>))(low, spread)}
    </Text>
  );
}
