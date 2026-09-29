'use client';

/* ProductDetailBlock — gallery, variants, price, stock and the purchase action.
 *
 * "**Variant changes update price and stock together, and say so.**" States:
 * `at-rest`, `unavailable`, `adding`.
 *
 * The opinion is in the shape of a variant. Here a variant *carries* its price
 * and its availability, so choosing one changes both in the same render — there
 * is no moment where the colour is new and the price is the old colour's, which
 * is what happens when a product wires price and stock to a selection
 * separately and one of them lags. And the change is said, once, as one
 * sentence — "Slate: £24.00, low stock" — because a reader who cannot see the
 * figure beside the swatch has otherwise chosen a colour and learned nothing
 * about what it costs or whether it can be had. Not on load: the first variant
 * was not chosen, it was shown.
 *
 * **Unavailable is derived, not declared.** A variant that is out of stock makes
 * the purchase control say so and refuse, from the variant's own availability,
 * so the button cannot offer what the stock label says is gone.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNumberFormatter } from 'react-aria';
import { ProductGallery, type ProductMedia } from '../ProductGallery/ProductGallery.js';
import { VariantSelector, type Variant } from '../VariantSelector/VariantSelector.js';
import { Price } from '../Price/Price.js';
import { StockIndicator } from '../StockIndicator/StockIndicator.js';
import { Button } from '../Button/Button.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import { moneyFormat, type Money } from '../../commerce/money.js';
import { AVAILABILITY_LABEL, type Availability } from '../../commerce/availability.js';
import { cx } from '../../styles/cx.js';
import styles from './ProductDetailBlock.module.scss';

export interface ProductVariant extends Variant {
  price: Money;
  availability: Availability;
}

export interface ProductDetailBlockProps {
  name: ReactNode;
  /** The name as text, for the gallery's label. */
  nameText: string;
  headingLevel?: 1 | 2 | 3;
  description?: ReactNode;
  media: readonly ProductMedia[];
  variantLabel: ReactNode;
  variants: readonly ProductVariant[];
  variantShape?: 'pill' | 'swatch';
  value?: string;
  defaultValue?: string;
  onVariantChange?: (value: string) => void;
  onAddToCart: (variant: string) => void;
  /** The chosen variant is being added. The control waits and it is said. */
  isAdding?: boolean;
  addLabel?: string;
  /** What the control says when the variant cannot be bought. */
  unavailableLabel?: string;
  /** What is said when the variant changes. */
  announceVariant?: (label: string, price: string, availability: string) => string;
  /** Anything more under the purchase action — delivery, returns, reviews. */
  children?: ReactNode;
  className?: string;
}

export function ProductDetailBlock({
  name, nameText, headingLevel = 1, description, media, variantLabel, variants, variantShape = 'pill',
  value, defaultValue, onVariantChange, onAddToCart, isAdding = false,
  addLabel = 'Add to basket', unavailableLabel = 'Out of stock',
  announceVariant = (label, price, availability) => `${label}: ${price}, ${availability.toLowerCase()}`,
  children, className,
}: ProductDetailBlockProps): React.JSX.Element {
  const Heading = `h${headingLevel}` as 'h1';
  const [own, setOwn] = useState(defaultValue ?? variants[0]?.value ?? '');
  const chosenValue = value ?? own;
  const chosen = variants.find((variant) => variant.value === chosenValue) ?? variants[0];
  const choose = (next: string): void => {
    if (value === undefined) setOwn(next);
    onVariantChange?.(next);
  };

  const money = useNumberFormatter(moneyFormat(chosen?.price ?? { amount: 0, currency: 'GBP' }));
  const said = useVariantAnnouncement(chosen, (variant) => announceVariant(
    variant.label, money.format(variant.price.amount), AVAILABILITY_LABEL[variant.availability],
  ));
  const unavailable = chosen?.availability === 'out-of-stock';
  const state = unavailable ? 'unavailable' : isAdding ? 'adding' : 'at-rest';

  return (
    <article className={cx(styles['product'], className)} data-cr-state={state}>
      <div className={cx(styles['layout'])}>
        <ProductGallery media={media} label={nameText} className={cx(styles['gallery'])} />
        <div className={cx(styles['details'])}>
          <Heading className={cx(styles['name'])}>{name}</Heading>
          {chosen ? (
            <p className={cx(styles['price'])}><Price value={chosen.price} step="subheading" weight="strong" /></p>
          ) : null}
          {chosen ? <StockIndicator availability={chosen.availability} /> : null}
          {description ? <div className={cx(styles['description'])}>{description}</div> : null}
          <VariantSelector
            label={variantLabel}
            variants={variants}
            shape={variantShape}
            value={chosenValue}
            onChange={choose}
          />
          <Button
            variant="primary"
            isDisabled={unavailable || isAdding}
            onPress={() => { if (chosen) onAddToCart(chosen.value); }}
            className={cx(styles['add'])}
          >
            {unavailable ? unavailableLabel : addLabel}
          </Button>
          {children}
        </div>
      </div>
      {/* One sentence per change of variant, and the adding state, from a region
          present from the first frame. */}
      <VisuallyHidden role="status">{isAdding ? 'Adding to your basket' : said}</VisuallyHidden>
    </article>
  );
}

/* The chosen variant, said once when it changes — never for the one shown on load. */
function useVariantAnnouncement(
  chosen: ProductVariant | undefined,
  say: (variant: ProductVariant) => string,
): string {
  const [said, setSaid] = useState('');
  const last = useRef<string | null>(null);
  const sayRef = useRef(say);
  sayRef.current = say;
  useEffect(() => {
    if (!chosen) return;
    if (last.current !== null && last.current !== chosen.value) setSaid(sayRef.current(chosen));
    last.current = chosen.value;
  }, [chosen]);
  return said;
}
