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
 * It also answers the catalogue's quietest line — "content is not hidden from
 * search when collapsed unless intended" — by hiding the panel with
 * `hidden="until-found"` rather than `display: none`, so find-in-page still
 * reaches a collapsed answer and opens the row on the way. That is not something
 * this library had to add; it is the reason to use React Aria's disclosure rather
 * than assemble one.
 *
 * Crystal owns the material and three rules:
 *
 *   - **The header meets 44px.** It is the whole row's press target, so the
 *     padding is what reaches the floor rather than a grown hit area — there is
 *     nothing beside it to overlap.
 *   - **The chevron's rotation is a CSS end state.** `icon-turn` plays on the
 *     chevron *and only the chevron*: the recipe is a rotate-and-scale torsion,
 *     and on the header button it would turn the title with it. The turned
 *     chevron is correct at rest whether or not the recipe ran — a
 *     reduced-motion reader, a re-render mid-animation and a server-rendered
 *     expanded row all need that. This is the rule `Burger` established.
 *   - **`accordion-in` plays on the content, not on the panel.** Crystal's recipe
 *     is a clip and a fade — "animate visible content after expanding; no
 *     scripted height measurement needed" — which is a different mechanism from
 *     React Aria's `--disclosure-panel-height`, and the two do not need to agree.
 *
 * `accordion-out` is not played here, and the reason is worth stating rather than
 * leaving as an omission. React Aria applies `hidden` to the panel as soon as the
 * *panel's own* animations settle, and Crystal's exit recipe animates the content
 * inside it — so the content would be hidden before it had finished leaving.
 * Crystal's own note on the recipe says to "hide content after completion", which
 * needs whoever owns the hiding to wait. `Collapse` owns its own unmount and does
 * exactly that; a row here does not.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import {
  Disclosure, DisclosureGroup, DisclosurePanel, Button as AriaButton,
  type DisclosureGroupProps,
} from 'react-aria-components';
import { useMotion } from '../../motion/useMotion.js';
import { cx } from '../../styles/cx.js';
import styles from './Accordion.module.scss';

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

/** The content, with the clip-and-fade that plays when the row opens. */
function Content({ isExpanded, children }: { isExpanded: boolean; children: ReactNode }): ReactNode {
  const [scope, play] = useMotion();
  const settled = useRef(false);

  useEffect(() => {
    /* The first pass is not a change: a row that is open when the page loads has
       not just opened, and nothing moves at rest. */
    if (!settled.current) { settled.current = true; return; }
    if (isExpanded) void play('accordion-in');
  }, [isExpanded, play]);

  return <div ref={scope as never} className={styles['content']}>{children}</div>;
}

function Row({ item }: { item: AccordionItem }): ReactNode {
  /* The scope is on the chevron. `icon-turn` is a rotate-and-scale torsion, and
     on the button it would turn the title with it — and leave the final keyframe
     applied there afterwards. */
  const [chevron, turn] = useMotion();

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
              className={cx(styles['trigger'], 'cr-bare')}
              onPress={() => { void turn('icon-turn'); }}
            >
              <span className={styles['title']}>{item.title}</span>
              {/* One chevron, rotated by CSS. A second glyph for the open state
                  would be two pictures of one thing, and the two would drift. */}
              <svg
                ref={chevron as never}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
                className={styles['chevron']}
              >
                <path d="m8 10 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </AriaButton>
          </h3>
          <DisclosurePanel className={cx(styles['panel'])}>
            <Content isExpanded={isExpanded}>{item.children}</Content>
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
