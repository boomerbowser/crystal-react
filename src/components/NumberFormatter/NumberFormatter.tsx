'use client';

/* NumberFormatter.
 *
 * Renders a number under a locale and a unit, through React Aria's
 * `useNumberFormatter`. Unlike calling `Intl` directly, it reads the locale from
 * the surrounding `I18nProvider`, which `CrystalProvider` sets, so a number
 * inside a right-to-left or German scope formats correctly without the call site
 * knowing where it is.
 *
 * The catalogue's requirement decides the markup: "The formatted value is the
 * text content; no separate visual and spoken form." A number rendered as "1.2M"
 * visually and 1204893 in an `aria-label` is two facts that drift, and nobody
 * checks the one a screen reader reads. So there is one string, and if it is
 * abbreviated it is abbreviated for everybody.
 *
 * Figures are tabular when the number sits in a column and proportional when it
 * sits in a sentence. That is the product's call, and a formatter cannot infer
 * it.
 */
import { useNumberFormatter } from 'react-aria';
import type { NumberFormatOptions } from '@internationalized/number';
import { Text, type TextProps } from '../Text/Text.js';

export interface NumberFormatterProps extends Omit<TextProps, 'children'> {
  value: number;
  /**
   * `Intl.NumberFormat` options: style `currency`, `percent` or `unit`, the
   * currency code, precision. Passed through, because re-describing them would
   * add a second, worse API over a standard one.
   */
  format?: NumberFormatOptions;
}

export function NumberFormatter({
  value, format, as = 'span', tabular = true, ...props
}: NumberFormatterProps): React.JSX.Element {
  const formatter = useNumberFormatter(format);
  /* One string, used as both the visible text and the announced one. */
  return <Text {...props} as={as} tabular={tabular}>{formatter.format(value)}</Text>;
}
