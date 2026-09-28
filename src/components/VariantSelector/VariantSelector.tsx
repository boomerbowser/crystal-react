'use client';

/* VariantSelector — choosing among product variants, including the ones you
 * cannot have.
 *
 * "**Unavailable options stay perceivable and say why**; selection is label
 * weight, never a check mark."
 *
 * **Why an unavailable variant is still drawn.** Removing it is the obvious
 * thing and it is wrong: a shopper who cannot find the large sees a product that
 * does not come in large, and goes somewhere else. A shopper who sees "Large —
 * out of stock" knows the product is right and the timing is not. The
 * information is the same either way; only one of them tells the reader
 * anything. So the option stays, it says why in its own text rather than in a
 * tooltip nobody hovers, and it is not chooseable.
 *
 * **Two shapes, and they carry selection differently.** A pill has a label, so
 * selection is the label's weight — Crystal's rule, and the catalogue's. A
 * swatch does not: it is a circle of colour, and weighting a colour means
 * nothing. So a selected swatch takes the one thing a labelless option has,
 * which is its pad: the colour shrinks inside a tinted surround. That is the
 * same answer the gallery thumbnail reached, and the same thing it is not — it
 * is never an outline, because an outline at an offset is how Crystal draws
 * focus, and an option wearing one goes on looking focused after focus has left.
 *
 * The colour is never the only signal either way. Every swatch carries its
 * variant's name, which is what a screen reader reads and what anybody who
 * cannot separate two similar colours has instead.
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
   * A colour, for the swatch shape. Any CSS colour — this is product data, not
   * a design token, which is why a literal belongs here and nowhere else.
   */
  swatch?: string;
  /** Not available, and why. Shown beside the label and said with it. */
  unavailable?: string;
}

export interface VariantSelectorProps
  extends Omit<RadioGroupProps, 'children' | 'label'> {
  /** What is being chosen — "Size", "Colour". The group's name. */
  label: ReactNode;
  variants: readonly Variant[];
  /** Circles rather than pills. For colour and finish. */
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
          /* The swatch's name, because its own content is a colour and a colour
             has no text. The pill needs none: its content is its name. */
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
