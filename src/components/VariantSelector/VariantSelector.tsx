'use client';

/* VariantSelector chooses among product variants, including the ones you
 * cannot have.
 *
 * "**Unavailable options stay perceivable and say why**; selection is label
 * weight, never a check mark."
 *
 * An unavailable variant is still drawn. A shopper who cannot find the large
 * assumes the product does not come in large, and goes somewhere else. A shopper
 * who sees "Large — out of stock" knows the product is right and the timing is
 * not. The option stays, says why in its own text instead of a tooltip, and
 * cannot be chosen.
 *
 * The two shapes carry selection differently. A pill has a label, so selection
 * is the label's weight, by Crystal's rule and the catalogue's. A swatch is a
 * circle of colour with no label to weight, so a selected swatch uses its pad:
 * the colour shrinks inside a tinted surround. The gallery thumbnail does the
 * same. It is never an outline, because an outline at an offset is how Crystal
 * draws focus, and an option with one keeps looking focused after focus has
 * left.
 *
 * The colour is never the only signal. Every swatch carries its variant's name,
 * which a screen reader reads and which anybody who cannot separate two similar
 * colours relies on.
 */
import { type ReactNode } from 'react';
import { RadioGroup, type RadioGroupProps } from '../Checkbox/Checkbox.js';
import { SelectedRadio } from '../Checkbox/SelectedRadio.js';
import { cx } from '../../styles/cx.js';
import styles from './VariantSelector.module.scss';

export interface Variant {
  value: string;
  /** What the variant is called. The option's name, always. */
  label: string;
  /**
   * A colour, for the swatch shape. Any CSS colour. This is product data, not a
   * design token, so a literal belongs here and nowhere else.
   */
  swatch?: string;
  /** Not available, and why. Shown beside the label and said with it. */
  unavailable?: string;
}

export interface VariantSelectorProps
  extends Omit<RadioGroupProps, 'children' | 'label'> {
  /** What is being chosen, such as "Size" or "Colour". The group's name. */
  label: ReactNode;
  variants: readonly Variant[];
  /** Circles instead of pills. For colour and finish. */
  shape?: 'pill' | 'swatch';
}

export function VariantSelector({
  label, variants, shape = 'pill', className, ...props
}: VariantSelectorProps): React.JSX.Element {
  return (
    <RadioGroup
      {...props}
      label={label}
      orientation="horizontal"
      className={cx(styles['group'], className)}
    >
      {variants.map((variant) => (
        <SelectedRadio
          key={variant.value}
          value={variant.value}
          isDisabled={variant.unavailable !== undefined}
          className={cx(
            styles['variant'],
            shape === 'swatch' ? styles['swatch'] : styles['pill'],
          )}
          /* The swatch's name, because its own content is a colour with no text.
             The pill needs none, because its content is its name. */
          {...(shape === 'swatch'
            ? {
              'aria-label': variant.unavailable === undefined
                ? variant.label
                : `${variant.label}, ${variant.unavailable}`,
            }
            : {})}
        >
          {shape === 'swatch' ? (
            <span
              aria-hidden="true"
              className={styles['colour']}
              style={variant.swatch === undefined ? undefined : { background: variant.swatch }}
            />
          ) : (
            <>
              <span>{variant.label}</span>
              {variant.unavailable === undefined ? null : (
                <span className={styles['why']}>{variant.unavailable}</span>
              )}
            </>
          )}
        </SelectedRadio>
      ))}
    </RadioGroup>
  );
}
