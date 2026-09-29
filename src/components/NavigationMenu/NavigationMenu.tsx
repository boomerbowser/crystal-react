'use client';

/* NavigationMenu — a horizontal bar whose items open rich panels beneath them.
 *
 * **It is not a `menu`, and that is the whole point of it existing separately
 * from `Menubar`.** `role="menu"` and `role="menuitem"` describe an
 * application's command surface: choosing an item runs something. A site's
 * primary navigation is a set of destinations, and announcing a link as a
 * `menuitem` tells a reader that following it performs a command. It also
 * imports the menu keyboard model — arrow keys to move, Tab to escape, no Tab
 * between items — which is wrong for a panel full of links a reader expects to
 * Tab through.
 *
 * So: a `nav` landmark containing disclosure buttons, each with
 * `aria-expanded` and `aria-controls`, each disclosing a panel of ordinary
 * links. This is the shape the WAI-ARIA Authoring Practices recommends for
 * navigation with fly-outs, and it is the one Crystal's catalogue describes —
 * "a horizontal menu whose items open rich panels beneath them" is a disclosure
 * pattern wearing a menu's name.
 *
 * **One panel at a time.** Opening a second closes the first, because two
 * overlapping panels beneath a bar is a layout with no reading order.
 *
 * **Escape closes and returns focus to the trigger.** Without the return, a
 * reader who dismisses a panel is left focused on nothing, at the top of the
 * document, with no indication of where they were.
 *
 * **The panel is Frost.** The catalogue's material line: the trigger inherits
 * whatever bar it sits in, and the panel is Frost because it is a reading
 * surface — a sheet of content that appears in the page, not a control plane
 * floating over it.
 */
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import { useMotion } from '../../motion/useMotion.js';
import { usePlayOnChange } from '../../motion/useChangeMotion.js';
import styles from './NavigationMenu.module.scss';

export interface NavigationMenuSection {
  id: string;
  /** The trigger's label, and the panel's accessible name. */
  label: string;
  /** The panel's content — ordinary links, which is what makes this navigation. */
  children: ReactNode;
}

export interface NavigationMenuProps {
  sections: NavigationMenuSection[];
  /** Names the landmark, so two navigation regions are distinguishable. */
  'aria-label'?: string;
  className?: string;
}

export function NavigationMenu({ sections, className, ...props }: NavigationMenuProps): React.JSX.Element {
  const base = useId();
  const [open, setOpen] = useState<string | null>(null);
  const triggers = useRef(new Map<string, HTMLButtonElement | null>());

  const close = useCallback((returnFocusTo?: string) => {
    setOpen(null);
    /* Focus goes back to the trigger. A reader who dismisses a panel and is
       left focused on nothing has no indication of where they were. */
    if (returnFocusTo) triggers.current.get(returnFocusTo)?.focus();
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') close(open);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); };
  }, [open, close]);

  return (
    <nav aria-label={props['aria-label'] ?? 'Main'} className={cx(styles['menu'], className)}>
      <ul className={cx(styles['bar'])}>
        {sections.map((section) => {
          const panelId = `${base}-${section.id}`;
          const isOpen = open === section.id;
          return (
            <li key={section.id} className={cx(styles['section'])}>
              <button
                type="button"
                ref={(node) => { triggers.current.set(section.id, node); }}
                aria-expanded={isOpen}
                aria-controls={panelId}
                /* One panel at a time: two overlapping panels beneath a bar is
                   a layout with no reading order. */
                onClick={() => { setOpen(isOpen ? null : section.id); }}
                className={cx(styles['trigger'], 'cr-bare')}
              >
                {section.label}
              </button>
              <Panel id={panelId} label={section.label} isOpen={isOpen}>
                {section.children}
              </Panel>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* A section's panel: `menu-in` as it opens, and `menu-out` as it closes — kept
   shown, and inert, while it leaves, then hidden. Neither on the render that
   loads the bar. */
function Panel({ id, label, isOpen, children }: {
  id: string;
  label: string;
  isOpen: boolean;
  children: ReactNode;
}): React.JSX.Element {
  const [scope, play] = useMotion();
  const [leaving, setLeaving] = useState(false);
  usePlayOnChange(isOpen, (was, is) => (is ? 'menu-in' : was ? 'menu-out' : null), (recipe) => {
    if (recipe !== 'menu-out') return play(recipe);
    setLeaving(true);
    return play(recipe).finally(() => { setLeaving(false); });
  });
  return (
    <div
      ref={scope as never}
      id={id}
      aria-label={label}
      hidden={!isOpen && !leaving}
      {...(leaving ? { inert: true } : {})}
      className={cx(styles['panel'])}
    >
      {children}
    </div>
  );
}
