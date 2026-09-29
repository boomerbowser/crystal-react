'use client';

/* CartDrawer — the basket as a drawer: its lines, its totals, and checkout.
 *
 * "Opening moves focus in and returns it on close; **total changes are
 * announced**." States: `closed`, `open`, `updating`, `empty`.
 *
 * The first half is `Drawer`'s, which is a React Aria modal: focus moves into it
 * as it opens and goes back to whatever opened it as it closes, and it enters
 * and leaves with Crystal's `drawer-in` and `drawer-out`. Nothing here restates
 * that.
 *
 * **The opinion is the second half.** A basket's total changes as a quantity is
 * stepped or a line removed, and a reader who cannot see the figure change has
 * no way to know the basket now costs something else. `CartSummary` says
 * *that* it is updating; the drawer says *what it came to*, once, when the new
 * total has settled — not while it is still being recalculated, which would
 * announce a figure about to be wrong, and not on opening, which is not news.
 * The line that changed says its own quantity through `CartItem`.
 *
 * **Checkout waits for the figures.** While the basket is updating the checkout
 * control is disabled, because the total it would commit to is the one being
 * replaced. It stays in place and says so, rather than disappearing.
 *
 * **Empty is a state, not a blank panel.** A drawer with nothing in it says the
 * basket is empty and offers no checkout, because there is nothing to check out.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNumberFormatter } from 'react-aria';
import { Drawer } from '../Drawer/Drawer.js';
import { CartItem } from '../CartItem/CartItem.js';
import { CartSummary, type SummaryLine } from '../CartSummary/CartSummary.js';
import { Button } from '../Button/Button.js';
import { EmptyState } from '../EmptyState/EmptyState.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import { ListPresence } from '../../motion/ListPresence.js';
import { moneyFormat, type Money } from '../../commerce/money.js';
import { cx } from '../../styles/cx.js';
import styles from './CartDrawer.module.scss';

export interface CartDrawerLine {
  id: string;
  name: ReactNode;
  /** The name as text, for the line's announcements and its remove control. */
  nameText: string;
  media?: ReactNode;
  detail?: ReactNode;
  quantity: number;
  minQuantity?: number;
  maxQuantity?: number;
  unitPrice: Money;
  subtotal: Money;
}

export interface CartDrawerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  lines: readonly CartDrawerLine[];
  /** Subtotal, discounts, delivery, tax — `CartSummary`'s lines. */
  summary: readonly SummaryLine[];
  total: Money;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove?: (id: string) => void;
  onCheckout: () => void;
  /** Being recalculated after a change. The figures stay; checkout waits. */
  isUpdating?: boolean;
  title?: ReactNode;
  checkoutLabel?: string;
  emptyLabel?: ReactNode;
  /** What is said when the total settles. Plain words, with the figure. */
  announceTotal?: (total: string) => string;
  className?: string;
}

export function CartDrawer({
  isOpen, onOpenChange, lines, summary, total, onQuantityChange, onRemove, onCheckout,
  isUpdating = false, title = 'Your basket', checkoutLabel = 'Checkout',
  emptyLabel = 'Your basket is empty', announceTotal = (figure) => `Basket total now ${figure}`,
  className,
}: CartDrawerProps): React.JSX.Element {
  const money = useNumberFormatter(moneyFormat(total));
  const figure = money.format(total.amount);
  const said = useTotalAnnouncement(figure, isUpdating, isOpen);
  const empty = lines.length === 0;

  return (
    <Drawer
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={title}
      closes="the basket"
      placement="end"
      className={cx(styles['drawer'], className)}
    >
      <div className={cx(styles['body'])} data-cr-state={empty ? 'empty' : isUpdating ? 'updating' : 'open'}>
        {empty ? (
          <EmptyState state="empty" title={emptyLabel} />
        ) : (
          <>
            <ul className={cx(styles['lines'])} aria-label="Items">
              <ListPresence>
                {lines.map((line) => (
                  <li key={line.id} className={cx(styles['line'])}>
                    <CartItem
                      name={line.name}
                      nameText={line.nameText}
                      {...(line.media === undefined ? {} : { media: line.media })}
                      {...(line.detail === undefined ? {} : { detail: line.detail })}
                      quantity={line.quantity}
                      {...(line.minQuantity === undefined ? {} : { minQuantity: line.minQuantity })}
                      {...(line.maxQuantity === undefined ? {} : { maxQuantity: line.maxQuantity })}
                      unitPrice={line.unitPrice}
                      subtotal={line.subtotal}
                      onQuantityChange={(quantity) => { onQuantityChange(line.id, quantity); }}
                      {...(onRemove ? { onRemove: () => { onRemove(line.id); } } : {})}
                      isUpdating={isUpdating}
                    />
                  </li>
                ))}
              </ListPresence>
            </ul>
            <CartSummary lines={summary} total={total} isUpdating={isUpdating} label="Basket summary" />
            <Button
              variant="primary"
              isDisabled={isUpdating}
              onPress={onCheckout}
              className={cx(styles['checkout'])}
            >
              {checkoutLabel}
            </Button>
          </>
        )}
        {/* Polite, and rendered from the first frame, so the first change is a
            change rather than an insertion a screen reader may not announce. */}
        <VisuallyHidden role="status">{said === null ? '' : announceTotal(said)}</VisuallyHidden>
      </div>
    </Drawer>
  );
}

/* The settled total, once per change: `null` until the total differs from the
   one the drawer opened with, and never while it is still being recalculated. */
function useTotalAnnouncement(figure: string, isUpdating: boolean, isOpen: boolean): string | null {
  const [said, setSaid] = useState<string | null>(null);
  const last = useRef<string | null>(null);
  useEffect(() => {
    if (!isOpen) { last.current = null; setSaid(null); return; }
    if (isUpdating) return;
    if (last.current !== null && last.current !== figure) setSaid(figure);
    last.current = figure;
  }, [figure, isUpdating, isOpen]);
  return said;
}
