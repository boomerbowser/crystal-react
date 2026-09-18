'use client';

/* NumberFormatter.
 *
 * Renders a number under a locale and a unit. React Aria's `useNumberFormatter`
 * is the mechanism, and the reason to take it rather than call `Intl` directly is
 * that it reads the locale from the surrounding `I18nProvider` — which
 * `CrystalProvider` sets — so a number inside a right-to-left or German scope
 * formats correctly without the call site knowing where it is.
 *
 * The catalogue's requirement is the one that decides the markup: **the formatted
 * value is the text content; no separate visual and spoken form.** A number
 * rendered as "1.2M" visually and 1204893 in an `aria-label` is two facts that
 * drift, and the one a screen reader reads is the one nobody checks. So there is
 * one string, and if it is abbreviated it is abbreviated for everybody.
 *
 * Figures are tabular when the number sits in a column and proportional when it
 * sits in a sentence, which is the product's call and not something a formatter
 * can infer.
 */
import { useNumberFormatter } from 'react-aria';
import type { NumberFormatOptions } from '@internationalized/number';
import { Text, type TextProps } from '../Text/Text.js';

export interface NumberFormatterProps extends Omit<TextProps, 'children'> {
  value: number;
  /**
   * `Intl.NumberFormat` options: style `currency`, `percent` or `unit`, the
   * currency code, precision. Passed through, because re-describing them would be
   * a second, worse API for a standard one.
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
