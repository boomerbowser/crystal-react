'use client';

/* Accordion — disclosure rows.
 *
 * React Aria owns the part that is easy to get subtly wrong: the header is a
 * real button carrying `aria-expanded` and `aria-controls`, the panel is
 * associated back to it, and a group knows whether one row or several may be open
 * at once. `DisclosureGroup` also keeps `expandedKeys` in one place, which is
 * what makes "only one at a time" a property of the group rather than five rows
 * each watching the others.
 *
 * Crystal owns the material and two rules:
 *
 *   - **The header meets 44px.** It is the whole row's press target, so the
 *     padding is what reaches the floor rather than a grown hit area — there is
 *     nothing beside it to overlap.
 *   - **The chevron's rotation is a CSS end state.** `icon-turn` plays it, but
 *     the turned chevron is correct at rest whether or not the recipe ran: a
 *     reduced-motion reader, a re-render mid-animation and a server-rendered
 *     expanded row all have to show a chevron pointing the right way. This is
 *     the rule `Burger` established.
 */
import {
  Disclosure, DisclosureGroup, DisclosurePanel, Button as AriaButton,
  type DisclosureGroupProps,
} from 'react-aria-components';
import { useMotion } from '../../motion/useMotion.js';
import { cx } from '../../styles/cx.js';
import styles from './Accordion.module.scss';
import type { ReactNode } from 'react';

export interface AccordionItem {
  /** Identifies the row, and is what `expandedKeys` names. */
  id: string;
  title: ReactNode;
  children: ReactNode;
  isDisabled?: boolean;
}

export interface AccordionProps
  extends Omit<DisclosureGroupProps, 'children' | 'className' | 'style'> {
  items: readonly AccordionItem[];
  className?: string;
}

/* One chevron, rotated by CSS. A second glyph for the open state would be two
   pictures of one thing, and the two would drift. */
function Chevron(): ReactNode {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className={styles['chevron']}>
      <path d="m8 10 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Row({ item }: { item: AccordionItem }): ReactNode {
  const [scope, play] = useMotion();

  return (
    <Disclosure
      id={item.id}
      {...(item.isDisabled === undefined ? {} : { isDisabled: item.isDisabled })}
      className={cx(styles['row'])}
    >
      {({ isExpanded }) => (
        <>
          <h3 className={styles['heading']}>
            <AriaButton
              slot="trigger"
              ref={scope as never}
              className={cx(styles['trigger'])}
              /* The turn is played when somebody opens or closes the row, and the
                 rotation itself is in CSS, keyed off React Aria's `data-expanded`
                 on the row. So the recipe animates a change the stylesheet has
                 already decided the end of. */
              onPress={() => { void play('icon-turn'); }}
            >
              <span className={styles['title']}>{item.title}</span>
              <Chevron />
            </AriaButton>
          </h3>
          <DisclosurePanel className={cx(styles['panel'])}>
            <div className={styles['content']} data-expanded={isExpanded ? '' : undefined}>
              {item.children}
            </div>
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
}

export function Accordion({ items, className, ...props }: AccordionProps): ReactNode {
  return (
    <DisclosureGroup {...props} className={cx(styles['accordion'], className)}>
      {items.map((item) => <Row key={item.id} item={item} />)}
    </DisclosureGroup>
  );
}
